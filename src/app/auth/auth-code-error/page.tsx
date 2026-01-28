"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

export default function AuthCodeError() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if user is actually authenticated (hash-based auth may have worked)
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // User is authenticated - redirect to dashboard
        router.push("/dashboard");
        return;
      }
      
      setChecking(false);
    };

    // Small delay to allow Supabase client to process hash fragments
    setTimeout(checkAuth, 1000);
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-md mx-auto p-8">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Authentication Error</h1>
        <p className="text-slate-600 mb-6">
          Something went wrong during sign in. The link may have expired.
        </p>
        <a
          href="/login"
          className="inline-block bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors"
        >
          Back to Login
        </a>
      </div>
    </div>
  );
}
