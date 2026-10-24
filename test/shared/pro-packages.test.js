// The Pro packages as data (shared/pro-packages.js): every offer has a credit rule and a provider price var, prices are euros, and the list price sits only on Pro + AI. Fails when an offer is added without them.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CREDIT, OFFERS} from '../../shared/pro-packages.js';
import {createCheckout} from '../../api/payments/stripe.js';

test('every offer: a credit rule, a Stripe price var in the Worker config, euros, and the credit flag matches the credit', async () => {
  const config = readFileSync(new URL('../../workers/www/wrangler.toml', import.meta.url), 'utf8');
  assert.deepEqual(OFFERS.map(o => o.id), Object.keys(CREDIT), 'one credit rule per offer, same order');
  for (const offer of OFFERS) {
    assert.equal(offer.currency, 'EUR', offer.id);
    assert.equal(offer.credit, CREDIT[offer.id] > 0, `${offer.id}: the flag follows the credit`);
    const env = {STRIPE_SECRET_KEY: 'sk_test_x', PRO_PLAN: 'test'}, seen = [];
    for (const name of Object.keys(await varsOf(config))) env[name] = `price_${name}`;
    const made = await createCheckout(env, {kind: offer.id, install: 'i', successUrl: 'https://x/ok', cancelUrl: 'https://x/no'}, async (url, init) => { seen.push(new URLSearchParams(init.body).get('line_items[0][price]')); return Response.json({url: 'https://c'}); });
    assert.ok(made.url && seen[0], `${offer.id} has a price var declared in wrangler.toml`);
  }
  assert.deepEqual(OFFERS.filter(o => o.list).map(o => [o.id, o.list]), [['pro-ai', '29']], 'the struck-through price belongs to Pro + AI only');
  assert.deepEqual(OFFERS.slice(0, 3).map(o => o.price), ['9', '19', '10']);
});

// The STRIPE_PRICE_* names declared in the Worker config.
const varsOf = async text => Object.fromEntries([...text.matchAll(/^(STRIPE_PRICE_[A-Z0-9_]+)\s*=/gm)].map(m => [m[1], 1]));
