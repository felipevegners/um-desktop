<script setup lang="ts">
import DataTable from '@/components/shared/DataTable.vue';
import TableActions from '@/components/shared/TableActions.vue';
import { useToast } from '@/components/ui/toast';
import { useContractsStore } from '@/stores/admin/contracts.store';
import { createColumnHelper } from '@tanstack/vue-table';
import { FileText, LoaderCircle, Plus } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';

import { columns } from './columns';

const { toast } = useToast();

const columnHelper = createColumnHelper<any>();
const store = useContractsStore();
const { getContractsAction, deleteContractAction } = store;
const { contracts, isLoading } = storeToRefs(store);

const loadingDelete = ref<boolean>(false);

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

useHead({
  title: 'Backoffice - Contratos Ativos | Urban Mobi',
});

onMounted(async () => {
  await getContractsAction();
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
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao deletar o contrato. Tente novamente.`,
    });
    throw error;
  } finally {
    loadingDelete.value = true;
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Contrato deletado com sucesso!`,
    });
    await getContractsAction();
  }
};

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
  <main class="p-6">
    <section class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <FileText :size="32" />
        <h1 class="font-bold text-black text-3xl">
          Gerenciar Contratos Ativos
        </h1>
      </div>
      <Button @click="navigateTo('/admin/contracts/new')">
        <Plus class="w-4 h-4" /> Novo Contrato
      </Button>
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
        :data="contracts"
        sortby="customerName"
        :column-pin="['customerName']"
        filterBy="nome de usuário"
      />
    </section>
  </main>
</template>

<style scoped></style>
