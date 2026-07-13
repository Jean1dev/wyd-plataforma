import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/auth/require-moderator";
import { httpForAdminResult, upstreamError } from "@/lib/web-api/admin-http";
import { donateTopupRpc } from "@/lib/web-api/donate-topup-client";
import { criarCobrancaPix } from "@/lib/payments/pix-client";
import { getTopupPackage } from "@/lib/donate/packages";
import { normalizeCpf } from "@/lib/donate/cpf";

// Initiates a credit top-up: resolves the payer profile, persists the order in
// web-api (PENDING) BEFORE calling the payment gateway (persist-before-provider),
// then asks the PIX service for a charge and returns the QR to the browser.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accountId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const bad = await assertSameOrigin();
  if (bad) return bad;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const pkg = getTopupPackage(typeof body?.package_id === "string" ? body.package_id : "");
  if (!pkg) {
    return NextResponse.json({ error: "package_invalid" }, { status: 422 });
  }

  // Payer identity (name/CPF) lives on the account profile in web-api. On the
  // first top-up the browser may send them so we save before charging.
  let name = "";
  let cpf = "";
  try {
    const profile = await donateTopupRpc("GetPayerProfile", { account_id: session.accountId });
    if (profile.found) {
      name = profile.name;
      cpf = profile.cpf;
    }
  } catch {
    return upstreamError();
  }

  if (!name || !cpf) {
    const bodyName = typeof body?.name === "string" ? body.name.trim() : "";
    const bodyCpf = normalizeCpf(body?.cpf);
    if (!bodyName || !bodyCpf) {
      return NextResponse.json({ error: "payer_profile_required" }, { status: 422 });
    }
    try {
      const saved = await donateTopupRpc("SavePayerProfile", {
        account_id: session.accountId,
        name: bodyName,
        cpf: bodyCpf,
      });
      const status = httpForAdminResult(saved.result);
      if (status !== 200) return NextResponse.json({ result: saved.result }, { status });
    } catch {
      return upstreamError();
    }
    name = bodyName;
    cpf = bodyCpf;
  }

  const externalReference = crypto.randomUUID();

  // Persist-before-provider: register the order first so a charge can never be
  // orphaned without a local record.
  try {
    const created = await donateTopupRpc("CreateTopupOrder", {
      account_id: session.accountId,
      external_reference: externalReference,
      credits: pkg.credits,
      amount_cents: pkg.amountCents,
      payment_method: "PAYMENT_METHOD_PIX",
    });
    const status = httpForAdminResult(created.result);
    if (status !== 200) return NextResponse.json({ result: created.result }, { status });
  } catch {
    return upstreamError();
  }

  let cobranca;
  try {
    cobranca = await criarCobrancaPix({
      valorCents: pkg.amountCents,
      devedorNome: name,
      devedorCPF: cpf,
      descricaoSolicitacao: `Recarga de créditos (${pkg.credits})`,
      externalReference,
    });
  } catch {
    // Order stays PENDING without a QR; the webhook will never fire, so this is
    // effectively abandoned. Surface as upstream failure.
    return upstreamError();
  }

  return NextResponse.json({
    external_reference: externalReference,
    qr_code: cobranca.qrCode ?? null,
    pix_copia_e_cola: cobranca.pixCopiaECola ?? null,
    amount_cents: pkg.amountCents,
    credits: pkg.credits,
  });
}
