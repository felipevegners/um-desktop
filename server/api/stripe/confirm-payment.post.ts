import Stripe from 'stripe';

const config = useRuntimeConfig();

// Initialize Stripe with your secret key
const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: '2025-06-30.basil',
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    const { payment_intent_id } = body;

    // Validate required fields
    if (!payment_intent_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID da intenção de pagamento é obrigatório',
      });
    }

    // Retrieve the payment intent to get its current status
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    return {
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
    };
  } catch (error: any) {
    console.error('Erro ao confirmar o pagamento:', error);

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Falha na confirmação do pagamento',
    });
  }
});
