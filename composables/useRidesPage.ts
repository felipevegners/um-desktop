import { useRidesStore } from '@/stores/rides.store';
import { storeToRefs } from 'pinia';

interface UseRidesPageInput {
  scope: 'all' | 'contract';
  view: 'open' | 'completed' | 'cancelled';
  contractId?: string;
  role?: string;
  userBranches?: Array<{ id?: string | null }> | null;
}

function resolveRideBranchId(ride: any): string | null {
  const paymentData = ride?.billing?.paymentData;
  return paymentData?.branchId || paymentData?.branch || null;
}

export function useRidesPage(input: UseRidesPageInput) {
  const ridesStore = useRidesStore();
  const { getRidesAction, getRidesByContractAction } = ridesStore;
  const { loadingData, capabilities, openRides, completedRides, cancelledRides } =
    storeToRefs(ridesStore);

  const branchIds = computed(() =>
    (input.userBranches || [])
      .map((branch) => branch?.id)
      .filter((value): value is string => typeof value === 'string' && value.length > 0),
  );

  const sourceRides = computed(() => {
    if (input.view === 'cancelled') {
      return cancelledRides.value || [];
    }

    if (input.view === 'completed') {
      return completedRides.value || [];
    }

    return openRides.value || [];
  });

  const filteredRides = computed(() => {
    let items = [...sourceRides.value];

    if (input.scope === 'contract' && input.role && input.role !== 'master-manager') {
      items = items.filter((ride) => {
        const branchId = resolveRideBranchId(ride);
        return typeof branchId === 'string' && branchIds.value.includes(branchId);
      });
    }

    if (input.view === 'completed' || input.view === 'cancelled') {
      return items.sort((first: any, second: any) => {
        const firstTimestamp =
          first?.progress?.finishedAt || first?.updatedAt || first?.createdAt || '';
        const secondTimestamp =
          second?.progress?.finishedAt || second?.updatedAt || second?.createdAt || '';

        return firstTimestamp > secondTimestamp
          ? -1
          : firstTimestamp < secondTimestamp
            ? 1
            : 0;
      });
    }

    return items;
  });

  const loadRides = async () => {
    if (input.scope === 'contract' && input.contractId) {
      await getRidesByContractAction(input.contractId);
      return;
    }

    await getRidesAction();
  };

  return {
    loadingData,
    capabilities,
    filteredRides,
    loadRides,
  };
}
