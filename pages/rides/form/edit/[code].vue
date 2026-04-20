<script setup lang="ts">
import RideEditAdminForm from '@/components/rides/forms/RideEditAdminForm.vue';
import RideEditCorporativeForm from '@/components/rides/forms/RideEditCorporativeForm.vue';
import { useSessionAccess } from '@/composables/auth/useSessionAccess';
import { useRidesStore } from '@/stores/rides.store';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

const route = useRoute();
const { role } = useSessionAccess();
const ridesStore = useRidesStore();
const { getRideByCodeAction, getRideByIdAction } = ridesStore;

const CurrentPage = computed(() =>
  role.value === 'admin' ? RideEditAdminForm : RideEditCorporativeForm,
);

onBeforeMount(async () => {
  const routeRef = String(route.params.code || '');
  if (!routeRef) {
    navigateTo('/rides/form/new');
    return;
  }

  try {
    if (routeRef.startsWith('UM-')) {
      await getRideByCodeAction(routeRef);
    } else {
      await getRideByIdAction(routeRef);
    }
  } catch (error) {
    navigateTo('/forbidden');
    return;
  }

  if (!ridesStore.ride?.id) {
    navigateTo('/forbidden');
    return;
  }
});
</script>

<template>
  <component :is="CurrentPage" />
</template>
