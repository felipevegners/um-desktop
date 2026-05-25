<script setup lang="ts">
import ListPageLoading from '@/components/shared/ListPageLoading.vue';

const { data, status }: any = useAuth();
const hasRedirected = ref(false);

const roleRedirect = {
  admin: '/admin',
  'master-manager': '/corporative',
  'branch-manager': '/corporative',
  'platform-admin': '/corporative',
  'platform-user': '/personal',
  'platform-driver': '/driver',
};

watch(
  [status, () => data?.value?.user?.role],
  async () => {
    if (hasRedirected.value) return;
    if (status.value === 'loading') return;

    const role = data?.value?.user?.role;
    const targetPath = roleRedirect[role as keyof typeof roleRedirect] || '/auth/login';
    hasRedirected.value = true;
    await navigateTo(targetPath, { replace: true });
  },
  { immediate: true },
);
</script>
<template>
  <div class="w-full h-screen bg-zinc-950 text-um-primary">
    <ListPageLoading />
  </div>
</template>

<style scoped></style>
