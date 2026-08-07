"use client";

import { useState, type CSSProperties } from "react";
import { Button } from "@/components/ui";

const commandBox: CSSProperties = {
  display: "block",
  padding: "12px 14px",
  borderRadius: "var(--radius-md)",
  background: "var(--surface-inset)",
  border: "1px solid var(--iron-400)",
  boxShadow: "var(--bevel-in)",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  lineHeight: 1.55,
  color: "var(--parchment-100)",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

type Props = {
  label: string;
  command: string;
  tone?: "gold" | "muted";
};

export function CopyCommand({ label, command, tone = "gold" }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <div
          className="wyd-eyebrow"
          style={{ color: tone === "gold" ? "var(--gold-400)" : "var(--text-muted)" }}
        >
          {label}
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={copy}>
          {copied ? "Copiado!" : "Copiar"}
        </Button>
      </div>
      <code style={commandBox}>{command}</code>
    </div>
  );
}

export default CopyCommand;
