<script setup lang="ts">
import RidesListPage from '@/components/rides/RidesListPage.vue';
import { useSessionAccess } from '@/composables/auth/useSessionAccess';
import { CalendarCheck2, CalendarClock, CalendarX2 } from 'lucide-vue-next';
import { columns as adminCancelledColumns } from '~/pages/admin/rides/cancelled/columns';
import { columns as adminCompletedColumns } from '~/pages/admin/rides/completed/columns';
import { columns as adminOpenColumns } from '~/pages/admin/rides/open/columns';
import { columns as corporativeCancelledColumns } from '~/pages/corporative/rides/cancelled/columns';
import { columns as corporativeCompletedColumns } from '~/pages/corporative/rides/completed/columns';
import { columns as corporativeOpenColumns } from '~/pages/corporative/rides/open/columns';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

type RideListView = 'open' | 'completed' | 'cancelled';

const route = useRoute();
const { contractId, isAdmin, role, userBranches } = useSessionAccess();

const normalizedView = computed<RideListView | null>(() => {
  const rawView = String(route.params.view || '').toLowerCase();

  if (rawView === 'open' || rawView === 'completed' || rawView === 'cancelled') {
    return rawView;
  }

  if (rawView === 'active') {
    return 'open';
  }

  if (rawView === 'canceled') {
    return 'cancelled';
  }

  return null;
});

if (!normalizedView.value) {
  throw createError({ statusCode: 404, statusMessage: 'Página não encontrada' });
}

const pageConfig = computed(() => {
  const view = normalizedView.value as RideListView;
  const scope: 'all' | 'contract' = isAdmin.value ? 'all' : 'contract';
  const baseByView = isAdmin.value
    ? {
        open: adminOpenColumns,
        completed: adminCompletedColumns,
        cancelled: adminCancelledColumns,
      }
    : {
        open: corporativeOpenColumns,
        completed: corporativeCompletedColumns,
        cancelled: corporativeCancelledColumns,
      };

  const configByView = {
    open: {
      title: 'Atendimentos Abertos',
      headTitle: 'Atendimentos Abertos | Urban Mobi',
      icon: CalendarClock,
      createPath: '/rides/form/new',
      showDriverColumn: isAdmin.value,
      showBackLink: !isAdmin.value,
      columnPin: isAdmin.value ? ['code', 'product', 'user'] : ['code'],
    },
    completed: {
      title: 'Atendimentos Finalizados',
      headTitle: 'Atendimentos Finalizados | Urban Mobi',
      icon: CalendarCheck2,
      createPath: undefined,
      showDriverColumn: false,
      showBackLink: !isAdmin.value,
      columnPin: ['code'],
    },
    cancelled: {
      title: 'Atendimentos Cancelados',
      headTitle: 'Atendimentos Cancelados | Urban Mobi',
      icon: CalendarX2,
      createPath: undefined,
      showDriverColumn: false,
      showBackLink: !isAdmin.value,
      columnPin: ['code'],
    },
  } as const;

  return {
    ...configByView[view],
    baseColumns: baseByView[view],
    scope,
    view,
    columnPin: [...configByView[view].columnPin],
  };
});

useHead(() => ({
  title: pageConfig.value.headTitle,
}));
</script>

<template>
  <RidesListPage
    :title="pageConfig.title"
    :icon="pageConfig.icon"
    :base-columns="pageConfig.baseColumns"
    :view="pageConfig.view"
    :scope="pageConfig.scope"
    :contract-id="contractId"
    :role="role"
    :user-branches="userBranches"
    :create-path="pageConfig.createPath"
    :show-driver-column="pageConfig.showDriverColumn"
    :show-back-link="pageConfig.showBackLink"
    :column-pin="pageConfig.columnPin"
  />
</template>
