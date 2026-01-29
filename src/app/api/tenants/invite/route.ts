import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, tenancy_id, property_id } = await request.json();

    if (!email || !tenancy_id || !property_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify landlord owns this property
    const { data: property } = await supabase
      .from('properties')
      .select('id, address_line_1, city, postcode, landlord_id')
      .eq('id', property_id)
      .eq('landlord_id', user.id)
      .single();

    if (!property) {
      return NextResponse.json({ error: 'Property not found or not authorized' }, { status: 403 });
    }

    // Get landlord profile
    const { data: landlord } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    // Create invite
    const { data: invite, error: inviteError } = await supabase
      .from('tenant_invites')
      .insert({
        tenancy_id,
        property_id,
        email: email.toLowerCase(),
        invited_by: user.id,
      })
      .select('token')
      .single();

    if (inviteError) {
      console.error('Invite error:', inviteError);
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
    }

    // Send email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://letlog.uk'}/invite/${invite.token}`;
    
    try {
      await resend.emails.send({
        from: 'LetLog <noreply@letlog.uk>',
        to: email,
        subject: `You've been invited to join a tenancy on LetLog`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #E8998D;">Welcome to LetLog</h1>
            <p>${landlord?.full_name || 'Your landlord'} has invited you to join a tenancy at:</p>
            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <strong>${property.address_line_1}</strong><br>
              ${property.city}, ${property.postcode}
            </div>
            <p>Click the button below to accept the invitation and create your account:</p>
            <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(to right, #E8998D, #F4A261); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Accept Invitation
            </a>
            <p style="color: #666; font-size: 14px; margin-top: 24px;">
              This invitation expires in 7 days.<br>
              If you didn't expect this email, you can safely ignore it.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail the whole request if email fails
    }

    return NextResponse.json({ success: true, token: invite.token });
  } catch (error) {
    console.error('Invite tenant error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
