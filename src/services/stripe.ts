/**
 * Stripe payment service
 *
 * This service provides methods for interacting with the Stripe API
 * for payment processing and subscription management.
 */

import {loadStripe } from '@stripe/stripe-js';
import type { Stripe as StripeJsInstance } from '@stripe/stripe-js'; // Type for the Stripe.js client instance
import type StripeNodeApi from 'stripe'; // Type for Stripe API objects (like Subscription)

// Initialize Stripe.js
let stripeJsPromise: Promise<StripeJsInstance | null> | undefined;

// Define interfaces for API responses to avoid 'any'
interface CheckoutSessionResponse {
  sessionId: string;
}

interface CustomerPortalResponse {
  url: string;
}

interface SubscriptionResponse {
  subscription: StripeNodeApi.Subscription; // Use the imported Stripe API type
}

/**
 * Get the Stripe.js instance
 * @returns Promise with the Stripe.js instance
 */
export const getStripeJs = (): Promise<StripeJsInstance | null> => {
  if (stripeJsPromise === undefined) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error('Stripe publishable key is not configured. Stripe.js functionality will be disabled.');
      stripeJsPromise = Promise.resolve(null); // Return a promise resolving to null
    } else {
      stripeJsPromise = loadStripe(publishableKey);
    }
}
  return stripeJsPromise;
};

/**
 * Create a checkout session for a course purchase
 * @param courseId The course ID
 * @param priceId The Stripe price ID
 * @param userId The user ID
 * @returns Promise with the checkout session ID
 */
export const createCheckoutSession = async (
  courseId: string,
  priceId: string,
  userId: string
): Promise<string> => {
  try {
    const response = await fetch('/api/checkout/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
    },
      body: JSON.stringify({
        courseId,
        priceId,
        userId,
    }),
  });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
  }

    const data = await response.json() as CheckoutSessionResponse;
    return data.sessionId;
} catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
}
};

/**
 * Create a customer portal session for subscription management
 * @param customerId The Stripe customer ID
 * @returns Promise with the portal session URL
 */
export const createCustomerPortalSession = async (customerId: string): Promise<string> => {
  try {
    const response = await fetch('/api/customer-portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
    },
      body: JSON.stringify({
        customerId,
    }),
  });

    if (!response.ok) {
      throw new Error('Failed to create customer portal session');
  }

    const data = await response.json() as CustomerPortalResponse;
    return data.url;
} catch (error) {
    console.error('Error creating customer portal session:', error);
    throw error;
}
};

/**
 * Redirect to Stripe checkout
 * @param sessionId The checkout session ID
 */
export const redirectToCheckout = async (sessionId: string): Promise<void> => {
  const stripeJsClient = await getStripeJs();
  if (!stripeJsClient) {
    throw new Error('Stripe.js failed to initialize');
}

  const {error } = await stripeJsClient.redirectToCheckout({
    sessionId,
});

  if (error) {
    console.error('Error redirecting to checkout:', error);
    throw new Error(error.message);
}
};

/**
 * Get subscription details
 * @param subscriptionId The Stripe subscription ID
 * @returns Promise with the subscription details
 */
export const getSubscription = async (subscriptionId: string): Promise<StripeNodeApi.Subscription> => {
  try {
    const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
    },
  });

    if (!response.ok) {
      throw new Error('Failed to get subscription');
  }

    const data = await response.json() as SubscriptionResponse;
    return data.subscription;
} catch (error) {
    console.error('Error getting subscription:', error);
    throw error;
}
};

/**
 * Format price in cents to a human-readable string
 * @param priceInCents Price in cents
 * @param currency Currency code (default: 'usd')
 * @returns Formatted price string (e.g., "$49.99")
 */
export const formatPrice = (priceInCents: number, currency = 'usd'): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
});

  return formatter.format(priceInCents / 100);
};
