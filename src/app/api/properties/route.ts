import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser, hasRole } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { user, role, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json({ error: authError || "Not authenticated" }, { status: 401 });
    }

    // Only landlords can list their own properties
    if (!hasRole(role, ["landlord"])) {
      return NextResponse.json({ error: "Only landlords can access properties" }, { status: 403 });
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("properties")
      .select(
        `
        *,
        tenancies(id, status, rent_amount, tenancy_tenants(id, tenant_id)),
        compliance_records(id, expiry_date)
      `,
      )
      .eq("landlord_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Properties fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("API error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, role, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json({ error: authError || "Not authenticated" }, { status: 401 });
    }

    // Only landlords can create properties
    if (!hasRole(role, ["landlord"])) {
      return NextResponse.json({ error: "Only landlords can create properties" }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.address_line_1 || !body.city || !body.postcode || !body.property_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("properties")
      .insert({
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
      })
      .select()
      .single();

    if (error) {
      console.error("Property insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("API error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
