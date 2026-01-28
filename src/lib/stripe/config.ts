import Stripe from 'stripe';

// Server-side Stripe client (lazy initialization)
let _stripe: Stripe | null = null;

export function getStripeServer(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return _stripe;
}

// Alias for backward compatibility
export const stripe = {
  get instance() {
    return getStripeServer();
  }
};

// Pricing tiers
export const PLANS = {
  free: {
    id: 'free',
    name: 'Tenant',
    description: 'Free for tenants',
    price: 0,
    priceId: null,
    features: [
      'Report maintenance issues',
      'Access tenancy documents',
      'Track repair progress',
      'Leave reviews',
    ],
    limits: {
      properties: 0,
      tenancies: 0,
    },
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    description: 'For landlords with 1-3 properties',
    price: 4.99,
    priceId: process.env.STRIPE_BASIC_PRICE_ID,
    features: [
      'Up to 3 properties',
      'Unlimited tenancies',
      'Document storage',
      'Compliance reminders',
      'Issue tracking',
      'Email support',
    ],
    limits: {
      properties: 3,
      tenancies: -1, // unlimited
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'For landlords with larger portfolios',
    price: 9.99,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    features: [
      'Unlimited properties',
      'Unlimited tenancies',
      'Document storage',
      'Compliance reminders',
      'Issue tracking',
      'Contractor marketplace',
      'Priority support',
      'Analytics dashboard',
    ],
    limits: {
      properties: -1, // unlimited
      tenancies: -1, // unlimited
    },
  },
  contractor: {
    id: 'contractor',
    name: 'Contractor',
    description: 'For tradespeople',
    price: 0,
    priceId: null,
    features: [
      'Browse available jobs',
      'Submit quotes',
      'Build your reputation',
      'Verified badge (coming soon)',
    ],
    limits: {
      properties: 0,
      tenancies: 0,
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function getPlanById(planId: string) {
  return PLANS[planId as PlanId] || null;
}

export function getPaidPlans() {
  return Object.values(PLANS).filter(plan => plan.price > 0);
}
