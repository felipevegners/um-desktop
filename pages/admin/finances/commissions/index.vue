<script setup lang="ts">
import DataTable from '@/components/shared/DataTable.vue';
import Button from '@/components/ui/button/Button.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { useCommissionsStore } from '@/stores/commissions.store';
import { createColumnHelper } from '@tanstack/vue-table';
import { BanknoteIcon, LoaderCircle, Pen, Plus, Trash } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';

import { columns } from './columns';

const { toast } = useToast();

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

useHead({
  title: 'Backoffice - Gerenciar Pagamentos Motoristas | Urban Mobi',
});

const store = useCommissionsStore();
const { getCommissionsAction, deleteCommissionAction } = store;
const { commissions, isLoading, isUpdating } = storeToRefs(store);
const showAddForm = ref<boolean>(false);
const showDeleteAlert = ref<boolean>(false);
const deleteId = ref<string>('');

const toggleShowAddForm = () => {
  showAddForm.value = !showAddForm.value;
};

const toggleDeleteAlert = async (itemId: string) => {
  showDeleteAlert.value = !showDeleteAlert.value;
  deleteId.value = itemId;
};

const deleteItem = async () => {
  try {
    await deleteCommissionAction(deleteId.value);
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Pagamento excluído com sucesso!`,
    });
  } catch (error) {
    toast({
      title: 'Opss!',
      variant: 'destructive',
      description: `Ocorreu um erro ao deletar o pagamento. Tente novamente.`,
    });
  } finally {
    setTimeout(async () => {
      await fetchData();
    }, 1000);
  }
};

const fetchData = async () => {
  await getCommissionsAction();
};

onMounted(async () => {
  await fetchData();
});

const columnHelper = createColumnHelper<any>();

const sortCommissionsByDate = computed(() => {
  return [...commissions.value].sort((a: any, b: any) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });
});

const finalColums = [
  ...columns,
  columnHelper.display({
    id: 'actions',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Ações'),
    cell: ({ row }) => {
      const data = row.original;
      return h('div', { class: 'space-x-2' }, [
        h(
          Button,
          {
            size: 'icon',
            type: 'button',
            onClick: () => {},
            disabled: true,
            class: 'cursor-not-allowed',
          },
          h(Pen),
        ),
        h(
          Button,
          {
            size: 'icon',
            type: 'button',
            class: 'bg-red-600 hover:bg-red-800',
            onClick: () => toggleDeleteAlert(data.id),
          },
          h(Trash),
        ),
      ]);
    },
  }),
];
</script>
<template>
  <main class="p-6">
    <section class="mb-6 flex items-center justify-between">
      <h1 class="flex items-center gap-4 text-3xl font-bold">
        <BanknoteIcon :size="32" />
        Pagamentos Motoristas
      </h1>
      <Button @click="toggleShowAddForm">
        <Plus class="w-4 h-4" /> Adicionar Pagamento
      </Button>
    </section>
    <section v-if="showAddForm">
      <FormsAddCommissionForm @cancel="toggleShowAddForm" @finish="fetchData" />
    </section>
    <section v-if="isLoading" class="p-6 flex items-center justify-center h-full">
      <LoaderCircle class="animate-spin" :size="32" />
    </section>
    <section v-else>
      <DataTable
        :columns="finalColums"
        :data="sortCommissionsByDate"
        sortby="type"
        :column-pin="['type']"
        filterBy="tipo de pagamento"
      />
    </section>
  </main>
  <AlertDialog :open="showDeleteAlert">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Deseja realmente excluir o pagamento?</AlertDialogTitle>
        <AlertDialogDescription>
          Essa ação é irreversível e excluirá permanentemente da base de dados.
          {{ deleteId }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="toggleDeleteAlert"> Cancelar </AlertDialogCancel>
        <AlertDialogAction
          class="bg-red-600 hover:bg-red-800"
          @click="
            () => {
              deleteItem();
              toggleDeleteAlert('');
            }
          "
        >
          <LoaderCircle v-if="isUpdating" class="w-10 h-10 animate-spin" />
          Excluir
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<style scoped></style>
