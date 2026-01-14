<script setup lang="ts">
import DataTable from '@/components/shared/DataTable.vue';
import TableActions from '@/components/shared/TableActions.vue';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { createColumnHelper } from '@tanstack/vue-table';
import { LoaderCircle, Plus, UserPen } from 'lucide-vue-next';
import { useAccountStore } from '~/stores/account.store';

import { columns } from './columns';

const { toast } = useToast();
const { data } = useAuth();
//@ts-expect-error
const { contractId } = data?.value?.user?.contract;
//@ts-ignore
const role = data?.value?.user.role;
//@ts-ignore
const userBranches = data.value?.user?.contract?.branches;

const columnHelper = createColumnHelper<any>();

const accountStore = useAccountStore();
const { getUsersAccountsByContractIdAction, deleteUserAccountAction } = accountStore;
const { isLoading, inactiveAccounts } = storeToRefs(accountStore);

const userAllowedAccounts = ref<any>([]);

definePageMeta({
  layout: 'admin',
});

useHead({
  title: 'Contas de Usuário Inativas | Urban Mobi',
});

onMounted(async () => {
  await getUsersAccountsByContractIdAction(contractId);
  if (role === 'master-manager') {
    userAllowedAccounts.value = inactiveAccounts.value;
  }
  if (role === 'branch-manager') {
    const filterBranchAccounts = inactiveAccounts.value.filter((account) =>
      userBranches.some(
        //@ts-ignore
        (filterItem: any) => filterItem.id === account?.contract?.branchId,
      ),
    );
    userAllowedAccounts.value = filterBranchAccounts;
  }
});

const loadingDelete = ref<boolean>(false);

const deleteUserAccount = async (accountId: string) => {
  loadingDelete.value = true;
  try {
    await deleteUserAccountAction(accountId);
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao remover a conta de usuário. Tente novamente.`,
    });
    throw error;
  } finally {
    loadingDelete.value = false;
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Conta de Usuário removida com sucesso!`,
    });
    await getUsersAccountsByContractIdAction(contractId);
  }
};

const editAccount = (accountId: string) => {
  navigateTo({
    name: 'corporative-accounts-edit-id',
    params: {
      id: accountId,
    },
  });
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
          options: ['edit', 'delete'],
          loading: loadingDelete.value,
          onView: () => {},
          onEdit: editAccount,
          onDelete: deleteUserAccount,
        }),
      );
    },
  }),
];
</script>
<template>
  <main class="p-6">
    <section class="mb-10 flex items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <UserPen :size="32" />
        <h1 class="font-bold text-black text-3xl">Usuários Inativos</h1>
      </div>
      <Button @click="navigateTo('/admin/accounts/new')">
        <Plus class="w-4 h-4" /> Criar Usuário
      </Button>
    </section>
    <section v-if="isLoading" class="min-h-[300px] flex items-center justify-center">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else>
      <DataTable
        :columns="finalColumns"
        :data="userAllowedAccounts"
        sortby="username"
        :column-pin="['username']"
        filterBy="nome de usuário"
      />
    </section>
  </main>
</template>

<style scoped></style>
