"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { Combobox, type ComboOption } from "../../npcs/_components/Combobox";
import { PickerNote } from "../../npcs/_components/PickerNote";
import { useMobTemplateCatalog } from "./templates";

export function TemplatePicker() {
  const router = useRouter();
  const catalog = useMobTemplateCatalog();
  const [value, setValue] = useState("");

  const options: ComboOption[] = useMemo(
    () =>
      catalog.templates.map((t) => ({
        value: t.template_name,
        label: t.display_name || t.template_name,
        hint: t.template_name,
      })),
    [catalog.templates],
  );

  function open(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    router.push(`/admin/mob-templates/${encodeURIComponent(trimmed)}`);
  }

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
      <Combobox
        label="Template"
        value={value}
        onChange={setValue}
        onSelect={(opt) => open(opt.value)}
        options={options}
        available={catalog.status === "ok"}
        loading={catalog.loading}
        placeholder="Buscar template por nome…"
        manualPlaceholder="ex. mob_orc_warrior"
        manualHint="Deve bater exatamente com um arquivo em Release/TMsrv/run/npc/ (sem extensão)."
      />

      {!catalog.loading ? (
        <PickerNote
          status={catalog.status}
          rpc="ListMobTemplates"
          contentDependent
          manualHint="Digite o template_name manualmente — deve bater com um arquivo em Release/TMsrv/run/npc/."
        />
      ) : null}

      <div>
        <Button type="button" onClick={() => open(value)} disabled={!value.trim()}>
          Abrir editor
        </Button>
      </div>
    </div>
  );
}

export default TemplatePicker;
