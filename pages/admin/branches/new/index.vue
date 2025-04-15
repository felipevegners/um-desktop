<script setup lang="ts">
import CompanyForm from '@/components/forms/CompanyForm.vue';
import BackLink from '@/components/shared/BackLink.vue';
import { Building2, Check, LoaderCircle } from 'lucide-vue-next';

definePageMeta({
  layout: 'admin',
});
useHead({
  title: 'Backoffice - Adicionar Nova Filial | Urban Mobi',
});
</script>

<template>
  <main class="p-6">
    <header>
      <BackLink />
    </header>
    <section class="mb-10 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <Building2 class="w-6 h-6" />
        Cadastrar Nova Filial
      </h1>
    </section>
    <section class="py-6 bg-zinc-200 rounded-md">
      <form @submit="">
        <h2 class="mb-6 px-6 font-bold text-2xl">Dados da Filial</h2>
        <CompanyForm :is-editing="false" />
        <div class="mt-6 px-6 flex">
          <Button type="submit">
            <LoaderCircle v-if="true" class="w-5 h-5 animate-spin" />
            Cadastrar
          </Button>
          <Button type="button" variant="ghost"> Cancelar </Button>
        </div>
      </form>
    </section>
  </main>
</template>

<style scoped></style>
