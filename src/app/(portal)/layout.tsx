import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession, isModerator } from "@/lib/auth/session";
import { TopNav } from "@/components/TopNav";
import { formatDonate } from "@/lib/donate/format";
import { getDonateBalance } from "@/lib/donate/balance";

// Protected routes must read the encrypted session cookie before rendering.
export const unstable_instant = false;

async function loadDonateBalance(accountId: string | undefined): Promise<string> {
  if (!accountId) return "0";
  const balance = await getDonateBalance(accountId);
  return balance === null ? "--" : formatDonate(balance);
}

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const donateBalance = await loadDonateBalance(session.accountId);

  return (
    <div>
      <TopNav userName={session.name ?? "Jogador"} isModerator={isModerator(session)} donateBalance={donateBalance} />
      <main>{children}</main>
    </div>
  );
}
