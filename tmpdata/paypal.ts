// Learnova · paypal: premium payments with PayPal. The browser never sets the price.
//   {action:"create", plan}  → makes a PayPal order for that plan's price (from the plans table) and returns its id
//   {action:"capture", order} → captures the approved order with PayPal, checks amount, currency and owner,
//                               then extends premium through public.confirm_payment (service role only)
// Secrets (set by the admin in Supabase → Edge Functions → Secrets): PAYPAL_CLIENT_ID, PAYPAL_SECRET,
// PAYPAL_ENV = "live" or "sandbox". SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const ORIGINS = ['https://biosciencevista.com', 'https://www.biosciencevista.com'];
let cors: Record<string, string> = {
  'Access-Control-Allow-Origin': ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });

async function paypalToken(base: string, id: string, secret: string) {
  const r = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST', body: 'grant_type=client_credentials',
    headers: { Authorization: 'Basic ' + btoa(`${id}:${secret}`), 'content-type': 'application/x-www-form-urlencoded' },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error('PayPal sign-in failed');
  return j.access_token as string;
}

Deno.serve(async (req) => {
  const og = req.headers.get('origin') || '';
  cors = { ...cors, 'Access-Control-Allow-Origin': ORIGINS.includes(og) ? og : ORIGINS[0] };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply({ error: 'Use POST.' }, 405);
  const url = Deno.env.get('SUPABASE_URL')!, service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, service, { auth: { persistSession: false } });
  // the client ID is public: taken from the secret if set, otherwise from the admin's settings (app_settings.paypal_client_id)
  let id = Deno.env.get('PAYPAL_CLIENT_ID');
  if (!id) { const { data: cs } = await admin.from('app_settings').select('v').eq('k', 'paypal_client_id').maybeSingle(); id = cs?.v; }
  const secret = Deno.env.get('PAYPAL_SECRET');
  if (!id || !secret) return reply({ error: 'Payments are not switched on yet.' }, 503);
  const base = Deno.env.get('PAYPAL_ENV') === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const { data: who } = await admin.auth.getUser(jwt);
  if (!who?.user) return reply({ error: 'Sign in first.' }, 401);
  const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${jwt}` } } });

  try {
    const body = await req.json().catch(() => ({}));
    const token = await paypalToken(base, id, secret);
    const pp = (path: string, init: RequestInit = {}) => fetch(base + path, { ...init, headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(init.headers || {}) } });

    if (body.action === 'check') {   // admin only: confirms the PayPal keys work (no order, no payment)
      const { data: isAdmin } = await asUser.rpc('is_admin');
      return isAdmin ? reply({ ok: true, env: base.includes('sandbox') ? 'sandbox' : 'live' }) : reply({ error: 'Admin only.' }, 403);
    }

    if (body.action === 'create') {
      if (typeof body.plan !== 'string' || !/^[a-z0-9-]{2,40}$/.test(body.plan)) return reply({ error: 'Choose a plan.' }, 400);
      const { data: p, error } = await asUser.rpc('start_payment', { plan: body.plan });   // checks the plan, price and who may buy it
      if (error || !p) return reply({ error: error?.message?.replace(/^.*ERROR:\s*/, '') || 'That plan is not available.' }, 400);
      const r = await pp('/v2/checkout/orders', {
        method: 'POST', headers: { 'PayPal-Request-Id': p.reference },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{ reference_id: 'premium', custom_id: p.reference, description: `Learnova premium: ${p.plan}`.slice(0, 120),
            amount: { currency_code: p.currency, value: Number(p.amount).toFixed(2) } }],
          payment_source: { paypal: { experience_context: { brand_name: 'Learnova', shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW' } } },
        }),
      });
      const o = await r.json().catch(() => ({}));
      if (!r.ok || !o.id) return reply({ error: 'PayPal could not start the payment. Try again.' }, 502);
      await admin.from('payments').update({ provider_order: o.id }).eq('reference', p.reference).eq('user_id', who.user.id);
      return reply({ id: o.id });
    }

    if (body.action === 'capture') {
      if (typeof body.order !== 'string' || !/^[A-Z0-9]{8,40}$/.test(body.order)) return reply({ error: 'Bad order.' }, 400);
      const { data: pay } = await admin.from('payments').select('reference, user_id, amount, currency, status').eq('provider_order', body.order).maybeSingle();
      if (!pay || pay.user_id !== who.user.id) return reply({ error: 'Payment not found.' }, 404);
      if (pay.status === 'paid') return reply({ ok: true });
      const r = await pp(`/v2/checkout/orders/${body.order}/capture`, { method: 'POST', headers: { 'PayPal-Request-Id': 'cap-' + pay.reference } });
      const o = await r.json().catch(() => ({}));
      const cap = o?.purchase_units?.[0]?.payments?.captures?.[0];
      const unit = o?.purchase_units?.[0];
      if (!r.ok || o.status !== 'COMPLETED' || cap?.status !== 'COMPLETED' || (unit?.custom_id && unit.custom_id !== pay.reference && cap?.custom_id !== pay.reference))
        return reply({ error: 'PayPal did not complete the payment.' }, 402);
      const { data: done, error } = await admin.rpc('confirm_payment', {
        ref: pay.reference, paid_amount: Number(cap.amount?.value || 0), paid_currency: String(cap.amount?.currency_code || ''),
        payload: { order: o.id, capture: cap.id, status: cap.status, amount: cap.amount, at: cap.create_time },
      });
      if (error) return reply({ error: 'Payment received but not recorded. Contact the admin with reference ' + pay.reference }, 500);
      return reply({ ok: !!done, reference: pay.reference });
    }
    return reply({ error: 'Unknown action.' }, 400);
  } catch (_e) {
    return reply({ error: 'Payment service error. Try again.' }, 502);
  }
});
