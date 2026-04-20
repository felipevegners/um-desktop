<script setup lang="ts">
import RideCreateAdminForm from '@/components/rides/forms/RideCreateAdminForm.vue';
import RideCreateCorporativeForm from '@/components/rides/forms/RideCreateCorporativeForm.vue';
import { useSessionAccess } from '@/composables/auth/useSessionAccess';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

const { role } = useSessionAccess();

const CurrentPage = computed(() =>
  role.value === 'admin' ? RideCreateAdminForm : RideCreateCorporativeForm,
);
</script>

<template>
  <component :is="CurrentPage" />
</template>
