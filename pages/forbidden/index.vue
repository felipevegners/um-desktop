<script setup lang="ts">
import { OctagonX } from 'lucide-vue-next';

const { data }: any = useAuth();
const role = data?.value?.user?.role;

const roleRedirect = {
  'platform-user': '/personal',
  'platform-driver': '/driver',
};
onMounted(() => {
  setTimeout(() => {
    //@ts-ignore
    navigateTo(role[roleRedirect]);
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
