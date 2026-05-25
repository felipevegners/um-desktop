<script setup lang="ts">
import { columns } from '@/components/rides/columns/personal/open';
import { Button } from '@/components/ui/button';
import { useSessionAccess } from '@/composables/auth/useSessionAccess';
import { createColumnHelper } from '@tanstack/vue-table';
import { CalendarClock, Plus } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import DataTable from '~/components/shared/DataTable.vue';
import ListPageLoading from '~/components/shared/ListPageLoading.vue';
import TableActions from '~/components/shared/TableActions.vue';
import { useRidesStore } from '~/stores/rides.store';

const ridesStore = useRidesStore();
const { getUserRidesAction } = ridesStore;
const { loadingData, rides } = storeToRefs(ridesStore);
const columnHelper = createColumnHelper<any>();
const userRidesList = ref([]);
const hasHydratedRides = ref(false);

const { status, user, hasSessionData } = useSessionAccess();

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
useHead({
  title: 'Atendimentos Abertos | Urban Mobi',
});

const hydrateRides = async () => {
  const userId = String(user.value?.id || '').trim();
  if (!userId) return;

  await getUserRidesAction(userId);
  userRidesList.value = rides?.value.filter(
    (ride: any) => ride.status !== 'cancelled' && ride.status !== 'completed',
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

const viewRide = (rideId: string) => {
  navigateTo({
    name: 'personal-rides-preview-id',
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
          onView: viewRide,
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
    <section class="mb-6 flex items-center gap-6">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <CalendarClock :size="24" />
        Atendimentos Agendados
      </h1>
      <Button @click="navigateTo('/personal/rides/new')">
        <Plus class="w-4 h-4" />Novo Atendimento
      </Button>
    </section>
    <ListPageLoading v-if="loadingData" />
    <section v-else>
      <DataTable
        :columns="finalColumns"
        :data="userRidesList"
        sortby="code"
        :columnPin="['code']"
        :filterBy="'código do atendimento'"
      />
    </section>
  </main>
</template>

<style scoped></style>
