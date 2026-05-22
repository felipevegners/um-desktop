<script setup lang="ts">
import InvoiceListPage from '@/components/invoices/InvoiceListPage.vue';

definePageMeta({
  middleware: 'sidebase-auth',
  layout: 'admin',
});

useHead({
  title: 'Fechamentos | Urban Mobi',
});

const { data } = useAuth();
const contractId = computed<string | undefined>(() => {
  const user = data.value?.user as any;
  return user?.contract?.contractId;
});
</script>

<template>
  <InvoiceListPage
    title="Fechamentos"
    :contract-id="contractId"
    :show-create-button="false"
    :can-edit="false"
    :allow-review-actions="true"
    preview-logo-src="/images/logo_horizontal_mono.svg"
    page-type="corporative"
  />
</template>
