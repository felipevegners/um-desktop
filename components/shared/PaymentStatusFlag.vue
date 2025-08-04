<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next';

defineOptions({
  name: 'PaymentStatusFlag',
});
const props = defineProps<{
  paymentStatus: string;
  paymentUrl?: string;
}>();

const paymentStatusTranslate = {
  pending: 'Pendente',
  paid: 'Aprovado',
  denied: 'Negado',
  expired: 'Expirado',
  voided: 'Cancelado',
  invoice: 'Faturar',
  NotFinalized: 'Não finalizado',
  authorized: 'Autorizado',
  error: 'Erro',
};

const renderPaymentStatus = computed(() => {
  //@ts-ignore
  return paymentStatusTranslate[props?.paymentStatus];
});

const openPaymentLink = (link: string) => {
  if (link) {
    window.open(link, '_blank', 'noopener,noreferrer');
  }
};

const showUrlButton = computed(() => {
  return (
    props.paymentStatus === 'pending' ||
    props.paymentStatus === 'denied' ||
    props.paymentStatus === 'NotFinalized'
  );
});
</script>
<template>
  <div class="flex items-center gap-3">
    <span
      :class="`py-2 px-4 h-9 flex items-center justify-center rounded-md text-white text-xs font-bold uppercase w-fit  
      ${
        paymentStatus === 'pending'
          ? 'bg-blue-600'
          : paymentStatus === 'paid' || paymentStatus === 'authorized'
            ? 'bg-green-600'
            : paymentStatus === 'error' ||
                paymentStatus === 'expired' ||
                paymentStatus === 'denied' ||
                paymentStatus === 'voided'
              ? 'bg-red-600'
              : paymentStatus === 'invoice'
                ? 'bg-zinc-900'
                : 'bg-amber-500'
      }`"
    >
      {{ renderPaymentStatus }}
    </span>
    <Button
      v-if="paymentUrl && showUrlButton"
      @click="openPaymentLink(paymentUrl)"
      size="icon"
    >
      <ExternalLink />
    </Button>
  </div>
</template>

<style scoped></style>
