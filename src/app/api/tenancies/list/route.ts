import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser, hasRole } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { user, role, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json({ error: authError || "Not authenticated" }, { status: 401 });
    }

    if (!hasRole(role, ["landlord"])) {
      return NextResponse.json({ error: "Only landlords can view tenancies" }, { status: 403 });
    }

    const adminClient = createAdminClient();

    // Get landlord's properties
    const { data: properties } = await adminClient
      .from("properties")
      .select("id")
      .eq("landlord_id", user.id);

    if (!properties || properties.length === 0) {
      return NextResponse.json({ data: [], properties: [] });
    }

    const propIds = properties.map((p) => p.id);

    // Get tenancies with property info
    const { data: tenancies, error: tenancyError } = await adminClient
      .from("tenancies")
      .select(`
        *,
        properties (address_line_1, city, postcode, bedrooms, property_type)
      `)
      .in("property_id", propIds)
      .order("created_at", { ascending: false });

    if (tenancyError) {
      console.error("Tenancy fetch error:", tenancyError);
      return NextResponse.json({ error: tenancyError.message }, { status: 500 });
    }

    // Enrich with tenant profiles and pending invitations
    const enriched = await Promise.all(
      (tenancies || []).map(async (t) => {
        let tenant_profile = null;
        let pending_invite = null;

        // Get tenant profile if tenant_id exists
        if (t.tenant_id) {
          const { data: profile } = await adminClient
            .from("profiles")
            .select("full_name, email")
            .eq("id", t.tenant_id)
            .maybeSingle();
          tenant_profile = profile;
        }

        // Check for pending invite
        const { data: invite, error: inviteError } = await adminClient
          .from("tenant_invitations")
          .select("email, name")
          .eq("tenancy_id", t.id)
          .eq("status", "pending")
          .maybeSingle();
        
        if (inviteError) {
          console.error("Invite fetch error for tenancy", t.id, inviteError);
        }
        pending_invite = invite;

        return {
          ...t,
          tenant_profile,
          pending_invite,
        };
      })
    );

    return NextResponse.json({ data: enriched });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("API error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
