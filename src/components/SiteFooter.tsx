import Link from "next/link";
import { DISCORD_INVITE_URL, SERVER_NAME } from "@/lib/portal-data";

export function SiteFooter() {
  return (
    <footer className="wyd-footer">
      <div className="wyd-footer__inner">
        <div className="wyd-footer__tag">
          <span>{SERVER_NAME}</span>
          <i />
          <span>With Your Destiny</span>
        </div>
        <nav className="wyd-footer__links" aria-label="Rodapé">
          <Link href="/download">Download</Link>
          <Link href="/comunidade">Comunidade</Link>
          <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer">
            Discord
          </a>
        </nav>
      </div>
    </footer>
  );
}

export default SiteFooter;
