<script setup lang="ts">
definePageMeta({
  layout: 'login',
  auth: {
    unauthenticatedOnly: true,
  },
});

const viewPassword = ref<boolean>(false);
const revealPassword = () => {
  viewPassword.value = !viewPassword.value;
};
const isLoading = ref<boolean>(false);

const registerType = {
  personal: 'Passegeiro UM',
  corporative: 'Empresarial',
  driver: 'Parceiro UM',
};

const route = useRoute();

const newAccountType = computed(() => {
  //@ts-ignore
  return registerType[route?.query?.type];
});
</script>
<template>
  <main class="h-screen">
    <section class="mx-auto lg:grid lg:grid-cols-2 lg:gap-6 h-full">
      <div class="p-8 bg-black flex flex-col items-end justify-center">
        <img class="mb-12 h-10" src="/images/logo_horizontal_white.svg" alt="" />

        <h2
          class="mb-3 py-2 px-3 bg-um-primary text-black text-xl font-extrabold rounded-md"
        >
          Olá, {{ newAccountType }}!
        </h2>
        <h1 class="text-white text-3xl font-extrabold">Seja bem-vindo a Urban Mobi.</h1>
        <p class="text-zinc-600 max-w-[350px] text-right text-wrap">
          Efetue seu cadastro e acesse todas as vantagens de nossa plataforma.
        </p>
      </div>
      <div class="p-10 flex items-center">
        <form @submit="" @keydown.enter.prevent="true" class="w-full">
          <div class="flex flex-col gap-4">
            <h1 class="text-zinc-950 text-3xl font-extrabold">Insira seus dados aqui.</h1>

            <FormField v-slot="{ componentField }" name="userName">
              <FormItem>
                <FormLabel>Nome de Usuário</FormLabel>
                <FormControl>
                  <Input type="text" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
            <FormField v-slot="{ componentField }" name="userEmail">
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="text" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
            <FormField v-slot="{ componentField }" name="userPassword">
              <FormItem class="relative">
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <div v-if="viewPassword" class="relative">
                    <Input
                      type="text"
                      placeholder="Insira a senha"
                      v-bind="componentField"
                      :disabled="isLoading"
                    />
                    <EyeOff
                      class="h-5 w-5 absolute top-[10px] right-3 cursor-pointer hover:text-zinc-700"
                      :class="viewPassword ? 'text-zinc-700' : 'text-zinc-400'"
                      @click.prevent="revealPassword"
                    />
                  </div>
                  <div v-else class="relative">
                    <Input
                      type="password"
                      placeholder="Insira a senha"
                      v-bind="componentField"
                      :disabled="isLoading"
                    />
                    <Eye
                      class="h-5 w-5 absolute top-[10px] right-3 cursor-pointer hover:text-zinc-700"
                      :class="viewPassword ? 'text-zinc-700' : 'text-zinc-400'"
                      @click.prevent="revealPassword"
                    />
                  </div>
                </FormControl>
                <small>*A senha deve conter de 6 a 8 caracteres</small>
                <FormMessage />
              </FormItem>
            </FormField>
            <Button class="mt-4 w-fit h-[48px]" type="button"> Registrar </Button>
          </div>
        </form>
      </div>
    </section>
  </main>
</template>

<style scoped></style>
