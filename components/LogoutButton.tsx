"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-medium hover:bg-black/5"
    >
      Sign out
    </button>
  );
}
