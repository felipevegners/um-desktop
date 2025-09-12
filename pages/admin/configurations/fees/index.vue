<script setup lang="ts">
import DataTable from '@/components/shared/DataTable.vue';
import Button from '@/components/ui/button/Button.vue';
import { useToast } from '@/components/ui/toast';
import { useFeeStore } from '@/stores/fees.store';
import { createColumnHelper } from '@tanstack/vue-table';
import { LoaderCircle, Pen, Plus, Save, SquarePercent, Trash, X } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';

import { columns } from './columns';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

useHead({
  title: 'Backoffice - Gerenciar Comissões e Taxas | Urban Mobi',
});

const showAddForm = ref<boolean>(false);
const showDeleteAlert = ref<boolean>(false);
const deleteId = ref('');
const feeItems = ref<any>([]);
const feeStore = useFeeStore();
const { getFeesAction, updateFeeAction, deleteFeeAction } = feeStore;
const { fees, isLoading, isUpdating } = storeToRefs(feeStore);

const { toast } = useToast();

onMounted(async () => {
  await getFeesAction();
  const addEditMode = fees.value.map((item: any) => {
    return {
      ...item,
      isEditing: false,
    };
  });
  feeItems.value = addEditMode;
});

watch(
  () => fees.value,
  (ready) => {
    if (ready) {
      const addEditMode = fees.value.map((item: any) => {
        return {
          ...item,
          isEditing: false,
        };
      });
      feeItems.value = addEditMode;
    }
  },
);

const columnHelper = createColumnHelper<any>();

const finalColums = [
  ...columns,
  columnHelper.display({
    id: 'actions',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Ações'),
    cell: ({ row }) => {
      const data = row.original;
      const index = feeItems.value.findIndex((item: any) => item.id === data.id);
      if (!data.isEditing) {
        return h('div', { class: 'space-x-2' }, [
          h(
            Button,
            {
              size: 'icon',
              type: 'button',
              onClick: () => editItem(feeItems.value[index]),
            },
            h(Pen),
          ),
          h(
            Button,
            {
              size: 'icon',
              type: 'button',
              class: 'bg-red-600 hover:bg-red-800',
              onClick: () => toggleDeleteAlert(feeItems.value[index].id),
            },
            h(Trash),
          ),
        ]);
      } else {
        return h('div', { class: 'flex items-center justify-start gap-2' }, [
          h(
            Button,
            {
              size: 'icon',
              type: 'button',
              class: 'bg-blue-600 hover:bg-blue-800',
              onClick: () => saveItem(feeItems.value[index]),
            },
            isUpdating.value ? h(LoaderCircle, { class: 'animate-spin' }) : h(Save),
          ),
          h(
            Button,
            {
              size: 'icon',
              type: 'button',
              variant: 'ghost',
              onClick: () => cancelEdit(feeItems.value[index]),
            },
            h(X),
          ),
        ]);
      }
    },
  }),
];

const editItem = (item: any) => {
  item.isEditing = true;
  item.lastValue = item.value;
};

const saveItem = async (item: any) => {
  const findOriginalFee = fees.value.find((fee: any) => fee.id === item.id);
  const payload = {
    ...findOriginalFee,
    name: item.name,
    value: item.value,
    active: item.active,
  };

  try {
    await updateFeeAction(payload);
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Comissão atualizada com sucesso!`,
    });
  } catch (error) {
    toast({
      title: 'Opss!',
      variant: 'destructive',
      description: `Ocorreu um erro ao atualizar a Comissão. Tente novamente.`,
    });
    throw error;
  } finally {
    item.isEditing = false;
    await getFeesAction();
  }
};

const cancelEdit = (item: any) => {
  item.value = item.lastValue;
  item.isEditing = false;
};

const deleteItem = async () => {
  try {
    await deleteFeeAction(deleteId.value);
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Comissão excluída com sucesso!`,
    });
  } catch (error) {
    toast({
      title: 'Opss!',
      variant: 'destructive',
      description: `Ocorreu um erro ao criar a Comissão. Tente novamente.`,
    });
  } finally {
    setTimeout(async () => {
      await getFeesAction();
    }, 1000);
  }
};

const toggleShowAddForm = async () => {
  showAddForm.value = !showAddForm.value;
  await getFeesAction();
};
const toggleDeleteAlert = async (itemId: string) => {
  showDeleteAlert.value = !showDeleteAlert.value;
  deleteId.value = itemId;
};
</script>
<template>
  <main class="p-6">
    <section class="mb-6 flex items-center justify-between">
      <h1 class="flex items-center gap-4 text-3xl font-bold">
        <SquarePercent :size="32" />
        Gerenciar Comissões e Taxas
      </h1>
      <Button @click="toggleShowAddForm">
        <Plus class="w-4 h-4" /> Adicionar Nova
      </Button>
    </section>
    <section v-if="showAddForm">
      <FormsAddFeeForm :onCancel="toggleShowAddForm" />
    </section>
    <section v-if="isLoading" class="p-6 flex items-center justify-center h-full">
      <LoaderCircle class="animate-spin" :size="32" />
    </section>
    <section v-else>
      <DataTable
        :columns="finalColums"
        :data="feeItems"
        sortby="name"
        :column-pin="['name']"
        filterBy="nome da taxa ou comissão"
      />
    </section>
  </main>

  <AlertDialog :open="showDeleteAlert">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Deseja realmente excluir a comissão?</AlertDialogTitle>
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
          <LoaderCircle v-if="isLoading" class="w-10 h-10 animate-spin" />
          Excluir
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<style scoped></style>
