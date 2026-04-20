<script setup lang="ts">
import { OctagonX } from 'lucide-vue-next';

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
  <div class="w-full h-screen flex flex-col gap-6 items-center justify-center">
    <OctagonX :size="48" />
    <h3>Acesso não permitido</h3>
    <small class="text-muted-foreground">Redirecionando...</small>
  </div>
</template>

<style scoped></style>
