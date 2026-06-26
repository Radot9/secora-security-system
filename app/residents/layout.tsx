"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface ResidentsLayoutProps {
  children: ReactNode;
}

export default function ResidentsLayout({ children }: ResidentsLayoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      // Get the currently logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // No logged-in user? Go back to login.
      if (!user) {
        router.replace("/");
        return;
      }

      // Find this user's profile
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !profile) {
        router.replace("/");
        return;
      }

      // Only residents can continue
      if (profile.role !== "resident") {
        router.replace("/");
        return;
      }

      setLoading(false);
    }

    checkAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Checking your session...
      </div>
    );
  }

  return <>{children}</>;
}
