// Transformar em Componente
<script setup lang="ts">
definePageMeta({
  layout: 'login',
  middleware: 'sidebase-auth',
});
</script>

<template>
  <div
    class="w-full h-screen flex flex-col justify-center items-center bg-zinc-950"
  >
    <h1>Seja bem vindo</h1>
  </div>
</template>

<style scoped></style>
