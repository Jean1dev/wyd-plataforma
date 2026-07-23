import Link from "next/link";
import { getMobTemplateStat } from "../_data";
import { AdminHeader, Section, StateNotice } from "../../npcs/_components/StateNotice";
import { RestartBanner } from "../_components/RestartBanner";
import { StatForm } from "../_components/StatForm";
import { EquipEditor } from "../_components/EquipEditor";
import { DeleteStatButton } from "../_components/DeleteStatButton";

const wrap: React.CSSProperties = { maxWidth: 1320, margin: "0 auto", padding: "32px 24px 72px" };

export default async function EditMobTemplatePage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const result = await getMobTemplateStat(name);

  if (result.status === "forbidden") {
    return (
      <div className="wyd-screen" style={wrap}>
        <StateNotice title="Acesso restrito">Esta área é exclusiva para moderadores.</StateNotice>
      </div>
    );
  }

  if (result.status === "not_found") {
    return (
      <div className="wyd-screen" style={wrap}>
        <StateNotice title="Template não encontrado">
          Não existe override nem arquivo <code>npc/{name}</code>. Volte para a{" "}
          <Link href="/admin/mob-templates" style={{ color: "var(--gold-300)" }}>
            busca
          </Link>
          .
        </StateNotice>
      </div>
    );
  }

  if (result.status === "upstream") {
    return (
      <div className="wyd-screen" style={wrap}>
        <StateNotice title="web-api indisponível">Tente novamente em instantes.</StateNotice>
      </div>
    );
  }

  const stat = result.data;

  return (
    <div className="wyd-screen" style={wrap}>
      <AdminHeader eyebrow="Moderação · Stats de Mob" title={stat.display_name || stat.template_name} />
      <RestartBanner />

      <Section
        title="Stats do template"
        description="Level, HP/MP, atributos, EXP e skills. Salvar substitui o override inteiro."
      >
        <StatForm stat={stat} />
      </Section>

      <Section
        title="Equipamento"
        description="16 slots (Equip[16]). Salvar substitui o equipamento inteiro — slots vazios ficam sem item."
      >
        <EquipEditor templateName={stat.template_name} overridden={stat.overridden} equip={stat.equip} />
      </Section>

      <Section title="Zona de perigo">
        <DeleteStatButton templateName={stat.template_name} />
      </Section>
    </div>
  );
}
