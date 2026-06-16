<script setup lang="ts">
import DataTable from '@/components/shared/DataTable.vue';
import ListPageLoading from '@/components/shared/ListPageLoading.vue';
import Button from '@/components/ui/button/Button.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { useSessionAccess } from '@/composables/auth/useSessionAccess';
import { useCommissionsStore } from '@/stores/commissions.store';
import { useDriverStore } from '@/stores/drivers.store';
import { createColumnHelper } from '@tanstack/vue-table';
import {
  BanknoteIcon,
  CheckSquare,
  Edit,
  LoaderCircle,
  Plus,
  Trash,
} from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { currencyFormat } from '~/lib/utils';

import { columns } from './columns';

const { toast } = useToast();
const { waitForSessionData } = useSessionAccess();

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

useHead({
  title: 'Backoffice - Gerenciar Pagamentos Motoristas | Urban Mobi',
});

const store = useCommissionsStore();
const {
  getCommissionsAction,
  deleteCommissionAction,
  getCommissionsStatsAction,
  batchPayCommissionsAction,
} = store;
const { commissions, isLoading, isUpdating, stats } = storeToRefs(store);

const driverStore = useDriverStore();
const { getDriversAction } = driverStore;
const { drivers } = storeToRefs(driverStore);

const showAddForm = ref<boolean>(false);
const showDeleteAlert = ref<boolean>(false);
const deleteId = ref<string>('');
const editingCommission = ref<any | null>(null);
const isSingleEditMode = computed(
  () => showAddForm.value && Boolean(editingCommission.value?.id),
);

// Batch pay state
const isBatchMode = ref<boolean>(false);
const selectedIds = ref<Set<string>>(new Set());
const selectedDriverId = ref<string>('');

const toggleShowAddForm = () => {
  if (showAddForm.value) {
    editingCommission.value = null;
  }
  showAddForm.value = !showAddForm.value;
};

const startEditCommission = (commission: any) => {
  if (commission?.status === 'paid') {
    toast({
      title: 'Atenção',
      variant: 'destructive',
      description: 'Comissões com status pago não podem ser editadas.',
    });
    return;
  }

  editingCommission.value = commission;
  isBatchMode.value = false;
  showAddForm.value = true;
};

const handleFormCancel = () => {
  editingCommission.value = null;
  showAddForm.value = false;
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
  await Promise.all([getCommissionsAction(), getCommissionsStatsAction()]);
};

onMounted(async () => {
  const sessionReady = await waitForSessionData({
    requireUserId: true,
    requireRole: true,
    timeoutMs: 10000,
  });

  if (!sessionReady) return;

  await Promise.all([fetchData(), getDriversAction()]);
});

// ─── Batch mode ──────────────────────────────────────────────────────────────

const toggleBatchMode = () => {
  isBatchMode.value = !isBatchMode.value;
  if (!isBatchMode.value) {
    selectedIds.value = new Set();
    selectedDriverId.value = '';
  }
  if (isBatchMode.value) {
    editingCommission.value = null;
    showAddForm.value = false;
  }
};

const toggleSelectCommission = (id: string) => {
  const next = new Set(selectedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  selectedIds.value = next;
};

const markAsPaid = async () => {
  if (selectedIds.value.size === 0) {
    toast({
      title: 'Atenção',
      variant: 'destructive',
      description: 'Selecione ao menos uma comissão para marcar como paga.',
    });
    return;
  }
  try {
    await batchPayCommissionsAction([...selectedIds.value]);
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `${selectedIds.value.size} pagamento(s) marcado(s) como pago(s) com sucesso!`,
    });
    selectedIds.value = new Set();
    isBatchMode.value = false;
    await fetchData();
  } catch (error) {
    toast({
      title: 'Opss!',
      variant: 'destructive',
      description: `Ocorreu um erro ao marcar os pagamentos. Tente novamente.`,
    });
  }
};

// ─── Active drivers list for filter ──────────────────────────────────────────

const activeDrivers = computed(() => {
  return drivers.value.filter((d: any) => d.enabled !== false);
});

// ─── Filtered + sorted commissions ───────────────────────────────────────────

