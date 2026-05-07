<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next';

const { data }: any = useAuth();
const role = data?.value?.user?.role;

const roleRedirect = {
  admin: '/admin',
  'master-manager': '/corporative',
  'branch-manager': '/corporative',
  'platform-admin': '/corporative',
  'platform-user': '/personal',
  'platform-driver': '/driver',
};
onMounted(() => {
  setTimeout(() => {
    //@ts-ignore
    navigateTo(roleRedirect[role] || '/auth/login');
  }, 2000);
});
</script>
<template>
  <div
    class="w-full h-screen flex flex-col gap-6 items-center justify-center bg-zinc-950"
  >
    <LoaderCircle :size="48" class="text-um-primary animate-spin" />
    <small class="text-um-primary text-sm">Redirecionando</small>
  </div>
</template>

<style scoped></style>
