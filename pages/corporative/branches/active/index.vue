<script setup lang="ts">
import DataTable from '@/components/shared/DataTable.vue';
import ListPageLoading from '@/components/shared/ListPageLoading.vue';
import TableActions from '@/components/shared/TableActions.vue';
import { useToast } from '@/components/ui/toast';
import { useSessionAccess } from '@/composables/auth/useSessionAccess';
import { createColumnHelper } from '@tanstack/vue-table';
import { Building2, Plus } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useBranchesStore } from '~/stores/branches.store';

import { columns } from './columns';

const { toast } = useToast();
const { status, contractId, role, userBranches, hasSessionData } = useSessionAccess();

const columnHelper = createColumnHelper<any>();
const store = useBranchesStore();
const { getBranchesAction, deleteBranchAction, getBranchByContractIdAction } = store;
const { branches, isLoadingData } = storeToRefs(store);

const loadingDelete = ref<boolean>(false);
const contractBranches = ref<any>([]);
const hasHydratedBranches = ref(false);

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

useHead({
  title: 'Filiais Ativas | Urban Mobi',
});

const normalizeContractBranches = () => {
  const scopedContractId = String(contractId.value || '').trim();

  if (role.value === 'master-manager') {
    contractBranches.value = branches.value.filter(
      (branch) => branch.contractId === scopedContractId,
    );
    return;
  }

  if (role.value === 'branch-manager') {
    contractBranches.value = branches.value.filter((item) =>
      (userBranches.value || []).some((filterItem: any) => filterItem.id === item.id),
    );
    return;
  }

  contractBranches.value = branches.value;
};

const hydrateBranches = async () => {
  const scopedContractId = String(contractId.value || '').trim();
  if (!scopedContractId) return;

  await getBranchByContractIdAction(scopedContractId);
  normalizeContractBranches();
};

watch(
  [status, contractId, role, userBranches],
  async () => {
    if (hasHydratedBranches.value) return;

    const isReady = hasSessionData({
      requireUserId: true,
      requireRole: true,
      requireContractId: true,
    });

    if (!isReady) return;

    hasHydratedBranches.value = true;
    await hydrateBranches();
  },
  { immediate: true },
);

const viewBranch = (value: string) => {
  navigateTo({
    name: 'corporative-branches-preview-id',
    params: {
      id: value,
    },
  });
};
const editBranch = (value: string) => {
  navigateTo({
    name: 'corporative-branches-edit-id',
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
    loadingDelete.value = false;
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Filial deletada com sucesso!`,
    });
    await hydrateBranches();
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
  <main class="p-4 md:p-6">
    <section
      class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <h1
        class="flex min-w-0 items-center gap-2 text-2xl font-bold leading-tight md:text-3xl"
      >
        <Building2 class="h-7 w-7 shrink-0" />
        Gerenciar Filiais Ativas
      </h1>
      <Button class="w-full sm:w-auto" @click="navigateTo('/corporative/branches/new')">
        <Plus class="w-4 h-4" /> Nova Filial
      </Button>
    </section>
    <ListPageLoading v-if="isLoadingData" />
    <section v-else>
      <DataTable
        :columns="finalColumns"
        :data="contractBranches"
        sortby="branchCode"
        :column-pin="['branchCode', 'fantasyName']"
        filterBy="nome da filial"
      />
    </section>
  </main>
</template>

<style scoped></style>
