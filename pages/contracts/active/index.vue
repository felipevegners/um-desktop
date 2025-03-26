<script setup lang="ts">
import DataTable from '@/components/shared/DataTable.vue';
import { Plus } from 'lucide-vue-next';

import { columns } from './columns';

definePageMeta({
  layout: 'admin',
});

useHead({
  title: 'Backoffice - Contratos Ativos | Urban Mobi',
});
</script>
<template>
  <main class="p-6">
    <section class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Contratos Ativos</h1>
      <Button @click="navigateTo('/contracts/new')">
        <Plus class="w-4 h-4" /> Novo Contrato
      </Button>
    </section>
    <section>
      <DataTable
        :columns="columns"
        :data="[]"
        sortby="customer"
        :column-pin="['number']"
        filterBy="Empresa"
      />
    </section>
  </main>
</template>

<style scoped></style>
