"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type RefObject } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { Avatar } from "@/components/ui";
import { NAV_LINKS } from "@/lib/portal-data";

type TopNavProps = {
  userName: string;
  isModerator?: boolean;
  donateBalance: string;
};

type NavLinkDef = { href: string; label: string };

const ADMIN_LINKS: readonly NavLinkDef[] = [
  { href: "/admin/npcs", label: "NPCs" },
  { href: "/admin/mob-templates", label: "Stats de Mob" },
  { href: "/admin/drops", label: "Drops" },
  { href: "/admin/world-events", label: "Eventos" },
  { href: "/admin/attribute-map", label: "AttributeMap" },
  { href: "/admin/donate", label: "Donate" },
  { href: "/admin/daily-reward", label: "Recompensa Diária" },
  { href: "/admin/revenue", label: "Faturamento" },
  { href: "/admin/launcher", label: "Launcher" },
];

function initials(name: string) {
  return name
    .slice(0, 2)
    .toUpperCase()
    .padEnd(2, "?");
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// <details> menus stay open across client navigations; close them on pick.
function closeMenu(ref: RefObject<HTMLDetailsElement | null>) {
  if (ref.current) ref.current.open = false;
}

export function TopNav({ userName, isModerator = false, donateBalance }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const adminMenu = useRef<HTMLDetailsElement>(null);
  const burgerMenu = useRef<HTMLDetailsElement>(null);
  const adminActive = ADMIN_LINKS.some((l) => isActive(pathname, l.href));

  // Dropdowns close on outside click / Escape, like a native menu.
  useEffect(() => {
    const menus = [adminMenu, burgerMenu];
    function onPointerDown(e: PointerEvent) {
      for (const m of menus) {
        if (m.current?.open && !m.current.contains(e.target as Node)) m.current.open = false;
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") menus.forEach(closeMenu);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  async function logout() {
    await fetch("/api/logout", { method: "POST" }).catch(() => null);
    router.push("/");
    router.refresh();
  }

  function renderLinks(links: readonly NavLinkDef[], menu?: RefObject<HTMLDetailsElement | null>) {
    return links.map((l) => (
      <Link
        key={l.href}
        href={l.href}
        className="wyd-navlink"
        aria-current={isActive(pathname, l.href) ? "page" : undefined}
        onClick={menu ? () => closeMenu(menu) : undefined}
      >
        {l.label}
      </Link>
    ));
  }

  return (
    <header className="wyd-topnav">
      <div className="wyd-topnav__inner">
        <Link href="/dashboard" className="wyd-topnav__brand">
          <Image
            src="/assets/wyd-logo-crop.png"
            alt="WYD"
            width={77}
            height={36}
            priority
            style={{ height: 36, width: "auto", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))" }}
          />
          <span>Portal</span>
        </Link>

        <nav className="wyd-topnav__links" aria-label="Principal">
          {renderLinks(NAV_LINKS)}
          {isModerator ? (
            <details ref={adminMenu} className="wyd-menu">
              <summary className="wyd-navlink" aria-current={adminActive ? "page" : undefined}>
                Admin<span className="wyd-menu__caret">▼</span>
              </summary>
              <div className="wyd-menu__panel">{renderLinks(ADMIN_LINKS, adminMenu)}</div>
            </details>
          ) : null}
        </nav>

        <div className="wyd-topnav__right">
          {/* Plain anchor: /jogar is a route handler that mints a one-use ticket, so it must not be prefetched. */}
          <a href="/jogar" className="wyd-btn wyd-btn--cta wyd-btn--sm">
            Jogar
          </a>
          <div className="wyd-balance" title="Saldo de Donate">
            <span className="wyd-balance__gem">◈</span>
            {donateBalance}
          </div>

          <div className="wyd-user">
            <Avatar initials={initials(userName)} size={36} ring="var(--gold-600)" />
            <div className="wyd-user__meta" style={{ lineHeight: 1.2 }}>
              <div className="wyd-user__name">{userName}</div>
              <div className="wyd-user__status">● Online</div>
            </div>
          </div>

          <button type="button" title="Sair" onClick={logout} className="wyd-icon-btn">
            Sair
          </button>

          <details ref={burgerMenu} className="wyd-menu wyd-topnav__burger">
            <summary aria-label="Menu">
              <Menu size={20} />
            </summary>
            <nav className="wyd-menu__panel" aria-label="Menu">
              {renderLinks(NAV_LINKS, burgerMenu)}
              {isModerator ? (
                <>
                  <div className="wyd-menu__heading">Admin</div>
                  {renderLinks(ADMIN_LINKS, burgerMenu)}
                </>
              ) : null}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

export default TopNav;
