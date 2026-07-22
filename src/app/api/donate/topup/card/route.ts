import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/auth/require-moderator";
import { httpForAdminResult, upstreamError } from "@/lib/web-api/admin-http";
import { donateTopupRpc } from "@/lib/web-api/donate-topup-client";
import { getTopupPackage } from "@/lib/donate/packages";
import { criarPaymentLinkStripe } from "@/lib/payments/stripe-client";

// Credit-card top-ups use the same persist-before-provider pattern as PIX:
// create the local PENDING order first, then ask the payment service for a
// Stripe Payment Link correlated by the same external reference.
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

  const externalReference = crypto.randomUUID();

  try {
    const created = await donateTopupRpc("CreateTopupOrder", {
      account_id: session.accountId,
      external_reference: externalReference,
      credits: pkg.credits,
      amount_cents: pkg.amountCents,
      payment_method: "PAYMENT_METHOD_CREDIT_CARD",
    });
    const status = httpForAdminResult(created.result);
    if (status !== 200) return NextResponse.json({ result: created.result }, { status });
  } catch {
    return upstreamError();
  }

  let paymentLink;
  try {
    paymentLink = await criarPaymentLinkStripe({
      quantity: 1,
      priceId: pkg.stripePriceId,
      externalReferenceId: externalReference,
    });
  } catch {
    return upstreamError();
  }

  if (!paymentLink.url || !paymentLink.id) {
    return upstreamError();
  }

  return NextResponse.json({
    external_reference: externalReference,
    payment_link_url: paymentLink.url,
    payment_link_id: paymentLink.id,
    amount_cents: pkg.amountCents,
    credits: pkg.credits,
  });
}
