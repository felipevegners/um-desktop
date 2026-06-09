<script setup lang="ts">
import RideEditAdminForm from '@/components/rides/forms/RideEditAdminForm.vue';
import RideEditCorporativeForm from '@/components/rides/forms/RideEditCorporativeForm.vue';
import { useSessionAccess } from '@/composables/auth/useSessionAccess';
import { useRidesStore } from '@/stores/rides.store';
import { LoaderCircle } from 'lucide-vue-next';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

const route = useRoute();
const { role, status, waitForSessionData } = useSessionAccess();
const ridesStore = useRidesStore();
const { getRideByCodeAction, getRideByIdAction } = ridesStore;
const isPageReady = ref(false);

const CurrentPage = computed(() =>
  role.value === 'admin' ? RideEditAdminForm : RideEditCorporativeForm,
);

onBeforeMount(async () => {
  const sessionReady = await waitForSessionData({
    requireUserId: true,
    requireRole: true,
    timeoutMs: 10000,
  });

  if (!sessionReady) {
    if (status.value === 'unauthenticated') {
      await navigateTo({
        path: '/auth/login',
        query: { callbackUrl: route.fullPath },
      });
      return;
    }

    await navigateTo('/forbidden');
    return;
  }

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

  isPageReady.value = true;
});
</script>

<template>
  <div v-if="!isPageReady" class="flex min-h-[300px] items-center justify-center p-6">
    <LoaderCircle :size="42" class="animate-spin" />
  </div>
  <component :is="CurrentPage" v-else />
</template>
