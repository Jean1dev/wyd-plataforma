"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui";
import { NAV_LINKS } from "@/lib/portal-data";

type TopNavProps = {
  userName: string;
  isModerator?: boolean;
  donateBalance: string;
};

function initials(name: string) {
  return name
    .slice(0, 2)
    .toUpperCase()
    .padEnd(2, "?");
}

export function TopNav({ userName, isModerator = false, donateBalance }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = isModerator
    ? [
        ...NAV_LINKS,
        { href: "/admin/npcs", label: "Admin NPCs" } as const,
        { href: "/admin/mob-templates", label: "Admin Stats de Mob" } as const,
        { href: "/admin/drops", label: "Admin Drops" } as const,
        { href: "/admin/world-events", label: "Admin Eventos" } as const,
        { href: "/admin/attribute-map", label: "Admin AttributeMap" } as const,
        { href: "/admin/donate", label: "Admin Donate" } as const,
        { href: "/admin/daily-reward", label: "Admin Recompensa Diária" } as const,
      ]
    : NAV_LINKS;

  async function logout() {
    await fetch("/api/logout", { method: "POST" }).catch(() => null);
    router.push("/");
    router.refresh();
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(20,17,12,0.88)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--iron-400)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          margin: "0 auto",
          padding: "0 24px",
          minHeight: 64,
          display: "flex",
          alignItems: "center",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/dashboard"
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0" }}
        >
          <Image
            src="/assets/wyd-logo-crop.png"
            alt="WYD"
            width={77}
            height={36}
            priority
            style={{ height: 36, width: "auto", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))" }}
          />
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--gold-500)",
            }}
          >
            Portal
          </span>
        </Link>

        <nav style={{ display: "flex", gap: 4, flex: 1, flexWrap: "wrap" }}>
          {navLinks.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className="wyd-navlink"
                style={{
                  padding: "8px 14px",
                  borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font-ui)",
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: active ? "var(--gold-300)" : "var(--text-muted)",
                  borderBottom: active ? "2px solid var(--gold-500)" : "2px solid transparent",
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 12px",
              background: "var(--surface-inset)",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--gold-700)",
              boxShadow: "var(--bevel-in)",
            }}
          >
            <span style={{ color: "var(--gold-400)", fontSize: 14 }}>◈</span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                color: "var(--gold-300)",
                fontWeight: 500,
              }}
            >
              {donateBalance}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Avatar initials={initials(userName)} size={36} ring="var(--gold-600)" />
            <div style={{ lineHeight: 1.2 }}>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "var(--parchment-100)",
                  fontWeight: 600,
                }}
              >
                {userName}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--emerald-400)",
                }}
              >
                ● Online
              </div>
            </div>
          </div>

          <button
            type="button"
            title="Sair"
            onClick={logout}
            style={{
              background: "transparent",
              border: "1px solid var(--iron-400)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "7px 10px",
              fontFamily: "var(--font-ui)",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopNav;
