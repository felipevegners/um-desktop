<script setup lang="ts">
import { Plus } from "lucide-vue-next";
</script>

<template>
  <main class="p-6">
    <section class="mb-6 flex items-center gap-6">
      <h1 class="font-bold text-black text-2xl">Clientes ativos</h1>
      <div>
        <Button> <Plus class="w-4 h-4" /> Cadastrar cliente </Button>
      </div>
    </section>
    <Separator />
  </main>
</template>
