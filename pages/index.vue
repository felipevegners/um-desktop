// Transformar em Componente
<script setup lang="ts">
definePageMeta({
  layout: "login",
});
async function handleSubmitForm() {
  await navigateTo("/admin");
}
</script>

<template>
  <div class="w-full h-screen flex flex-col justify-center items-center">
    <img class="mb-8 w-20 h-20" src="/images/um_symbol.svg" alt="" />
    <Card class="p-8 w-[380px]">
      <form action="" @submit.prevent="handleSubmitForm">
        <h1 class="mb-8 font-bold text-2xl text-center">Acessar plataforma</h1>
        <Label for="username">Usuário:</Label>
        <Input
          class="mb-4"
          type="email"
          name="username"
          placeholder="Insira seu e-mail"
        />
        <Label for="password">Senha:</Label>
        <Input
          class="mb-4"
          type="password"
          name="password"
          placeholder="Insira sua senha"
        />
        <Button class="mt-4 h-12 w-full" type="submit">Acessar</Button>
      </form>
    </Card>
    <div class="my-4 flex gap-8 text-gray-400">
      <a class="text-sm hover:text-gray-700" href="#">Lembrar senha</a>
      <small>|</small>
      <a class="text-sm hover:text-gray-700" href="#">Solicitar cadastro</a>
    </div>
  </div>
</template>

<style scoped></style>
