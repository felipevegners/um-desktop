import Stripe from 'stripe';

const config = useRuntimeConfig();

// Initialize Stripe with your secret key
const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: '2025-06-30.basil',
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    const { amount, currency = 'brl', metadata = {} } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valor fornecido inválido',
      });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency: currency.toLowerCase(),
      metadata: {
        ...metadata,
        integration_type: 'urban_mobi_desktop',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error: any) {
    console.error('Erro durante a criação do pagamento:', error);

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Falha ao criar a intenção de pagamento',
    });
  }
});
