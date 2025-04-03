<script setup lang="ts">
import DataTable from '@/components/shared/DataTable.vue';
import { useContractsStore } from '@/stores/contracts.store';
import { FileText, LoaderCircle, Plus } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';

import { columns } from './columns';

const store = useContractsStore();

const { getContractsAction } = store;
const { inactiveContracts, isLoading } = storeToRefs(store);

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

onMounted(async () => {
  await getContractsAction();
});

useHead({
  title: 'Backoffice - Contratos Ativos | Urban Mobi',
});
</script>
<template>
  <main class="p-6">
    <section class="mb-6 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <FileText class="w-6 h-6" />
        Contratos Inativos
      </h1>
    </section>
    <section v-if="isLoading" class="p-10 flex items-center justify-center">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else>
      <DataTable
        :columns="columns"
        :data="inactiveContracts"
        sortby="customerName"
        :column-pin="['customerName']"
        filterBy="nome da empresa"
      />
    </section>
  </main>
</template>

<style scoped></style>
