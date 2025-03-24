<script setup lang="ts">
import RegisterForm from '@/components/shared/RegisterForm.vue';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-vue-next';

definePageMeta({
  layout: 'admin',
});

useHead({
  title: 'Contas de Usuário | Urban Mobi',
});
</script>
<template>
  <main class="p-6">
    <section class="mb-6 flex items-center gap-6">
      <h1 class="font-bold text-black text-3xl">Contas de Usuário</h1>
      <div>
        <Button> <Plus class="w-4 h-4" /> Cadastrar Usuário </Button>
      </div>
    </section>
    <section>
      <Card class="bg-zinc-200">
        <CardHeader>
          <CardTitle>Nova conta de acesso</CardTitle>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </section>
    <section class="py-6">
      <h2 class="font-bold text-2xl">Contas de Acesso cadastradas</h2>
    </section>
  </main>
</template>

<style scoped></style>
