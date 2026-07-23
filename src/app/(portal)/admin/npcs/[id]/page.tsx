import Link from "next/link";
import { getNpc, listMapZones, listMerchantTemplates } from "../_data";
import { NpcForm } from "../_components/NpcForm";
import { ShopEditor } from "../_components/ShopEditor";
import { PriceEditor } from "../_components/PriceEditor";
import { DeleteNpcButton } from "../_components/DeleteNpcButton";
import { AdminHeader, Section, StateNotice } from "../_components/StateNotice";

const wrap: React.CSSProperties = { maxWidth: 1320, margin: "0 auto", padding: "32px 24px 72px" };

export default async function EditNpcPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getNpc(id);

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
        <StateNotice title="NPC não encontrado">
          O NPC solicitado não existe. Volte para a <Link href="/admin/npcs" style={{ color: "var(--gold-300)" }}>lista</Link>.
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

  const npc = result.data;
  const [templates, zones] = await Promise.all([listMerchantTemplates(), listMapZones()]);

  return (
    <div className="wyd-screen" style={wrap}>
      <AdminHeader eyebrow="Moderação · NPC" title={npc.display_name || npc.slug} />

      <Section title="Definição" description="Posição, visibilidade e tipo do NPC.">
        <NpcForm npc={npc} templates={templates} zones={zones} />
      </Section>

      <Section
        title="Loja"
        description="27 slots em 3 abas de 9. Salvar substitui a loja inteira — slots vazios ficam sem item."
      >
        <ShopEditor npc={npc} />
      </Section>

      <Section
        title="Preço de item (global)"
        description="O preço vale em todos os NPCs que vendem o item. Não há preço por-NPC."
      >
        <PriceEditor />
      </Section>

      <Section title="Zona de perigo">
        <DeleteNpcButton npcId={npc.id} slug={npc.slug} />
      </Section>
    </div>
  );
}
