// Transformar em Componente
<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import * as z from 'zod';

definePageMeta({
  layout: 'login',
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/admin',
  },
});

const formSchema = toTypedSchema(
  z.object({
    email: z.string().email(),
    password: z.string().min(2).max(8),
  }),
);

const form = useForm({
  validationSchema: formSchema,
});

const { signIn } = useAuth();

const onSubmit = form.handleSubmit(async (values) => {
  try {
    await signIn('credentials', values);
  } catch (error) {
    console.log('Erro no login -> ', error);
  }
});
</script>

<template>
  <div
    class="w-full h-screen flex flex-col justify-center items-center bg-zinc-950"
  >
    <img class="mb-12 h-10" src="/images/logo_horizontal_white.svg" alt="" />
    <Card class="p-8 w-[380px]">
      <form @submit="onSubmit">
        <h1 class="mb-8 font-bold text-2xl text-center">Acessar plataforma</h1>
        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel>E-mail</FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="Insira seu e-mail"
                v-bind="componentField"
              />
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="password">
          <FormItem>
            <FormLabel>Senha</FormLabel>
            <FormControl>
              <Input
                type="password"
                placeholder="Insira sua senha"
                v-bind="componentField"
              />
            </FormControl>
          </FormItem>
        </FormField>
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
