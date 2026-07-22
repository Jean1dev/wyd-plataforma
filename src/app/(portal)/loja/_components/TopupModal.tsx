"use client";

import { useEffect, useState } from "react";
import { Button, Input } from "@/components/ui";
import { formatDonate } from "@/lib/donate/format";
import { TOPUP_PACKAGES, formatBRL, packageBonus, type TopupPackage } from "@/lib/donate/packages";

type Props = {
  onClose: () => void;
  onBalance: (balance: string) => void;
};

type PaymentMethod = "pix" | "card";

type Charge = {
  method: PaymentMethod;
  externalReference: string;
  credits: number;
  qrCode?: string | null;
  pixCopiaECola?: string | null;
  paymentLinkUrl?: string | null;
  paymentLinkId?: string | null;
};

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

// The QR comes from the provider as an image (base64 or data URL) or a URL.
function qrSrc(qr: string): string {
  if (qr.startsWith("data:") || qr.startsWith("http")) return qr;
  return `data:image/png;base64,${qr}`;
}

export function TopupModal({ onClose, onBalance }: Props) {
  const [selected, setSelected] = useState<TopupPackage>(TOPUP_PACKAGES[0]);
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [needsProfile, setNeedsProfile] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [charge, setCharge] = useState<Charge | null>(null);
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState<PaymentMethod | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Prefill payer profile.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/donate/profile");
        const data = (await res.json().catch(() => ({}))) as { found?: boolean; name?: string; cpf?: string };
        if (!alive) return;
        setName(data.name ?? "");
        setCpf(data.cpf ?? "");
        setNeedsProfile(!data.found);
      } catch {
        if (alive) setNeedsProfile(true);
      } finally {
        if (alive) setProfileLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Poll for confirmation once a charge exists.
  useEffect(() => {
    if (!charge || paid) return;
    let alive = true;
    const startedAt = Date.now();
    const timer = setInterval(async () => {
      if (!alive || Date.now() - startedAt > POLL_TIMEOUT_MS) {
        clearInterval(timer);
        return;
      }
      try {
        const res = await fetch(`/api/donate/topup/${encodeURIComponent(charge.externalReference)}/status`);
        if (!res.ok) return;
        const data = (await res.json()) as { paid?: boolean; new_balance?: string };
        if (data.paid && alive) {
          clearInterval(timer);
          setPaid(true);
          onBalance(String(data.new_balance ?? "0"));
        }
      } catch {
        // transient; keep polling
      }
    }, POLL_INTERVAL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [charge, paid, onBalance]);

  async function generate() {
    setBusy(true);
    setError(null);
    setCopied(null);
    const paymentMethod = method;
    const paymentWindow = paymentMethod === "card" ? window.open("", "_blank") : null;

    try {
      const res = await fetch(paymentMethod === "card" ? "/api/donate/topup/card" : "/api/donate/topup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          paymentMethod === "pix" && needsProfile
            ? { package_id: selected.id, name, cpf }
            : { package_id: selected.id },
        ),
      });
      const data = (await res.json().catch(() => ({}))) as {
        external_reference?: string;
        qr_code?: string | null;
        pix_copia_e_cola?: string | null;
        payment_link_url?: string | null;
        payment_link_id?: string | null;
        credits?: number;
        error?: string;
      };
      if (!res.ok) {
        if (data.error === "payer_profile_required") {
          setNeedsProfile(true);
          throw new Error("Informe nome e CPF para continuar.");
        }
        if (res.status === 502) throw new Error("Serviço de pagamento indisponível. Tente novamente.");
        throw new Error(
          paymentMethod === "card"
            ? "Não foi possível gerar o link de pagamento."
            : "Não foi possível gerar a cobrança PIX.",
        );
      }

      if (paymentMethod === "card") {
        const paymentLinkUrl = data.payment_link_url ?? "";
        if (!paymentLinkUrl) {
          throw new Error("Não foi possível gerar o link de pagamento.");
        }
        if (paymentWindow) {
          paymentWindow.opener = null;
          paymentWindow.location.href = paymentLinkUrl;
        }
        setCharge({
          method: "card",
          externalReference: String(data.external_reference),
          paymentLinkUrl,
          paymentLinkId: data.payment_link_id ?? null,
          credits: Number(data.credits ?? selected.credits),
        });
        return;
      }

      setCharge({
        method: "pix",
        externalReference: String(data.external_reference),
        qrCode: data.qr_code ?? null,
        pixCopiaECola: data.pix_copia_e_cola ?? null,
        credits: Number(data.credits ?? selected.credits),
      });
    } catch (err) {
      if (paymentWindow && !paymentWindow.closed) paymentWindow.close();
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function copyText(value: string, copiedMethod: PaymentMethod) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(copiedMethod);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.62)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--grad-panel)",
          border: "1px solid var(--iron-400)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--bevel-raise), var(--shadow-md)",
          padding: 22,
          display: "grid",
          gap: 16,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--gold-300)", margin: 0 }}>
            Recarregar créditos
          </h2>
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>

        {paid ? (
          <div style={{ display: "grid", gap: 12, textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 40 }}>✓</div>
            <div style={{ fontFamily: "var(--font-body)", color: "var(--emerald-400)", fontSize: 16 }}>
              Pagamento confirmado! {charge ? formatDonate(charge.credits) : ""} créditos adicionados.
            </div>
            <Button type="button" onClick={onClose}>
              Concluir
            </Button>
          </div>
        ) : charge ? (
          <div style={{ display: "grid", gap: 14, textAlign: "center" }}>
            {charge.method === "pix" ? (
              <>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-muted)" }}>
                  Escaneie o QR Code ou use o PIX copia e cola. A confirmação é automática.
                </div>
                {charge.qrCode ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrSrc(charge.qrCode)}
                    alt="QR Code PIX"
                    style={{
                      width: 220,
                      height: 220,
                      margin: "0 auto",
                      background: "#fff",
                      borderRadius: "var(--radius-sm)",
                      padding: 8,
                    }}
                  />
                ) : null}
                {charge.pixCopiaECola ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--text-muted)",
                        wordBreak: "break-all",
                        background: "var(--surface-inset)",
                        boxShadow: "var(--bevel-in)",
                        borderRadius: "var(--radius-sm)",
                        padding: 10,
                        maxHeight: 90,
                        overflowY: "auto",
                      }}
                    >
                      {charge.pixCopiaECola}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => copyText(String(charge.pixCopiaECola), "pix")}
                    >
                      {copied === "pix" ? "Copiado!" : "Copiar código PIX"}
                    </Button>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-muted)" }}>
                  Finalize o pagamento no Stripe. Use o link abaixo se a nova guia não abriu.
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--text-muted)",
                    wordBreak: "break-all",
                    background: "var(--surface-inset)",
                    boxShadow: "var(--bevel-in)",
                    borderRadius: "var(--radius-sm)",
                    padding: 10,
                    maxHeight: 90,
                    overflowY: "auto",
                  }}
                >
                  {charge.paymentLinkUrl}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (charge.paymentLinkUrl) window.open(charge.paymentLinkUrl, "_blank", "noopener,noreferrer");
                    }}
                  >
                    Abrir link
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (charge.paymentLinkUrl) copyText(charge.paymentLinkUrl, "card");
                    }}
                  >
                    {copied === "card" ? "Copiado!" : "Copiar link"}
                  </Button>
                </div>
              </>
            )}
            <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-muted)" }}>
              Aguardando pagamento…
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
              {(
                [
                  ["pix", "PIX"],
                  ["card", "Cartão"],
                ] as const
              ).map(([value, label]) => {
                const active = method === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setMethod(value);
                      setCopied(null);
                      setError(null);
                    }}
                    style={{
                      padding: "10px 12px",
                      cursor: "pointer",
                      textAlign: "center",
                      background: active ? "var(--surface-inset)" : "transparent",
                      border: `1px solid ${active ? "var(--gold-400)" : "var(--iron-400)"}`,
                      borderRadius: "var(--radius-sm)",
                      color: active ? "var(--gold-300)" : "var(--parchment-100)",
                      fontFamily: "var(--font-body)",
                      fontWeight: 700,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {TOPUP_PACKAGES.map((p) => {
                const active = p.id === selected.id;
                const bonus = packageBonus(p);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelected(p)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      cursor: "pointer",
                      textAlign: "left",
                      background: active ? "var(--surface-inset)" : "transparent",
                      border: `1px solid ${active ? "var(--gold-400)" : "var(--iron-400)"}`,
                      borderRadius: "var(--radius-sm)",
                      color: "var(--parchment-100)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    <span>
                      <span style={{ fontWeight: 700 }}>{p.label}</span>
                      <span style={{ display: "block", fontSize: 13, color: "var(--gold-300)" }}>
                        ◆ {formatDonate(p.credits)} créditos
                        {bonus > 0 ? (
                          <span style={{ color: "var(--emerald-400)" }}> (+{formatDonate(bonus)} grátis)</span>
                        ) : null}
                      </span>
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--gold-300)" }}>
                      {formatBRL(p.amountCents)}
                    </span>
                  </button>
                );
              })}
            </div>

            {method === "pix" && profileLoaded && needsProfile ? (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-muted)" }}>
                  Precisamos do nome e CPF do pagador (salvos para as próximas recargas).
                </div>
                <Input label="Nome do pagador" value={name} onChange={(e) => setName(e.target.value)} />
                <Input label="CPF" value={cpf} onChange={(e) => setCpf(e.target.value)} inputMode="numeric" />
              </div>
            ) : null}

            {error ? (
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--danger-400, #d97b7b)" }}>
                {error}
              </div>
            ) : null}

            <Button type="button" disabled={busy || (method === "pix" && !profileLoaded)} onClick={generate}>
              {busy
                ? "Gerando…"
                : `Pagar ${formatBRL(selected.amountCents)} com ${method === "pix" ? "PIX" : "cartão"}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
