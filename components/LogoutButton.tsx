"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/actions/auth.action";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      router.push("/sign-in");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout. Please try again.");
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      size="sm"
      className="ml-auto"
    >
      Logout
    </Button>
  );
}

