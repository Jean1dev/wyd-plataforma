"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { deleteNpc, errorMessage } from "./api";

export function DeleteNpcButton({ npcId, slug }: { npcId: string; slug: string }) {
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
