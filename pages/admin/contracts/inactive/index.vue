<script setup lang="ts">
import DataTable from '@/components/shared/DataTable.vue';
import ListPageLoading from '@/components/shared/ListPageLoading.vue';
import TableActions from '@/components/shared/TableActions.vue';
import { createColumnHelper } from '@tanstack/vue-table';
import { FileText } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useContractsStore } from '~/stores/contracts.store';

import { columns } from './columns';

const store = useContractsStore();

const { getContractsAction, deleteContractAction } = store;
const { inactiveContracts, isLoading } = storeToRefs(store);

const loadingDelete = ref<boolean>(false);

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
    name: 'admin-contracts-preview-id',
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

const deleteContract = async (contractId: string) => {
  loadingDelete.value = true;
  try {
    await deleteContractAction(contractId);
  } catch (error) {
    console.error('Error ->', error);
  } finally {
    loadingDelete.value = false;
    await getContractsAction();
  }
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
          options: ['preview', 'edit', 'delete'],
          loading: loadingDelete.value,
          onView: viewContract,
          onEdit: editContract,
          onDelete: deleteContract,
        }),
      );
    },
  }),
];
</script>
<template>
  <main class="p-4 md:p-6">
    <section
      class="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
    >
      <h1 class="flex items-center gap-2 text-2xl font-bold leading-tight">
        <FileText class="w-6 h-6 shrink-0" />
        Contratos Inativos
      </h1>
    </section>
    <ListPageLoading v-if="isLoading" />
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
