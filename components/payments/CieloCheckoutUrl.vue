<script setup lang="ts">
import { useCielo } from '@/composables/cielo/useCielo';
import { CreditCard, ExternalLink, LoaderCircle, MapPin, Shield } from 'lucide-vue-next';
import { currencyFormat } from '~/lib/utils';

interface Props {
  rideData: {
    selectedProduct: any;
    calculatedTravel: any;
    userData: any;
    originAddress: string;
    destinationAddress: string;
    departDate: string | undefined;
    departTime: string | undefined;
    passengers: number;
    code: string | undefined;
  };
}

interface Emits {
  (e: 'checkoutCreated', result: { checkoutUrl: string; orderNumber: string }): void;
  (e: 'checkoutError', error: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Reactive state
const loading = ref(false);
const checkoutUrl = ref('');
const orderNumber = ref('');
const error = ref('');

// Composable
const { createSimpleCheckout } = useCielo();

/**
 * Creates the Cielo checkout for the ride
 */
const createCheckout = async () => {
  try {
    loading.value = true;
    error.value = '';

    // Create ride description
    const rideDescription = `Atendimento ${props.rideData.selectedProduct.name} - ${props.rideData.originAddress} → ${props.rideData.destinationAddress}`;
    const rideAmount = props.rideData.calculatedTravel.travelPrice * 100;

    const checkoutResponse = await createSimpleCheckout({
      orderNumber: props.rideData.code,
      amount: rideAmount,
      itemName: `Atendimento Urban Mobi - ${props.rideData.selectedProduct.name}`,
      itemDescription: rideDescription,
    });

    if (checkoutResponse.success) {
      checkoutUrl.value = checkoutResponse.data.shortUrl;
      orderNumber.value = checkoutResponse.data.orderNumber;
      emit('checkoutCreated', {
        checkoutUrl: checkoutResponse.data.shortUrl,
        orderNumber: checkoutResponse.data.orderNumber,
      });
    } else {
      throw new Error('Failed to create checkout');
    }
  } catch (err: any) {
    console.error('Cielo checkout creation error:', err);
    error.value = err.data?.message || err.message || 'Erro ao criar checkout Cielo';
    emit('checkoutError', error.value);
  } finally {
    loading.value = false;
  }
};

/**
 * Opens the checkout URL in a new tab/window
 */
const openCheckout = () => {
  if (checkoutUrl.value) {
    window.open(checkoutUrl.value, '_blank', 'noopener,noreferrer');
  }
};

/**
 * Resets the component state
 */
const resetCheckout = () => {
  checkoutUrl.value = '';
  orderNumber.value = '';
  error.value = '';
};

// Auto-create checkout on mount
onMounted(() => {
  if (props.rideData?.calculatedTravel?.travelPrice && props.rideData?.selectedProduct) {
    createCheckout();
  }
});
</script>

<template>
  <div>
    <!-- Error State -->
    <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
      <p class="text-red-600 text-sm">{{ error }}</p>
      <Button @click="createCheckout" class="mt-2" variant="outline" size="sm">
        Tentar Novamente
      </Button>
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="p-8 text-center">
      <LoaderCircle class="animate-spin mx-auto mb-4" :size="32" />
      <p class="text-gray-600">Gerando seu pagamento...</p>
    </div>

    <!-- Success State - Checkout URL Available -->
    <div v-else-if="checkoutUrl" class="space-y-6">
      <!-- Ride Details -->
      <div class="bg-white border rounded-lg p-6 space-y-6">
        <h4 class="font-semibold text-gray-900">Detalhes do Atendimento</h4>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-10 text-sm">
          <!-- Product and Price -->
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600">Serviço UM:</span>
              <span class="font-medium">{{ rideData.selectedProduct?.name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Passageiros:</span>
              <span class="font-medium">{{ rideData.passengers }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Data/Hora:</span>
              <span class="font-medium">
                {{ new Date(rideData.departDate as string).toLocaleDateString('pt-BR') }}
                às
                {{ rideData.departTime }}
              </span>
            </div>
          </div>

          <!-- Travel Details -->
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600">Distância:</span>
              <span class="font-medium">
                {{ rideData.calculatedTravel?.travelDistance }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Tempo estimado:</span>
              <span class="font-medium">{{ rideData.calculatedTravel?.travelTime }}</span>
            </div>
            <div class="flex justify-between font-semibold text-lg border-t pt-2">
              <span class="text-gray-900">Total:</span>
              <span class="text-green-600">
                {{ currencyFormat(rideData.calculatedTravel?.travelPrice) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Route Information -->
        <div class="border-t pt-4">
          <div class="flex items-start justify-center gap-2 text-sm">
            <MapPin :size="16" class="text-gray-500 mt-0.5" />
            <div class="flex-1 space-y-1">
              <div>
                <span class="text-gray-600 font-bold">Origem:</span>
                <span class="ml-2 text-gray-900">{{ rideData.originAddress }}</span>
              </div>
              <div>
                <span class="text-gray-600 font-bold">Destino:</span>
                <span class="ml-2 text-gray-900">{{ rideData.destinationAddress }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Information -->
        <div class="bg-gray-50 p-3 rounded border-t">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Código do Atendimento:</span>
            <span class="font-mono">{{ orderNumber }}</span>
          </div>
        </div>
      </div>

      <!-- Payment Action -->
      <div class="space-y-4">
        <Button @click="openCheckout" class="w-full py-8 text-lg font-semibold" size="lg">
          Pagar {{ currencyFormat(rideData.calculatedTravel?.travelPrice) }}
          <ExternalLink class="ml-2" :size="16" />
        </Button>

        <!-- Security Notice -->
        <div class="text-center text-sm text-gray-500">
          <div class="flex items-center justify-center gap-2">
            <Shield :size="16" />
            <span class="flex items-center gap-1">
              Pagamento processado de forma segura pela
              <img src="/images/logos/logo-cielo.svg"
            /></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Initial State - No Data -->
    <div v-else class="text-center p-8">
      <CreditCard class="mx-auto mb-4 text-gray-400" :size="48" />
      <h3 class="font-semibold mb-2">Pagamento via Cielo</h3>
      <p class="text-gray-600 text-sm mb-4">
        Complete os dados do atendimento para gerar o pagamento
      </p>
    </div>
  </div>
</template>

<style scoped></style>
