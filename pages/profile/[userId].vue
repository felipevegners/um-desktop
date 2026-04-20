<script setup lang="ts">
import AccountForm from '@/components/forms/AccountForm.vue';
import DriverProfileForm from '@/components/forms/DriverProfileForm.vue';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

useHead({
  title: 'Perfil de Usuário | Urban Mobi',
});

const route = useRoute();
const { data } = useAuth();

const currentUserId = computed(() => String((data.value as any)?.user?.id || ''));
const currentUserRole = computed(() => String((data.value as any)?.user?.role || ''));

const targetUserId = computed(() => {
  const incoming = String(route.params.userId || '').trim();
  if (!incoming || incoming === 'me') {
    return currentUserId.value;
  }
  return incoming;
});

const isSelfProfile = computed(() => targetUserId.value === currentUserId.value);

const hasPermission = computed(() => {
  const role = currentUserRole.value;

  if (role === 'admin') return true;
  if (['master-manager', 'branch-manager', 'platform-admin'].includes(role)) return true;
  if (role === 'platform-driver' && isSelfProfile.value) return true;
  if (['platform-user', 'platform-corp-user'].includes(role) && isSelfProfile.value)
    return true;

  return false;
});

const formMode = computed(() => {
  const role = currentUserRole.value;
  if (role === 'admin') return 'admin';
  if (
    ['master-manager', 'branch-manager', 'platform-admin', 'platform-corp-user'].includes(
      role,
    )
  )
    return 'corporative';
  if (role === 'platform-user') return 'personal';
  return null;
});

const isDriverProfile = computed(() => currentUserRole.value === 'platform-driver');

onBeforeMount(() => {
  if (!targetUserId.value || !hasPermission.value) {
    navigateTo('/forbidden');
  }
});
</script>

<template>
  <main class="px-6 py-4">
    <header class="mb-6">
      <SharedBackLink />
    </header>

    <div v-if="!hasPermission" class="p-6 bg-red-100 border border-red-500 rounded-md">
      <p class="text-red-700 font-bold">
        Você não tem permissão para acessar esta página.
      </p>
    </div>

    <template v-else-if="isDriverProfile">
      <DriverProfileForm :driver-id="targetUserId" :is-admin-editing="!isSelfProfile" />
    </template>

    <template v-else-if="formMode">
      <AccountForm
        :account-id="targetUserId"
        :mode="formMode"
        :is-admin-editing="!isSelfProfile"
      />
    </template>
  </main>
</template>
