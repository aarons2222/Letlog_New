import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  try {
    const { token, full_name, password } = await request.json();

    if (!token || !full_name || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get invite
    const { data: invite, error: inviteError } = await supabase
      .from('tenant_invites')
      .select('*, properties(address_line_1, city)')
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 });
    }

    // Create user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invite.email,
      password,
      options: {
        data: {
          full_name,
          role: 'tenant',
        },
      },
    });

    if (authError) {
      // If user already exists, try to sign them in
      if (authError.message.includes('already registered')) {
        return NextResponse.json({ 
          error: 'An account with this email already exists. Please sign in instead.',
          code: 'USER_EXISTS' 
        }, { status: 400 });
      }
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Create profile
    await supabase.from('profiles').upsert({
      id: authData.user.id,
      email: invite.email,
      full_name,
      role: 'tenant',
    });

    // Update tenancy with tenant_id
    await supabase
      .from('tenancies')
      .update({ tenant_id: authData.user.id })
      .eq('id', invite.tenancy_id);

    // Mark invite as accepted
    await supabase
      .from('tenant_invites')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invite.id);

    return NextResponse.json({ 
      success: true,
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET to validate token
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  const { data: invite, error } = await supabase
    .from('tenant_invites')
    .select(`
      id, email, status, expires_at, created_at,
      properties (address_line_1, address_line_2, city, postcode, property_type, bedrooms),
      profiles:invited_by (full_name)
    `)
    .eq('token', token)
    .single();

  if (error || !invite) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  }

  if (invite.status !== 'pending') {
    return NextResponse.json({ error: 'Invitation already used', status: invite.status }, { status: 400 });
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invitation expired' }, { status: 400 });
  }

  return NextResponse.json({ invite });
}
