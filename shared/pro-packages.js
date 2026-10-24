// The Pro packages as data (private spec jobadabra-lab:docs/specs/2026-10-16-pro-plan.md, owner 24 Oct 2026: "I agree."): Pro €9 (no AI credit), Pro + AI €19 (€29 list price, ~€5 credit),
// the €10 upgrade between them and the €5 / €10 / €20 top-ups. One place for what each purchase grants, shows and who may buy it; the checkout, the webhook and /api/pro/status read it.
// Guards: test/shared/pro-packages.test.js, test/shared/pro-stripe.test.js.
// Credit is kept in micro-USD behind the scenes (the AI costs are in dollars) and shown only as a bar.
export const CREDIT = {pro: 0, 'pro-ai': 5_000_000, upgrade: 5_000_000, topup5: 2_800_000, topup10: 5_800_000, topup20: 11_800_000};
export const PRO_KINDS = ['pro', 'pro-ai'];   // the purchases that make an account Pro
const offer = (id, name, price, credit, list = null) => ({id, name, price, list, currency: 'EUR', credit});
// What the app and the pricing page show (VAT included, the price paid); the provider's dashboard holds the matching prices (ids as Worker vars).
export const OFFERS = [offer('pro', 'Pro', '9', false), offer('pro-ai', 'Pro + AI', '19', true, '29'), offer('upgrade', 'Upgrade to Pro + AI', '10', true),
  offer('topup5', 'AI credit', '5', true), offer('topup10', 'AI credit', '10', true), offer('topup20', 'AI credit', '20', true)];

// 'pro-ai' once a Pro + AI or an upgrade is paid (and not refunded), else 'pro'.
export async function packageOf(env, account) {
  const row = await env.STATS.prepare("SELECT 1 AS yes FROM pro_purchases WHERE account = ? AND status = 'paid' AND kind IN ('pro-ai', 'upgrade') LIMIT 1").bind(account.id).first();
  return row ? 'pro-ai' : 'pro';
}

// Why this install's account may not buy `kind` (words for the app), or null. Free installs buy Pro or Pro + AI; Pro accounts buy top-ups, and the upgrade while they have only Pro.
export async function refusal(env, account, kind) {
  const isPro = !!account && account.status === 'active' && account.plan === 'pro';
  if (PRO_KINDS.includes(kind)) return isPro ? 'You already have Pro.' : null;
  if (!isPro) return 'Get Pro first.';
  if (kind === 'upgrade') return await packageOf(env, account) === 'pro' ? null : 'You already have Pro + AI.';
  return null;
}
