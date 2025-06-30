<script setup lang="ts">
import DataTable from '@/components/shared/DataTable.vue';
import TableActions from '@/components/shared/TableActions.vue';
import { Button } from '@/components/ui/button';
import { createColumnHelper } from '@tanstack/vue-table';
import { Car, LoaderCircle, Plus } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';
import { useDriverStore } from '~/stores/drivers.store';

import { columns } from './columns';

const columnHelper = createColumnHelper<any>();

const driverStore = useDriverStore();
const { loadingData, inactiveDrivers } = storeToRefs(driverStore);
const { getDriversAction, deleteDriverAction } = driverStore;
definePageMeta({
  layout: 'admin',
});

useHead({
  title: 'Backoffice - Motoristas ativos | Urban Mobi',
});

onMounted(async () => {
  await getDriversAction();
});

const editDriver = (id: string) => {
  navigateTo({
    name: 'admin-drivers-edit-id',
    params: {
      id: id,
    },
  });
};
const viewDriver = (id: string) => {
  navigateTo({
    name: 'admin-drivers-preview-id',
    params: {
      id: id,
    },
  });
};

const deleteDriver = async (id: string) => {
  await deleteDriverAction(id);
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
          loading: () => {},
          onView: viewDriver,
          onEdit: editDriver,
          onDelete: deleteDriver,
        }),
      );
    },
  }),
];
</script>
<template>
  <main class="p-6">
    <section class="mb-6 flex items-center justify-between gap-6">
      <h1 class="flex items-center gap-2 font-bold text-2xl">
        <Car />
        Motoristas Inativos
      </h1>
      <div>
        <Button @click="navigateTo('/admin/drivers/new')">
          <Plus class="w-4 h-4" /> Novo Motorista
        </Button>
      </div>
    </section>
    <section
      v-if="loadingData"
      class="p-10 flex items-center justify-center min-h-[300px]"
    >
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else>
      <DataTable
        :columns="finalColumns"
        :data="inactiveDrivers"
        sortby="name"
        :columnPin="['name']"
        filterBy="nome do motorista"
      />
    </section>
  </main>
</template>

<style scoped></style>
