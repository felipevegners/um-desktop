<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { createColumnHelper } from '@tanstack/vue-table';
import { CalendarDays, LoaderCircle, Plus } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import DataTable from '~/components/shared/DataTable.vue';
import TableActions from '~/components/shared/TableActions.vue';
import { useRidesStore } from '~/stores/rides.store';

import { columns } from './columns';

const ridesStore = useRidesStore();
const { getRidesAction } = ridesStore;
const { loadingData, rides } = storeToRefs(ridesStore);
const columnHelper = createColumnHelper<any>();
const userRidesList = ref([]);

const { data } = useAuth();

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
useHead({
  title: 'Atendimentos Realizados | Urban Mobi',
});

onMounted(async () => {
  await getRidesAction();
  userRidesList.value = rides?.value
    .filter(
      //@ts-ignore
      (ride: any) => ride.user.id === data.value?.user?.id,
    )
    .filter((ride: any) => ride.status === 'completed');
});
</script>
<template>
  <main class="p-6">
    <section class="mb-6 flex items-center gap-6">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <CalendarDays />
        Atendimentos Realizados
      </h1>
      <Button @click="navigateTo('/personal/rides/new')">
        <Plus class="w-4 h-4" /> Novo Atendimento
      </Button>
    </section>
    <section v-if="loadingData" class="p-10 flex items-center justify-center">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
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
