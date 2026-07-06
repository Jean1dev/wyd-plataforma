import type { LookupStatus } from "@/lib/npc/types";

// Explains why a form picker is missing so the moderator isn't left staring at a
// blank manual field. Renders nothing when the picker is available.
export function PickerNote({
  status,
  rpc,
  contentDependent,
  manualHint,
}: {
  status: LookupStatus;
  rpc: string;
  /** True if the list depends on the web-api's -content flag (templates, items). */
  contentDependent?: boolean;
  /** What the moderator should type instead, and where the value comes from. */
  manualHint: string;
}) {
  if (status === "ok") return null;

  const reason =
    status === "empty" && contentDependent
      ? `A lista veio vazia: o web-api foi iniciado sem -content, então ${rpc} não tem dados.`
      : `Não foi possível carregar a lista: o web-api não respondeu ${rpc} (serviço fora do ar ou RPC ainda não disponível).`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "8px 11px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--gold-700)",
        background: "rgba(200,163,91,0.10)",
        fontFamily: "var(--font-body)",
        fontSize: 12,
        color: "var(--gold-200, #e6d3a3)",
      }}
    >
      <span>{reason}</span>
      <span style={{ color: "var(--text-muted)" }}>{manualHint}</span>
    </div>
  );
}

export default PickerNote;
