<script setup lang="ts">
import DataTable from '@/components/shared/DataTable.vue';
import RegisterForm from '@/components/shared/RegisterForm.vue';
import TableActions from '@/components/shared/TableActions.vue';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAccountStore } from '@/stores/admin/account.store';
import { createColumnHelper } from '@tanstack/vue-table';
import { LoaderCircle, Plus, UserPen, X } from 'lucide-vue-next';

import { columns } from './columns';

const { toast } = useToast();

const columnHelper = createColumnHelper<any>();

const accountStore = useAccountStore();
const { getUsersAccountsAction, deleteUserAccountAction } = accountStore;
const { isLoading, accounts } = storeToRefs(accountStore);

definePageMeta({
  layout: 'admin',
});

useHead({
  title: 'Backoffice - Contas de Usuário | Urban Mobi',
});

onBeforeMount(async () => {
  await getUsersAccountsAction();
});

const showForm = ref<boolean>(false);
const loadingDelete = ref<boolean>(false);

const showAddForm = () => {
  showForm.value = !showForm.value;
};

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
          onEdit: () => {},
          onDelete: deleteUserAccount,
        }),
      );
    },
  }),
];
</script>
<template>
  <main class="p-6">
    <section class="mb-10 flex items-center gap-4">
      <UserPen />
      <h1 class="font-bold text-black text-3xl">Contas de Usuário</h1>
      <div v-if="!showForm">
        <Button @click="showAddForm" type="buttonn">
          <Plus class="w-4 h-4" /> Criar Usuário
        </Button>
      </div>
    </section>
    <section v-if="showForm" class="mb-10 transition-all">
      <Card class="bg-zinc-200">
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle class="mb-4">Novo usuário</CardTitle>
            <X
              class="w-6 h-6 cursor-pointer hover:bg-zinc-300"
              @click="showAddForm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <RegisterForm @view-form="showAddForm" />
        </CardContent>
      </Card>
    </section>
    <section
      v-if="isLoading"
      class="min-h-[300px] flex items-center justify-center"
    >
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else>
      <h2 class="mb-4 font-bold text-black text-xl">Usuários Ativos</h2>
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
