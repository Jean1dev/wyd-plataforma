import type { ReactNode } from "react";
import { TopNav } from "@/components/TopNav";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <TopNav />
      <main>{children}</main>
    </div>
  );
}
