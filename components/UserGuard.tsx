"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function UserGuard({ user }: { user: any }) {
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      toast.error("User not found. Please sign up.");
      router.push("/sign-up");
    }
  }, [user, router]);

  if (!user) {
    return <div className="text-center mt-10">User not found. Redirecting to sign-up...</div>;
  }

  return null;
} 