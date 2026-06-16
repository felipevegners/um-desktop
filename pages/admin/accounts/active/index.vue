<script setup lang="ts">
import DataTable from '@/components/shared/DataTable.vue';
import ListPageLoading from '@/components/shared/ListPageLoading.vue';
import TableActions from '@/components/shared/TableActions.vue';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useSessionAccess } from '@/composables/auth/useSessionAccess';
import { useAccountStore } from '@/stores/account.store';
import { createColumnHelper } from '@tanstack/vue-table';
import { Plus, UserPen } from 'lucide-vue-next';

import { columns } from './columns';

const { toast } = useToast();

const columnHelper = createColumnHelper<any>();

const accountStore = useAccountStore();
const { getUsersAccountsAction, deleteUserAccountAction } = accountStore;
const { isLoading, accounts } = storeToRefs(accountStore);
const { waitForSessionData } = useSessionAccess();
const hasHydratedAccounts = ref(false);

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

useHead({
  title: 'Backoffice > Contas de Usuário | Urban Mobi',
});

onMounted(async () => {
  if (hasHydratedAccounts.value) return;

  const ready = await waitForSessionData({
    requireUserId: true,
    requireRole: true,
  });

  if (!ready) return;

  hasHydratedAccounts.value = true;
  await getUsersAccountsAction();
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
    await getUsersAccountsAction();
  }
};

const editAccount = (accountId: string) => {
  navigateTo(`/profile/${accountId}`);
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
  <main class="p-4 md:p-6">
    <section
      class="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <div class="flex min-w-0 items-center gap-3 md:gap-4">
        <UserPen class="h-8 w-8 shrink-0" />
        <h1 class="font-bold text-black text-2xl leading-tight md:text-3xl">
          Usuários Ativos
        </h1>
      </div>
      <Button class="w-full sm:w-auto" @click="navigateTo('/admin/accounts/new')">
        <Plus class="w-4 h-4" /> Criar Usuário
      </Button>
    </section>
    <ListPageLoading v-if="isLoading" />
    <section v-else>
      <DataTable
        :columns="finalColumns"
        :data="accounts"
        sortby="username"
        :column-pin="['username']"
        filterBy="nome de usuário"
      />
    </section>
  </main>
</template>

<style scoped></style>
