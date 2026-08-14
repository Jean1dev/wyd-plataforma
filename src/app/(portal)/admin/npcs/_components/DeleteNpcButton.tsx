"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { deleteNpc, errorMessage } from "./api";

export function DeleteNpcButton({ npcId, slug, origin }: { npcId: string; slug: string; origin: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!window.confirm(`Remover o NPC "${slug}"? Esta ação apaga a definição.`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteNpc(npcId);
      router.push("/admin/npcs");
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  // A content-owned NPC (imported from NPCGener.txt) can never be deleted — the
  // web-api always answers ADMIN_RESULT_CONTENT_OWNED. That's ~99% of the base,
  // so don't offer the action at all; point at the supported one instead.
  if (origin === "content") {
    return (
      <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-muted)", maxWidth: 620 }}>
        Este NPC faz parte do conteúdo do jogo (<code>NPCGener.txt</code>) e não pode ser excluído. Desabilite-o no
        formulário acima para removê-lo do mundo.
      </div>
    );
  }

  return (
    <div>
      <Button type="button" variant="ghost" onClick={remove} disabled={busy}>
        Remover NPC
      </Button>
      {error ? <div style={{ color: "var(--danger-400, #d97b7b)", fontSize: 12, marginTop: 6 }}>{error}</div> : null}
    </div>
  );
}

export default DeleteNpcButton;
