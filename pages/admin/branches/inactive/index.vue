<script setup lang="ts">
import DataTable from '@/components/shared/DataTable.vue';
import TableActions from '@/components/shared/TableActions.vue';
import { useToast } from '@/components/ui/toast';
import { useBranchesStore } from '@/stores/admin/branches.store';
import { createColumnHelper } from '@tanstack/vue-table';
import { Building2, LoaderCircle } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';

import { columns } from './columns';

const columnHelper = createColumnHelper<any>();
const { toast } = useToast();

const store = useBranchesStore();
const { getBranchesAction, deleteBranchAction } = store;
const { inactiveBranches, isLoadingData } = storeToRefs(store);

const loadingDelete = ref<boolean>(false);

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

useHead({
  title: 'Backoffice - Filiais Inativas | Urban Mobi',
});

onMounted(async () => {
  await getBranchesAction();
});

const viewBranch = (value: string) => {
  navigateTo({
    name: 'admin-branches-preview-id',
    params: {
      id: value,
    },
  });
};
const editBranch = (value: string) => {
  navigateTo({
    name: 'admin-branches-edit-id',
    params: {
      id: value,
    },
  });
};

const deleteBranch = async (contractId: string) => {
  loadingDelete.value = true;
  try {
    await deleteBranchAction(contractId);
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao deletar a filial. Tente novamente.`,
    });
    throw error;
  } finally {
    loadingDelete.value = true;
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Filial deletada com sucesso!`,
    });
    await getBranchesAction();
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
          onView: viewBranch,
          onEdit: editBranch,
          onDelete: deleteBranch,
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
        <Building2 class="w-6 h-6" />
        Gerenciar Filiais Inativas
      </h1>
    </section>
    <section
      v-if="isLoadingData"
      class="min-h-[300px] flex items-center justify-center"
    >
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else>
      <DataTable
        :columns="finalColumns"
        :data="inactiveBranches"
        sortby="branchCode"
        :column-pin="['branchCode', 'fantasyName']"
        filterBy="nome da filial"
      />
    </section>
  </main>
</template>

<style scoped></style>
