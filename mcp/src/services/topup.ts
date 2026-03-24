import { stripe } from '../config/stripe.js';
import { supabase } from '../config/supabase.js';

// 1 USD = 100 credits. Bonus tiers mirror the mobile app.
const PACKAGES = [
  { label: '$5',  cents: 500,  credits: 500 },
  { label: '$10', cents: 1000, credits: 1050 },
  { label: '$25', cents: 2500, credits: 2750 },
  { label: '$50', cents: 5000, credits: 6000 },
] as const;

export type PackageLabel = '$5' | '$10' | '$25' | '$50';

export function listPackages() {
  return PACKAGES.map((p) => ({
    label: p.label,
    price_usd: p.label,
    credits: p.credits,
    bonus: p.credits - Math.floor(Number(p.label.slice(1)) * 100),
  }));
}

export async function createCheckoutSession(
  userId: string,
  packageLabel: PackageLabel
): Promise<{ url: string; credits_to_add: number }> {
  const pkg = PACKAGES.find((p) => p.label === packageLabel);
  if (!pkg) throw new Error(`Unknown package "${packageLabel}". Choose: $5, $10, $25, $50`);

  // Retrieve or create Stripe customer
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  let customerId = profile?.stripe_customer_id as string | undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { supabase_user_id: userId },
    });
    customerId = customer.id;
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: pkg.cents,
          product_data: {
            name: `ScribeToGo — ${pkg.credits} credits`,
            description: `Prepaid transcription credits (${pkg.label})`,
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    metadata: { user_id: userId, credits_to_add: String(pkg.credits) },
    success_url: process.env.STRIPE_SUCCESS_URL ?? 'https://scribetogo.app/topup/success',
    cancel_url:  process.env.STRIPE_CANCEL_URL  ?? 'https://scribetogo.app/topup/cancel',
  });

  // Record pending payment
  await supabase.from('payments').insert({
    user_id:           userId,
    stripe_payment_id: session.payment_intent ?? session.id,
    amount_usd_cents:  pkg.cents,
    credits_added:     pkg.credits,
    status:            'pending',
  });

  return { url: session.url!, credits_to_add: pkg.credits };
}
