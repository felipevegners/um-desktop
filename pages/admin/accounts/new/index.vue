<script setup lang="ts">
import BackLink from '@/components/shared/BackLink.vue';
import RegisterForm from '@/components/shared/RegisterForm.vue';
import { useAccountStore } from '@/stores/admin/account.store';
import { UserPen } from 'lucide-vue-next';

definePageMeta({
  layout: 'admin',
});

useHead({
  title: 'Backoffice - Nova Contas de Usuário | Urban Mobi',
});
</script>
<template>
  <main class="p-6">
    <header>
      <BackLink />
    </header>
    <section class="mb-10 flex items-center gap-4">
      <UserPen :size="32" />
      <h1 class="font-bold text-black text-3xl">Criar Usuário</h1>
    </section>
    <RegisterForm />
  </main>
</template>

<style scoped></style>
