<script setup lang="ts">
import { ArrowLeft, ArrowUpDown, LoaderCircle, Plus } from 'lucide-vue-next';

definePageMeta({
  layout: 'admin',
});
useHead({
  title: 'Novo Atendimento | Urban Mobi',
});
</script>
<template>
  <main class="p-6">
    <header>
      <div class="mb-8 flex items-center">
        <NuxtLink to="/admin/rides/active" class="flex hover:font-bold">
          <ArrowLeft class="mr-2" />
          Voltar
        </NuxtLink>
      </div>
    </header>
    <section class="mb-6 flex items-center gap-6">
      <h1 class="font-bold text-black text-3xl">Gerar Novo Atendimento</h1>
    </section>
    <section>
      <Card class="bg-zinc-300">
        <CardHeader>
          <CardTitle>Dados do Atendimento</CardTitle>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
            <div class="grid grid-cols-2 gap-8">
              <FormField v-slot="{ componentField }" name="document">
                <FormItem>
                  <FormLabel>Origem</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Insira a origem"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  </main>
</template>

<style scoped></style>
