import Image from "next/image";
import { AuthTabs } from "@/components/AuthTabs";
import { SERVER_NAME } from "@/lib/portal-data";

export default function LoginPage() {
  return (
    <div
      className="wyd-screen"
      style={{
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "url('/assets/wyd-keyart.png') center/cover",
          zIndex: 0,
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "var(--vignette)", zIndex: 1 }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(10,8,5,0.58)", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <Image
            src="/assets/wyd-logo-crop.png"
            alt="WYD"
            width={189}
            height={88}
            priority
            style={{ height: 88, width: "auto", filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.85))" }}
          />
          <div
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: 12,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "var(--gold-300)",
              marginTop: 10,
              textShadow: "0 2px 8px #000",
            }}
          >
            Seu destino aguarda em {SERVER_NAME}
          </div>
        </div>

        <AuthTabs />

        <div
          style={{
            textAlign: "center",
            marginTop: 18,
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--parchment-300)",
            textShadow: "0 1px 6px #000",
          }}
        >
          Acesse de qualquer dispositivo —{" "}
          <span style={{ color: "var(--gold-300)" }}>PC, celular ou tablet</span>.
        </div>
      </div>
    </div>
  );
}
