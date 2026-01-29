import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const supabase = await createClient();

    // Verify authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the tenancy exists and user owns the property
    const { data: tenancy } = await supabase
      .from("tenancies")
      .select("id, property_id, properties!inner(landlord_id)")
      .eq("id", id)
      .single();

    if (!tenancy) {
      return NextResponse.json({ error: "Tenancy not found" }, { status: 404 });
    }

    // Check ownership
    const property = tenancy.properties as { landlord_id: string };
    if (property.landlord_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    // Update tenancy status to ended
    const { error: updateError } = await adminClient
      .from("tenancies")
      .update({
        status: "ended",
        end_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", id);

    if (updateError) {
      console.error("End tenancy error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("API error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
