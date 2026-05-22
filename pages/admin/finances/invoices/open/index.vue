<script setup lang="ts">
import InvoiceListPage from '@/components/invoices/InvoiceListPage.vue';

definePageMeta({
  middleware: 'sidebase-auth',
  layout: 'admin',
});

useHead({
  title: 'Backoffice - Fechamentos Operacionais | Urban Mobi',
});
</script>

<template>
  <InvoiceListPage
    title="Fechamentos Operacionais"
    :show-create-button="true"
    create-button-label="+ Gerar Fechamento"
    create-button-to="/admin/finances/invoices/new"
    :can-edit="true"
    preview-logo-src="/images/logo_horizontal_mono.svg"
    page-type="admin"
  />
</template>
