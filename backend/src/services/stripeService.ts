import { stripe } from '../config/stripe';
import { supabase } from '../config/supabase';
import { topUpBalance } from './balanceService';

// 1 USD = 100 credits
const CREDITS_PER_USD = 100;

// Bonus tiers
const BONUS_TIERS = [
  { min_cents: 5000, bonus: 0.2 },  // $50+ → 20% bonus
  { min_cents: 2500, bonus: 0.1 },  // $25+ → 10% bonus
  { min_cents: 1000, bonus: 0.05 }, // $10+ → 5% bonus
  { min_cents: 0,    bonus: 0 },
];

export function calculateCredits(amount_usd_cents: number): number {
  const tier = BONUS_TIERS.find((t) => amount_usd_cents >= t.min_cents)!;
  const base = (amount_usd_cents / 100) * CREDITS_PER_USD;
  return Math.floor(base * (1 + tier.bonus));
}

async function getOrCreateStripeCustomer(userId: string, email?: string): Promise<string> {
  // Check if we already have a stripe_customer_id stored
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });

  await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  return customer.id;
}

export async function createPaymentIntent(params: {
  userId: string;
  email?: string;
  amount_usd_cents: number;
}): Promise<{ client_secret: string; payment_intent_id: string; credits_to_add: number }> {
  const { userId, email, amount_usd_cents } = params;

  if (amount_usd_cents < 500) {
    throw new Error('Minimum top-up is $5.00');
  }

  const credits_to_add = calculateCredits(amount_usd_cents);
  const customer_id = await getOrCreateStripeCustomer(userId, email);

  const intent = await stripe.paymentIntents.create({
    amount: amount_usd_cents,
    currency: 'usd',
    customer: customer_id,
    metadata: {
      user_id: userId,
      credits_to_add: String(credits_to_add),
    },
    automatic_payment_methods: { enabled: true },
  });

  // Record pending payment
  await supabase.from('payments').insert({
    user_id: userId,
    stripe_payment_id: intent.id,
    amount_usd_cents,
    credits_added: credits_to_add,
    status: 'pending',
  });

  return {
    client_secret: intent.client_secret!,
    payment_intent_id: intent.id,
    credits_to_add,
  };
}

export async function handleWebhookEvent(rawBody: Buffer, signature: string): Promise<void> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  if (event.type !== 'payment_intent.succeeded') return;

  const intent = event.data.object as any;
  const { user_id, credits_to_add } = intent.metadata;

  if (!user_id || !credits_to_add) {
    console.error('[stripe webhook] Missing metadata on intent:', intent.id);
    return;
  }

  // Idempotency: update only if still pending (prevents double-credit on duplicate webhooks)
  const { data: payment } = await supabase
    .from('payments')
    .update({ status: 'succeeded' })
    .eq('stripe_payment_id', intent.id)
    .eq('status', 'pending')
    .select()
    .single();

  if (!payment) {
    console.warn(`[stripe webhook] Payment ${intent.id} already processed or not found`);
    return;
  }

  await topUpBalance(user_id, Number(credits_to_add));
  console.log(`[stripe webhook] Topped up ${credits_to_add} credits for user ${user_id}`);
}
