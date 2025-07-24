<script setup lang="ts">
import {
  type Stripe,
  type StripeElements,
  type StripePaymentElement,
  loadStripe,
} from '@stripe/stripe-js';
import { LoaderCircle, SquareCheck } from 'lucide-vue-next';
import { currencyFormat } from '~/lib/utils';

interface Props {
  amount: number | string;
  currency?: string;
  metadata?: Record<string, any>;
}

interface Emits {
  (e: 'paymentComplete', result: any): void;
  (e: 'paymentError', error: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  currency: 'brl',
  metadata: () => ({}),
});

const emit = defineEmits<Emits>();

// Reactive state
const loading = ref(true);
const processing = ref(false);
const error = ref('');
const paymentSuccess = ref(false);
const paymentResult = ref(null);

// Stripe instances
let stripe: Stripe | null = null;
let elements: StripeElements | null = null;
let paymentElement: StripePaymentElement | null = null;

const config = useRuntimeConfig();

onMounted(async () => {
  await initializeStripe();
});

onBeforeUnmount(() => {
  // Clean up Stripe elements when component is unmounted
  if (paymentElement) {
    paymentElement.unmount();
  }
});

const initializeStripe = async () => {
  try {
    loading.value = true;
    error.value = '';

    // Load Stripe
    stripe = await loadStripe(config.public.stripePublishableKey as string);

    if (!stripe) {
      throw new Error('Failed to load Stripe');
    }

    // Create payment intent
    const data = await $fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      body: {
        amount: props.amount,
        currency: props.currency,
        metadata: props.metadata,
      },
    });

    if (!data?.clientSecret) {
      throw new Error('Failed to create payment intent');
    }

    // Create Stripe Elements
    elements = stripe.elements({
      clientSecret: data.clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#18181B',
          colorBackground: '#ffffff',
          colorText: '#30313d',
          colorDanger: '#df1b41',
          fontFamily: 'system-ui, sans-serif',
          spacingUnit: '4px',
          borderRadius: '8px',
        },
      },
    });

    // Create payment element
    paymentElement = elements.create('payment');

    // Set loading to false first to make DOM element available
    loading.value = false;

    // Wait for Vue to update the DOM, then mount the payment element
    await nextTick();

    // Wait a bit more to ensure DOM is fully rendered
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Mount payment element to DOM
    const paymentElementContainer = document.getElementById('payment-element');
    if (!paymentElementContainer) {
      throw new Error('Payment element container not found in DOM');
    }

    paymentElement.mount('#payment-element');
  } catch (err: any) {
    console.error('Stripe initialization error:', err);
    error.value = err.message || 'Failed to initialize payment';
    loading.value = false;
  }
};

const handleSubmit = async () => {
  if (!stripe || !elements) {
    error.value = 'Stripe not initialized';
    return;
  }

  try {
    processing.value = true;
    error.value = '';

    const { error: submitError } = await elements.submit();

    if (submitError) {
      throw new Error(submitError.message);
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success`,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      throw new Error(confirmError.message);
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      paymentSuccess.value = true;
      //@ts-ignore
      paymentResult.value = {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      };
    }
  } catch (err: any) {
    console.error('Payment error:', err);
    error.value = err.message || 'Payment failed';
    emit('paymentError', error.value);
  } finally {
    processing.value = false;
  }
};

const resetPayment = () => {
  error.value = '';
  paymentSuccess.value = false;
  paymentResult.value = null;
  initializeStripe();
};
</script>
<template>
  <div class="stripe-checkout">
    <div v-if="loading" class="flex items-center justify-center p-8">
      <LoaderCircle class="animate-spin" :size="32" />
    </div>

    <div v-else-if="error" class="p-4 bg-red-50 border border-red-200 rounded-md">
      <p class="text-red-600">{{ error }}</p>
      <Button @click="resetPayment" class="mt-2" variant="outline">
        Tentar Novamente
      </Button>
    </div>

    <div
      v-else-if="paymentSuccess"
      class="p-6 bg-green-50 border border-green-200 rounded-md text-center"
    >
      <div class="text-green-600 mb-4">
        <SquareCheck :size="48" class="mx-auto mb-2" />
        <h3 class="text-lg font-semibold">Pagamento Realizado!</h3>
        <p class="text-sm">Seu pagamento foi processado com sucesso.</p>
      </div>
      <Button @click="$emit('paymentComplete', paymentResult)" class="mt-4">
        Continuar
      </Button>
    </div>

    <div v-else class="space-y-6">
      <div class="bg-white p-6 rounded-lg border">
        <h3 class="text-lg font-semibold mb-4">Detalhes do Pagamento</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span>Subtotal:</span>
            <span>{{ currencyFormat(amount.toString()) }}</span>
          </div>
          <div class="flex justify-between font-semibold border-t pt-2">
            <span>Total:</span>
            <span>{{ currencyFormat(amount.toString()) }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg border">
        <h3 class="text-lg font-semibold mb-4">Informações de Pagamento</h3>

        <!-- Stripe Elements will be mounted here -->
        <div id="payment-element" class="mb-4"></div>

        <Button @click="handleSubmit" :disabled="processing" class="py-8 w-full">
          <LoaderCircle v-if="processing" class="animate-spin mr-2" :size="16" />
          {{
            processing ? 'Processando...' : `Pagar ${currencyFormat(amount.toString())}`
          }}
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Stripe Elements styling will be handled by the appearance config */
#payment-element {
  min-height: 40px;
}
</style>
