<script setup lang="ts">
import RideCreateForm from '@/components/rides/forms/RideCreateForm.vue';
import { useSessionAccess } from '@/composables/auth/useSessionAccess';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

const { role } = useSessionAccess();

// Ensure role is available and is one of the expected values
const isReady = computed(() => {
  const validRoles = ['admin', 'corporative', 'branch-manager', 'master-manager'];
  const roleReady =
    role.value !== undefined && role.value !== null && validRoles.includes(role.value);
  console.log('[new.vue] Role ready check:', roleReady, 'Role value:', role.value);
  return roleReady;
});

const userRole = computed(() => {
  // Admin role should always return 'admin'
  if (role.value === 'admin') {
    console.log('[new.vue] User is admin, passing userRole=admin to component');
    return 'admin';
  }

  // Any other valid role should be treated as corporative
  if (
    role.value === 'corporative' ||
    role.value === 'branch-manager' ||
    role.value === 'master-manager'
  ) {
    console.log(
      '[new.vue] User role:',
      role.value,
      ', passing userRole=corporative to component',
    );
    return 'corporative';
  }

  // Fallback (should not happen due to isReady check)
  console.warn('[new.vue] Unknown role:', role.value, ', defaulting to admin');
  return 'admin';
});
</script>

<template>
  <RideCreateForm v-if="isReady" :user-role="userRole" />
  <div v-else class="flex items-center justify-center w-full h-screen">
    <p>Carregando...</p>
  </div>
</template>
