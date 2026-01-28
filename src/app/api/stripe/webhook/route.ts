import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer } from '@/lib/stripe/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Use service role for webhook handlers (lazy initialization)
let _supabase: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  
  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }
  
  const stripe = getStripeServer();
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  const planId = session.metadata?.plan_id;
  
  if (!userId || !planId) {
    console.error('Missing metadata in checkout session');
    return;
  }
  
  // Get subscription details
  const stripe = getStripeServer();
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  
  // Update user's subscription status
  await getSupabaseAdmin()
    .from('profiles')
    .update({
      subscription_status: 'active',
      subscription_plan: planId,
      stripe_subscription_id: subscription.id,
      subscription_current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    })
    .eq('id', userId);
  
  console.log(`Subscription activated for user ${userId}, plan ${planId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;
  const planId = subscription.metadata?.plan_id;
  
  if (!userId) {
    console.error('Missing user ID in subscription metadata');
    return;
  }
  
  const status = subscription.status === 'active' || subscription.status === 'trialing' 
    ? 'active' 
    : subscription.status;
  
  await getSupabaseAdmin()
    .from('profiles')
    .update({
      subscription_status: status,
      subscription_plan: planId,
      subscription_current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    })
    .eq('id', userId);
  
  console.log(`Subscription updated for user ${userId}, status: ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;
  
  if (!userId) {
    console.error('Missing user ID in subscription metadata');
    return;
  }
  
  // Downgrade to free tier
  await getSupabaseAdmin()
    .from('profiles')
    .update({
      subscription_status: 'cancelled',
      subscription_plan: 'free',
      stripe_subscription_id: null,
      subscription_current_period_end: null,
    })
    .eq('id', userId);
  
  console.log(`Subscription cancelled for user ${userId}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`Payment succeeded for invoice ${invoice.id}`);
  // Could send a receipt email here
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  // Find user by customer ID
  const { data: profile } = await getSupabaseAdmin()
    .from('profiles')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();
  
  if (profile) {
    console.log(`Payment failed for user ${profile.id}`);
    // Could send a payment failure notification here
  }
}
