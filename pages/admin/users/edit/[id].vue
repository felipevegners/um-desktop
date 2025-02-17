<script setup lang="ts">
definePageMeta({
  layout: "admin",
  title: "Editar Usuário | Urban Mobi"
});

const route = useRoute();
</script>

<template>
  <div>Editar usuário: {{ route.params.id }}</div>
</template>

<style scoped></style>
