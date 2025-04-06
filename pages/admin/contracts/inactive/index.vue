<script setup lang="ts">
import DataTable from '@/components/shared/DataTable.vue';
import TableActions from '@/components/shared/TableActions.vue';
import { createColumnHelper } from '@tanstack/vue-table';
import { FileText, LoaderCircle } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useContractsStore } from '~/stores/admin/contracts.store';

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

const viewContract = (value: string) => {
  navigateTo({
    name: 'admin-contracts-view-id',
    params: {
      id: value,
    },
  });
};
const editContract = (value: string) => {
  navigateTo({
    name: 'admin-contracts-edit-id',
    params: {
      id: value,
    },
  });
};

const columnHelper = createColumnHelper<any>();

const finalColumns = [
  ...columns,
  columnHelper.display({
    id: 'actions',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Ações'),
    cell: ({ row }) => {
      const { id } = row.original;
      return h(
        'div',
        { class: 'relative text-left' },
        h(TableActions, {
          dataId: id,
          onView: viewContract,
          onEdit: editContract,
        }),
      );
    },
  }),
];
</script>
<template>
  <main class="p-6">
    <section class="mb-6 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <FileText class="w-6 h-6" />
        Contratos Inativos
      </h1>
    </section>
    <section
      v-if="isLoading"
      class="min-h-[300px] flex items-center justify-center"
    >
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else>
      <DataTable
        :columns="finalColumns"
        :data="inactiveContracts"
        sortby="customerName"
        :column-pin="['customerName']"
        filterBy="nome da empresa"
      />
    </section>
  </main>
</template>

<style scoped></style>
