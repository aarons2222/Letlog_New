import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser, hasRole, isLandlordOfProperty } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { user, role, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json({ error: authError || "Not authenticated" }, { status: 401 });
    }

    // Only landlords can create tenancies
    if (!hasRole(role, ["landlord"])) {
      return NextResponse.json({ error: "Only landlords can create tenancies" }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.property_id || !body.start_date || !body.rent_amount) {
      return NextResponse.json(
        { error: "Missing required fields: property_id, start_date, rent_amount" },
        { status: 400 },
      );
    }

    // Verify user owns this property
    const ownsProperty = await isLandlordOfProperty(user.id, body.property_id);
    if (!ownsProperty) {
      return NextResponse.json(
        { error: "You can only create tenancies for your own properties" },
        { status: 403 },
      );
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("tenancies")
      .insert({
        property_id: body.property_id,
        start_date: body.start_date,
        end_date: body.end_date || null,
        rent_amount: parseFloat(body.rent_amount),
        rent_frequency: body.rent_frequency || "monthly",
        deposit_amount: body.deposit_amount ? parseFloat(body.deposit_amount) : null,
        notes: body.notes || null,
        status: body.status || "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Tenancy insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("API error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