const sortedCommissions = computed(() => {
  let list = [...commissions.value].sort((a: any, b: any) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (isBatchMode.value && selectedDriverId.value) {
    list = list.filter((c: any) => {
      const driver = c.driver;
      if (!driver || typeof driver !== 'object') return false;
      return (
        driver.id === selectedDriverId.value || driver._id === selectedDriverId.value
      );
    });
  }

  return list;
});

// ─── Columns ─────────────────────────────────────────────────────────────────

const columnHelper = createColumnHelper<any>();

const batchSelectColumn = columnHelper.display({
  id: 'batch-select',
  enableHiding: false,
  header: () => h('div', { class: 'text-left' }, 'Selecionar'),
  cell: ({ row }) => {
    const data = row.original;
    const isSelected = selectedIds.value.has(data.id);
    if (data.status === 'paid') {
      return h('span', { class: 'text-xs text-zinc-400 italic' }, '—');
    }
    return h('input', {
      type: 'checkbox',
      checked: isSelected,
      class: 'w-4 h-4 cursor-pointer',
      onChange: () => toggleSelectCommission(data.id),
    });
  },
});

const actionsColumn = columnHelper.display({
  id: 'actions',
  enableHiding: false,
  header: () => h('div', { class: 'text-left' }, 'Ações'),
  cell: ({ row }) => {
    const data = row.original;
    const disableEdit = data.status === 'paid';
    return h('div', { class: 'space-x-2' }, [
      h(
        Button,
        {
          size: 'icon',
          type: 'button',
          variant: 'ghost',
          disabled: disableEdit,
          class: disableEdit ? 'cursor-not-allowed opacity-50' : '',
          onClick: () => startEditCommission(data),
        },
        h(Edit),
      ),
      h(
        Button,
        {
          size: 'icon',
          type: 'button',
          variant: 'ghost',
          onClick: () => toggleDeleteAlert(data.id),
        },
        h(Trash),
      ),
    ]);
  },
});

const finalColumns = computed(() => {
  if (isBatchMode.value) {
    return [batchSelectColumn, ...columns, actionsColumn];
  }
  return [...columns, actionsColumn];
});
</script>

<template>
  <main class="p-4 md:p-6">
    <!-- Header -->
    <section class="mb-6 flex items-center justify-between">
      <h1 class="flex items-center gap-4 text-3xl font-bold">
        <BanknoteIcon :size="32" />
        Pagamentos Motoristas
      </h1>
      <div class="flex gap-2">
        <Button v-if="!isSingleEditMode" variant="outline" @click="toggleBatchMode">
          <CheckSquare class="w-4 h-4" />
          {{ isBatchMode ? 'Cancelar Seleção' : 'Pagamento em Lote' }}
        </Button>
        <Button @click="toggleShowAddForm">
          <Plus class="w-4 h-4" /> Adicionar Pagamento
        </Button>
      </div>
    </section>

    <!-- Stats cards -->
    <section class="my-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <SharedStatsCard
        label="Total de Pagamentos"
        :value="stats.total"
        :sub-value="currencyFormat(stats.totalAmount)"
        variant="default"
      />
      <SharedStatsCard
        label="Total Pago"
        :value="stats.paid"
        :sub-value="currencyFormat(stats.paidAmount)"
        variant="success"
      />
      <SharedStatsCard
        label="Total Pendente"
        :value="stats.pending"
        :sub-value="currencyFormat(stats.pendingAmount)"
        variant="warning"
      />
    </section>

    <!-- Batch mode toolbar -->
    <section
      v-if="isBatchMode && !isSingleEditMode"
      class="mb-4 p-4 rounded-lg border border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
    >
      <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <span class="text-sm font-semibold text-zinc-700">Filtrar por motorista:</span>
        <select
          v-model="selectedDriverId"
          class="h-9 rounded-md border border-zinc-200 bg-white pl-3 pr-8 text-sm appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]"
        >
          <option value="">Todos os motoristas</option>
          <option v-for="driver in activeDrivers" :key="driver.id" :value="driver.id">
            {{ driver.name }}
          </option>
        </select>
        <span class="text-sm text-zinc-500">
          {{ selectedIds.size }} pgto(s) selecionado(s)
        </span>
      </div>
      <Button :disabled="selectedIds.size === 0 || isUpdating" @click="markAsPaid">
        <LoaderCircle v-if="isUpdating" class="w-4 h-4 animate-spin mr-1" />
        <CheckSquare v-else class="w-4 h-4 mr-1" />
        Marcar como Pago
      </Button>
    </section>

    <!-- Add form -->
    <section v-if="showAddForm">
      <FormsAddCommissionForm
        :commission="editingCommission"
        @cancel="handleFormCancel"
        @finish="fetchData"
      />
    </section>

    <!-- Table -->
    <ListPageLoading v-if="isLoading" />
    <section v-else>
      <DataTable
        :columns="finalColumns"
        :data="sortedCommissions"
        sortby="createdAt"
        :column-pin="['']"
        :show-filter="false"
        :show-column-selection="false"
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
        <AlertDialogCancel @click="toggleDeleteAlert('')"> Cancelar </AlertDialogCancel>
        <AlertDialogAction
          class="bg-red-600 hover:bg-red-800"
          @click="
            () => {
              deleteItem();
              toggleDeleteAlert('');
            }
          "
        >
          <LoaderCircle v-if="isUpdating" class="w-4 h-4 animate-spin" />
          Excluir
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<style scoped></style>
