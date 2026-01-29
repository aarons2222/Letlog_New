import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser, hasRole, isLandlordOfProperty } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, name, tenancyId } = await req.json();

    if (!email || !tenancyId) {
      return NextResponse.json({ error: "Email and tenancy ID are required" }, { status: 400 });
    }

    // Verify the current user is authenticated and is a landlord
    const { user, role, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
    }

    // Only landlords can send invitations
    if (!hasRole(role, ["landlord"])) {
      return NextResponse.json({ error: "Only landlords can send tenant invitations" }, { status: 403 });
    }

    const adminClient = createAdminClient();

    // Verify the tenancy exists
    const { data: tenancy, error: tenancyError } = await adminClient
      .from("tenancies")
      .select("id, property_id")
      .eq("id", tenancyId)
      .single();

    if (tenancyError || !tenancy) {
      return NextResponse.json({ error: "Tenancy not found" }, { status: 404 });
    }

    // Verify user owns this property
    const ownsProperty = await isLandlordOfProperty(user.id, tenancy.property_id);
    if (!ownsProperty) {
      return NextResponse.json(
        { error: "You can only send invitations for your own properties" },
        { status: 403 },
      );
    }

    // Check for existing pending invitation for this email + tenancy
    const { data: existing } = await adminClient
      .from("tenant_invitations")
      .select("id")
      .eq("email", email.toLowerCase())
      .eq("tenancy_id", tenancyId)
      .eq("status", "pending")
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email for this tenancy" },
        { status: 409 },
      );
    }

    // Generate a unique token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // Insert invitation record
    const insertData = {
      token,
      email: email.toLowerCase(),
      name: name || null,
      tenancy_id: tenancyId,
      invited_by: user.id,
      status: "pending",
      expires_at: expiresAt,
    };
    console.log("Inserting invitation:", insertData);
    
    const { data: insertedData, error: insertError } = await adminClient
      .from("tenant_invitations")
      .insert(insertData)
      .select();

    console.log("Insert result:", insertedData, insertError);

    if (insertError) {
      console.error("Error inserting invitation:", insertError);
      return NextResponse.json({ error: "Failed to create invitation: " + insertError.message }, { status: 500 });
    }

    // Use Supabase admin to send the invite email
    // This sends a "magic link" style email that creates/invites the user
    const inviteUrl = `https://www.letlog.uk/invite/${token}`;

    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email.toLowerCase(),
      {
        redirectTo: inviteUrl,
        data: {
          full_name: name || "",
          role: "tenant",
          invitation_token: token,
        },
      },
    );

    if (inviteError) {
      // If the user already exists in auth, that's okay - we still created the invitation
      // They can use the invite link to accept
      if (
        inviteError.message?.includes("already been registered") ||
        inviteError.message?.includes("already exists")
      ) {
        console.log("User already exists in auth, invitation record created");
      } else {
        // Email failed but invitation record exists - still return success
        // Landlord can share the invite link manually
        console.error("Email send failed (SMTP not configured?):", inviteError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Invitation created for ${email}`,
      inviteUrl,
      token,
    });
  } catch (error: any) {
    console.error("Invitation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send invitation" },
      { status: 500 },
    );
  }
}
