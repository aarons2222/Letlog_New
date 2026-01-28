import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.address_line_1 || !body.city || !body.postcode || !body.property_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use service role for insert to bypass RLS
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await serviceClient.from('properties').insert({
      landlord_id: user.id,
      address_line_1: body.address_line_1,
      address_line_2: body.address_line_2 || null,
      city: body.city,
      county: body.county || null,
      postcode: body.postcode,
      property_type: body.property_type,
      bedrooms: parseInt(body.bedrooms) || 1,
      bathrooms: parseInt(body.bathrooms) || 1,
      description: body.description || null,
    }).select().single()

    if (error) {
      console.error('Property insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
