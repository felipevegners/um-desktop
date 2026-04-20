<script setup lang="ts">
import { CalendarX2, LoaderCircle } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import DataTable from '~/components/shared/DataTable.vue';
import { useRidesStore } from '~/stores/rides.store';

import { columns } from './columns';

const ridesStore = useRidesStore();
const { getDriverRidesAction } = ridesStore;
const { loadingData, rides } = storeToRefs(ridesStore);
const driverCanceledList = ref([]);

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
useHead({
  title: 'Atendimentos Cancelados | Urban Mobi',
});

const { data } = useAuth();

onMounted(async () => {
  //@ts-ignore
  await getDriverRidesAction(data?.value?.user?.id);
  driverCanceledList.value = rides?.value.filter((ride: any) => {
    const status = String(ride?.status || '').toLowerCase();
    return status === 'cancelled' || status === 'canceled';
  });
});
</script>
<template>
  <main class="p-6">
    <header>
      <SharedBackLink />
    </header>
    <section class="mb-6 flex items-center gap-6">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <CalendarX2 :size="24" />
        Atendimentos Cancelados
      </h1>
    </section>
    <section v-if="loadingData" class="p-10 flex items-center justify-center">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
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
