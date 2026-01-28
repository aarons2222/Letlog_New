"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Shared hook that replaces the boilerplate pattern found in 15+ pages:
 *
 *   const supabase = createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *   if (!user) { ... }
 *
 * Returns a stable Supabase client, the authenticated user (or null),
 * and a loading flag.
 */
export function useSupabase() {
  const supabaseRef = useRef(createClient());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const {
          data: { user: authUser },
        } = await supabaseRef.current.auth.getUser();
        if (!cancelled) {
          setUser(authUser);
        }
      } catch (err) {
        console.error("useSupabase: failed to get user", err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    supabase: supabaseRef.current,
    user,
    isLoading,
  };
}
