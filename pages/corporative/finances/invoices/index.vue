<script setup lang="ts">
import InvoiceListPage from '@/components/invoices/InvoiceListPage.vue';
import { useSessionAccess } from '@/composables/auth/useSessionAccess';
import { LoaderCircle } from 'lucide-vue-next';

definePageMeta({
  middleware: 'sidebase-auth',
  layout: 'admin',
});

useHead({
  title: 'Fechamentos | Urban Mobi',
});

const { contractId, waitForSessionData } = useSessionAccess();
const isPageReady = ref(false);

onBeforeMount(async () => {
  const sessionReady = await waitForSessionData({
    requireUserId: true,
    requireRole: true,
    requireContractId: true,
    timeoutMs: 10000,
  });

  if (!sessionReady) {
    navigateTo('/auth/login');
    return;
  }

  isPageReady.value = true;
});
</script>

<template>
  <div v-if="!isPageReady" class="flex min-h-[300px] items-center justify-center p-6">
    <LoaderCircle :size="42" class="animate-spin" />
  </div>
  <InvoiceListPage
    v-else
    title="Fechamentos"
    :contract-id="contractId"
    :show-create-button="false"
    :can-edit="false"
    :allow-review-actions="true"
    preview-logo-src="/images/logo_horizontal_mono.svg"
    page-type="corporative"
  />
</template>
