import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession, isModerator } from "@/lib/auth/session";
import { TopNav } from "@/components/TopNav";

// Protected routes must read the encrypted session cookie before rendering.
export const unstable_instant = false;

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  return (
    <div>
      <TopNav userName={session.name ?? "Jogador"} isModerator={isModerator(session)} />
      <main>{children}</main>
    </div>
  );
}
