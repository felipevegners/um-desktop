<script setup lang="ts">
import ListPageLoading from '@/components/shared/ListPageLoading.vue';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

const userRolesRedirect = {
  admin: '/admin',
  'master-manager': '/corporative',
  'branch-manager': '/corporative',
  'platform-admin': '/corporative',
  'platform-corp-user': '/personal',
  'platform-user': '/personal',
  'platform-driver': '/driver',
};
const { data, status } = useAuth();
const hasRedirected = ref(false);

watch(
  [status, () => (data.value as any)?.user?.role],
  async () => {
    if (hasRedirected.value) return;

    if (status.value === 'authenticated') {
      const role = (data.value as any)?.user?.role;
      const targetPath = userRolesRedirect[role as keyof typeof userRolesRedirect] || '/';
      hasRedirected.value = true;
      await navigateTo(targetPath, { replace: true });
      return;
    }

    if (status.value === 'unauthenticated') {
      hasRedirected.value = true;
      await navigateTo('/auth/login', { replace: true });
    }
  },
  { immediate: true },
);
</script>

<template>
  <ListPageLoading />
</template>
