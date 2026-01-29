import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function DELETE() {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Delete user's profile first (this should cascade to related data)
    const { error: profileError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (profileError) {
      console.error("Profile deletion error:", profileError);
      return NextResponse.json(
        { error: "Failed to delete profile data" },
        { status: 500 }
      );
    }

    // Delete the auth user using admin API
    const { error: authDeleteError } =
      await adminClient.auth.admin.deleteUser(user.id);

    if (authDeleteError) {
      console.error("Auth user deletion error:", authDeleteError);
      return NextResponse.json(
        { error: "Failed to delete authentication account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (err: unknown) {
    console.error("Account deletion error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
