<script setup lang="ts">
import { columns } from '@/components/rides/columns/driver/canceled';
import { useSessionAccess } from '@/composables/auth/useSessionAccess';
import { CalendarX2 } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import DataTable from '~/components/shared/DataTable.vue';
import ListPageLoading from '~/components/shared/ListPageLoading.vue';
import { useRidesStore } from '~/stores/rides.store';

const ridesStore = useRidesStore();
const { getDriverRidesAction } = ridesStore;
const { loadingData, rides } = storeToRefs(ridesStore);
const driverCanceledList = ref([]);
const hasHydratedRides = ref(false);

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
useHead({
  title: 'Atendimentos Cancelados | Urban Mobi',
});

const { status, user, hasSessionData } = useSessionAccess();

const hydrateRides = async () => {
  const driverId = String(user.value?.id || '').trim();
  if (!driverId) return;

  await getDriverRidesAction(driverId);
  driverCanceledList.value = rides?.value.filter((ride: any) => {
    const status = String(ride?.status || '').toLowerCase();
    return status === 'cancelled' || status === 'canceled';
  });
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
</script>
<template>
  <main class="p-4 md:p-6">
    <header>
      <SharedBackLink />
    </header>
    <section class="mb-6 flex items-center gap-6">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <CalendarX2 :size="24" />
        Atendimentos Cancelados
      </h1>
    </section>
    <ListPageLoading v-if="loadingData" />
    <section v-else>
      <DataTable
        :columns="columns"
        :data="driverCanceledList"
        sortby="code"
        :columnPin="['code']"
        :filterBy="'código do atendimento'"
      />
    </section>
  </main>
</template>

<style scoped></style>
