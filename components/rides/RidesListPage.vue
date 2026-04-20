<script setup lang="ts">
import BackLink from '@/components/shared/BackLink.vue';
import DataTable from '@/components/shared/DataTable.vue';
import RidesTotalsDash from '@/components/shared/RidesTotalsDash.vue';
import { Button } from '@/components/ui/button';
import { useRidesPage } from '@/composables/useRidesPage';
import { buildRideColumns } from '@/utils/rides/buildRideColumns';
import { createColumnHelper } from '@tanstack/vue-table';
import { LoaderCircle, Plus } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    title: string;
    icon: any;
    baseColumns: any[];
    view: 'open' | 'completed' | 'cancelled';
    scope: 'all' | 'contract';
    contractId?: string;
    role?: string;
    userBranches?: Array<{ id?: string | null }>;
    createPath?: string;
    createLabel?: string;
    previewRouteName?: string;
    showBackLink?: boolean;
    showDriverColumn?: boolean;
    filterBy?: string;
    columnPin?: string[];
    sortBy?: string;
  }>(),
  {
    createPath: undefined,
    createLabel: 'Criar novo atendimento',
    editRouteName: undefined,
    previewRouteName: undefined,
    showBackLink: false,
    showDriverColumn: false,
    filterBy: 'código ou usuário',
    columnPin: () => ['code'],
    sortBy: 'user',
  },
);

const columnHelper = createColumnHelper<any>();
const { loadingData, capabilities, filteredRides, loadRides } = useRidesPage({
  scope: props.scope,
  view: props.view,
  contractId: props.contractId,
  role: props.role,
  userBranches: props.userBranches,
});

const branchIdsKey = computed(() =>
  JSON.stringify((props.userBranches || []).map((branch) => branch?.id || '')),
);

watch(
  () => [
    props.scope,
    props.view,
    props.contractId || '',
    props.role || '',
    branchIdsKey.value,
  ],
  async () => {
    await loadRides();
  },
  { immediate: true },
);

const handleEdit = (rideRef: string) => {
  navigateTo(`/rides/form/edit/${rideRef}`);
};

const handleView = (rideId: string) => {
  if (!props.previewRouteName) {
    navigateTo(`/rides/form/edit/${rideId}`);
    return;
  }

  navigateTo({
    name: props.previewRouteName,
    params: { id: rideId },
  });
};

const finalColumns = computed(() =>
  buildRideColumns({
    baseColumns: props.baseColumns,
    columnHelper,
    capabilities: capabilities?.value ?? {},
    includeDriverColumn: props.showDriverColumn,
    onEdit: handleEdit,
    onView: handleView,
  }),
);
</script>

<template>
  <main class="p-6">
    <header v-if="showBackLink">
      <BackLink />
    </header>
    <section class="mb-6 flex items-center justify-between gap-6">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <component :is="icon" :size="24" />
        {{ title }}
      </h1>
      <Button
        v-if="view === 'open' && createPath && capabilities?.canCreateRide !== false"
        @click="navigateTo(createPath)"
      >
        <Plus class="w-4 h-4" /> {{ createLabel }}
      </Button>
    </section>
    <section v-if="loadingData" class="flex items-center justify-center p-10">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else>
      <RidesTotalsDash :rides="filteredRides" />
      <DataTable
        :columns="finalColumns"
        :data="filteredRides"
        :sortby="sortBy"
        :columnPin="columnPin"
        :filterBy="filterBy"
      />
    </section>
  </main>
</template>
