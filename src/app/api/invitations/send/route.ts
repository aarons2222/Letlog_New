import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { email, name, tenancyId } = await req.json();

    if (!email || !tenancyId) {
      return NextResponse.json({ error: "Email and tenancy ID are required" }, { status: 400 });
    }

    // Verify the current user is authenticated (landlord)
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the tenancy exists and belongs to this landlord
    const { data: tenancy, error: tenancyError } = await supabase
      .from("tenancies")
      .select("id, property_id")
      .eq("id", tenancyId)
      .single();

    if (tenancyError || !tenancy) {
      return NextResponse.json({ error: "Tenancy not found" }, { status: 404 });
    }

    // Check for existing pending invitation for this email + tenancy
    const { data: existing } = await supabase
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
    const { error: insertError } = await supabase.from("tenant_invitations").insert({
      token,
      email: email.toLowerCase(),
      name: name || null,
      tenancy_id: tenancyId,
      invited_by: user.id,
      status: "pending",
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error("Error inserting invitation:", insertError);
      return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
    }

    // Use Supabase admin to send the invite email
    // This sends a "magic link" style email that creates/invites the user
    const adminClient = createAdminClient();
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
        console.error("Error sending invite email:", inviteError);
        // Clean up the invitation record since email failed
        await supabase.from("tenant_invitations").delete().eq("token", token);

        return NextResponse.json({ error: "Failed to send invitation email" }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
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
