"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { deleteMobTemplateStat, errorMessage } from "./api";

// Unlike DeleteNpcButton, this does NOT navigate away on success: removing an
// override doesn't remove the template — GetMobTemplateStat just goes back to
// overridden:false (read-through raw-file values), so we stay on this page.
export function DeleteStatButton({ templateName }: { templateName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!window.confirm(`Remover o override de "${templateName}"? O template volta aos valores do arquivo.`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteMobTemplateStat(templateName);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button type="button" variant="ghost" onClick={remove} disabled={busy}>
        Remover override
      </Button>
      {error ? <div style={{ color: "var(--danger-400, #d97b7b)", fontSize: 12, marginTop: 6 }}>{error}</div> : null}
      <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
        O arquivo em <code>npc/</code> nunca é apagado — isso apenas reverte para os valores crus dele.
      </div>
    </div>
  );
}

export default DeleteStatButton;
