<script setup lang="ts">
import { columns } from '@/components/rides/columns/personal/completed';
import { Button } from '@/components/ui/button';
import { useSessionAccess } from '@/composables/auth/useSessionAccess';
import { CalendarCheck2, Plus } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import DataTable from '~/components/shared/DataTable.vue';
import ListPageLoading from '~/components/shared/ListPageLoading.vue';
import { useRidesStore } from '~/stores/rides.store';

const ridesStore = useRidesStore();
const { getRidesAction } = ridesStore;
const { loadingData, rides } = storeToRefs(ridesStore);
const userRidesList = ref([]);
const hasHydratedRides = ref(false);

const { status, user, hasSessionData } = useSessionAccess();

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
useHead({
  title: 'Atendimentos Realizados | Urban Mobi',
});

const hydrateRides = async () => {
  const userId = String(user.value?.id || '').trim();
  if (!userId) return;

  await getRidesAction();
  userRidesList.value = rides?.value
    .filter((ride: any) => ride.user.id === userId)
    .filter((ride: any) => ride.status === 'completed');
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
        <CalendarCheck2 :size="24" />
        Atendimentos Realizados
      </h1>
      <Button @click="navigateTo('/personal/rides/new')">
        <Plus class="w-4 h-4" /> Novo Atendimento
      </Button>
    </section>
    <ListPageLoading v-if="loadingData" />
    <section v-else>
      <DataTable
        :columns="columns"
        :data="userRidesList"
        sortby="code"
        :columnPin="['code']"
        :filterBy="'código do atendimento'"
      />
    </section>
  </main>
</template>

<style scoped></style>
