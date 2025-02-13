// Transformar em Componente
<script setup lang="ts">
definePageMeta({
  layout: "login"
});
async function handleSubmitForm() {
  await navigateTo("/admin");
}
</script>

<template>
  <div
    class="w-full h-screen flex flex-col justify-center items-center bg-zinc-950"
  >
    <img class="mb-12 h-10" src="/images/logo_horizontal_white.svg" alt="" />
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
    <div class="my-4 flex gap-8 text-zinc-600">
      <a class="text-sm hover:text-zinc-400" href="#">Lembrar senha</a>
      <small>|</small>
      <a class="text-sm hover:text-zinc-400" href="#">Solicitar cadastro</a>
    </div>
  </div>
</template>

<style scoped></style>
