<script setup lang="ts">
import { createColumnHelper } from '@tanstack/vue-table';
import { CalendarCheck2, LoaderCircle } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import DataTable from '~/components/shared/DataTable.vue';
import TableActions from '~/components/shared/TableActions.vue';
import { useRidesStore } from '~/stores/rides.store';

import { columns } from './columns';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
useHead({
  title: 'Backoffice - Atendimentos Finalizados | Urban Mobi',
});

const ridesStore = useRidesStore();
const { getRidesAction } = ridesStore;
const { loadingData, completedRides } = storeToRefs(ridesStore);
const columnHelper = createColumnHelper<any>();
const filteredRides = ref<any>([]);

onMounted(async () => {
  await getRidesAction();

  filteredRides.value = completedRides.value.sort((a: any, b: any) =>
    a.progress.finishedAt > b.progress.finishedAt
      ? -1
      : a.progress.finishedAt < b.progress.finishedAt
        ? 1
        : 0,
  );
});

const editRide = (rideId: string) => {
  navigateTo({
    name: 'admin-rides-edit-id',
    params: { id: rideId },
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
          options: ['edit'],
          loading: false,
          onView: () => {},
          onEdit: editRide,
          onDelete: () => {},
        }),
      );
    },
  }),
];
</script>
<template>
  <main class="p-6">
    <section class="mb-6 flex items-center justify-between gap-6">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <CalendarCheck2 :size="24" />
        Atendimentos Finalizados
      </h1>
    </section>
    <section v-if="loadingData" class="p-10 flex items-center justify-center">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else>
      <DataTable
        :columns="finalColumns"
        :data="filteredRides"
        sortby="user"
        :columnPin="['code']"
        :filterBy="'nome do Usuário'"
      />
    </section>
  </main>
</template>

<style scoped></style>
