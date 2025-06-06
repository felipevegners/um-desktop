<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next';
import { onMounted } from 'vue';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

const userRolesRedirect = {
  admin: '/admin',
  'master-manager': '/corporative',
  'branch-manager': '/corporative',
  'platform-admin': '/corporative',
  'platform-corp-user': '/corporative',
  'platform-user': '/personal',
  'platform-driver': '/driver',
};
const { data, status } = useAuth();
const router = useRouter();

onMounted(() => {
  if (status.value === 'authenticated') {
    //@ts-ignore
    router.push({ path: userRolesRedirect[data?.value?.user?.role] });
  }
});
</script>

<template>
  <section class="p-6 w-full h-full flex items-center justify-center">
    <LoaderCircle class="animate-spin text-black" :size="48" />
  </section>
</template>
