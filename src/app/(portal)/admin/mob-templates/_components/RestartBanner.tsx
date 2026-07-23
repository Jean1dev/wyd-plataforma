// Plain presentational panel (no client hooks) — reused by both the picker
// page and the edit page. Unlike other admin tools here (NPCs, donate shop),
// mob template stats never hot-reload: the tmServer only materializes
// overrides at boot, and only when started with -mob-stat-editing.
export function RestartBanner() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "10px 13px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--gold-700)",
        background: "rgba(200,163,91,0.10)",
        fontFamily: "var(--font-body)",
        fontSize: 13,
        color: "var(--gold-200, #e6d3a3)",
        marginBottom: 20,
      }}
    >
      <span>
        <strong>Sem hot-reload.</strong> As alterações só valem no jogo após o próximo restart do
        servidor (tmServer iniciado com a flag <code>-mob-stat-editing</code>).
      </span>
      <span style={{ color: "var(--text-muted)" }}>
        Não existe &quot;aplicar agora&quot; — se o jogo não refletir uma edição salva aqui, o
        primeiro suspeito é essa flag, não este painel.
      </span>
    </div>
  );
}

export default RestartBanner;
