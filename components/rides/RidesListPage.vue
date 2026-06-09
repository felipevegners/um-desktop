<script setup lang="ts">
import BackLink from '@/components/shared/BackLink.vue';
import DataTable from '@/components/shared/DataTable.vue';
import ListPageLoading from '@/components/shared/ListPageLoading.vue';
import RidesTotalsDash from '@/components/shared/RidesTotalsDash.vue';
import { Button } from '@/components/ui/button';
import { useSessionAccess } from '@/composables/auth/useSessionAccess';
import { useRidesPage } from '@/composables/useRidesPage';
import { buildRideColumns } from '@/utils/rides/buildRideColumns';
import { createColumnHelper } from '@tanstack/vue-table';
import { Plus } from 'lucide-vue-next';

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
const { waitForSessionData } = useSessionAccess();
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
    try {
      const sessionReady = await waitForSessionData({
        requireUserId: true,
        requireRole: true,
        ...(props.scope === 'contract' ? { requireContractId: true } : {}),
      });

      if (!sessionReady) {
        return;
      }

      await loadRides();
    } catch (error) {
      console.error('Failed to hydrate rides list:', error);
    }
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
  <main class="p-4 md:p-6">
    <header v-if="showBackLink">
      <BackLink />
    </header>
    <section
      class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <h1
        class="flex min-w-0 items-start gap-2 text-xl sm:text-2xl font-bold leading-tight"
      >
        <component :is="icon" :size="24" class="mt-0.5 shrink-0" />
        {{ title }}
      </h1>
      <Button
        v-if="view === 'open' && createPath && capabilities?.canCreateRide !== false"
        class="w-full sm:w-auto"
        @click="navigateTo(createPath)"
      >
        <Plus class="w-4 h-4" /> {{ createLabel }}
      </Button>
    </section>
    <ListPageLoading v-if="loadingData" />
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
