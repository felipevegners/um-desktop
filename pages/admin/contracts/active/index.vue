<script setup lang="ts">
import DataTable from '@/components/shared/DataTable.vue';
import ListPageLoading from '@/components/shared/ListPageLoading.vue';
import TableActions from '@/components/shared/TableActions.vue';
import { useToast } from '@/components/ui/toast';
import { useSessionAccess } from '@/composables/auth/useSessionAccess';
import { createColumnHelper } from '@tanstack/vue-table';
import { FileText, Plus } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useContractsStore } from '~/stores/contracts.store';

import { columns } from './columns';

const { toast } = useToast();
const { waitForSessionData } = useSessionAccess();

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
  const sessionReady = await waitForSessionData({
    requireUserId: true,
    requireRole: true,
    timeoutMs: 10000,
  });

  if (!sessionReady) return;

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
  const result: any = await deleteContractAction(contractId);

  if (result.success) {
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Contrato deletado com sucesso!`,
    });
    loadingDelete.value = false;

    await getContractsAction();
  } else {
    toast({
      title: 'Opss, ocorreu um erro!',
      variant: 'destructive',
      description: result.error,
    });
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
  <main class="p-4 md:p-6">
    <section
      class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <div class="flex min-w-0 items-center gap-3 md:gap-4">
        <FileText :size="30" class="shrink-0" />
        <h1 class="font-bold text-black text-3xl leading-tight">
          Gerenciar Contratos Ativos
        </h1>
      </div>
      <Button class="w-full sm:w-auto" @click="navigateTo('/admin/contracts/new')">
        <Plus class="w-4 h-4" /> Novo Contrato
      </Button>
    </section>
    <ListPageLoading v-if="isLoading" />
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
