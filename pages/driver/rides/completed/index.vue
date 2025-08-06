<script setup lang="ts">
import { createColumnHelper } from '@tanstack/vue-table';
import { CalendarCheck2, LoaderCircle } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import DataTable from '~/components/shared/DataTable.vue';
import TableActions from '~/components/shared/TableActions.vue';
import { useRidesStore } from '~/stores/rides.store';

import { columns } from './columns';

const ridesStore = useRidesStore();
const { getDriverRidesAction } = ridesStore;
const { loadingData, rides } = storeToRefs(ridesStore);
const columnHelper = createColumnHelper<any>();

const { data } = useAuth();

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
useHead({
  title: 'Meus Atendimentos Abertos | Urban Mobi',
});

const driverCompletedList = ref<any>([]);

onMounted(async () => {
  //@ts-ignore
  await getDriverRidesAction(data?.value?.user?.id);
  driverCompletedList.value = rides?.value.filter(
    (ride: any) => ride.status === 'completed',
  );
});

const previewRide = (rideId: string) => {
  navigateTo({
    name: 'driver-rides-preview-id',
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
          options: ['preview'],
          loading: false,
          onView: previewRide,
        }),
      );
    },
  }),
];
</script>
<template>
  <main class="p-6">
    <header>
      <SharedBackLink />
    </header>
    <section class="mb-6 flex items-center justify-between gap-6">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <CalendarCheck2 :size="24" />
        Atendimentos Realizados
      </h1>
    </section>
    <section v-if="loadingData" class="p-10 flex items-center justify-center">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else>
      <DataTable
        :columns="finalColumns"
        :data="driverCompletedList"
        sortby="user"
        :columnPin="['code']"
        :filterBy="'código do atendimento'"
      />
    </section>
  </main>
</template>

<style scoped></style>
