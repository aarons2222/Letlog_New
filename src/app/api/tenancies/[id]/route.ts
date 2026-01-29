import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/tenancies/[id] - Get single tenancy
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: tenancy, error } = await supabase
    .from('tenancies')
    .select(`
      *,
      properties (
        id,
        address_line_1,
        city,
        postcode,
        landlord_id
      )
    `)
    .eq('id', id)
    .single();

  if (error || !tenancy) {
    return NextResponse.json({ error: 'Tenancy not found' }, { status: 404 });
  }

  // Check ownership
  if (tenancy.properties?.landlord_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  return NextResponse.json(tenancy);
}

// DELETE /api/tenancies/[id] - Delete tenancy
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // First verify the user owns this tenancy (via property)
  const { data: tenancy, error: fetchError } = await supabase
    .from('tenancies')
    .select(`
      id,
      status,
      properties (
        landlord_id
      )
    `)
    .eq('id', id)
    .single();

  if (fetchError || !tenancy) {
    return NextResponse.json({ error: 'Tenancy not found' }, { status: 404 });
  }

  // Check ownership
  if (tenancy.properties?.landlord_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Use admin client to bypass RLS for delete operations
  const adminClient = createAdminClient();

  // Delete related records first (tenant invites, etc.)
  const { error: inviteError } = await adminClient
    .from('tenant_invites')
    .delete()
    .eq('tenancy_id', id);

  if (inviteError) {
    console.error('Delete invites error:', inviteError);
    // Continue anyway - invites table might not exist or be empty
  }

  // Delete the tenancy
  const { error: deleteError } = await adminClient
    .from('tenancies')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('Delete tenancy error:', deleteError);
    return NextResponse.json(
      { error: `Failed to delete tenancy: ${deleteError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: 'Tenancy deleted' });
}
