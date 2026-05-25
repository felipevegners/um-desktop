<script setup lang="ts">
import { columns } from '@/components/rides/columns/driver/completed';
import { useSessionAccess } from '@/composables/auth/useSessionAccess';
import { createColumnHelper } from '@tanstack/vue-table';
import { CalendarCheck2 } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import DataTable from '~/components/shared/DataTable.vue';
import ListPageLoading from '~/components/shared/ListPageLoading.vue';
import TableActions from '~/components/shared/TableActions.vue';
import { useRidesStore } from '~/stores/rides.store';

const ridesStore = useRidesStore();
const { getDriverRidesAction } = ridesStore;
const { loadingData, rides } = storeToRefs(ridesStore);
const columnHelper = createColumnHelper<any>();
const hasHydratedRides = ref(false);
const { status, user, hasSessionData } = useSessionAccess();

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
useHead({
  title: 'Meus Atendimentos Abertos | Urban Mobi',
});

const driverCompletedList = ref<any>([]);

const hydrateRides = async () => {
  const driverId = String(user.value?.id || '').trim();
  if (!driverId) return;

  await getDriverRidesAction(driverId);
  driverCompletedList.value = rides?.value.filter(
    (ride: any) => String(ride?.status || '').toLowerCase() === 'completed',
  );
};

watch(
  [status, user],
  async () => {
    if (hasHydratedRides.value) return;
    if (!hasSessionData({ requireUserId: true })) return;

    hasHydratedRides.value = true;
    await hydrateRides();
  },
  { immediate: true },
);

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
  <main class="p-4 md:p-6">
    <header>
      <SharedBackLink />
    </header>
    <section class="mb-6 flex items-center justify-between gap-6">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <CalendarCheck2 :size="24" />
        Atendimentos Realizados
      </h1>
    </section>
    <ListPageLoading v-if="loadingData" />
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
