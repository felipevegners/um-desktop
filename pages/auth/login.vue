<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod';
import { Eye, EyeOff, LoaderCircle } from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import * as z from 'zod';

definePageMeta({
  layout: 'login',
  auth: {
    unauthenticatedOnly: true,
  },
});

useHead({
  title: 'Acesse a plataforma | Urban Mobi',
});

const formSchema = toTypedSchema(
  z.object({
    email: z.string().email(),
    password: z
      .string({ message: 'A senha deve conter de 6 a 8 caracteres' })
      .min(6, 'A senha deve conter no mínimo 6 caracteres')
      .max(8, 'A senha deve conter no máximo 8 caracteres'),
  }),
);

const form = useForm({
  validationSchema: formSchema,
});

const { signIn } = useAuth();
const isLoading = ref<boolean>(false);

const viewPassword = ref<boolean>(false);

const revealPassword = () => {
  viewPassword.value = !viewPassword.value;
};

const onSubmit = form.handleSubmit(async (values) => {
  try {
    isLoading.value = true;
    await signIn('credentials', values);
  } catch (error) {
    console.error('Erro no login -> ', error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div
    class="dark w-full h-screen flex flex-col justify-center items-center bg-black bg-[url('/images/background.webp')] bg-cover bg-center bg-no-repeat"
  >
    <img class="mb-12 h-14" src="/images/logo_horizontal_white.svg" alt="" />
    <Card class="p-8 w-full max-w-sm md:max-w-md border-none bg-black shadow-lg">
      <form @submit="onSubmit">
        <div class="space-y-8">
          <h1
            class="pb-4 text-lg text-muted-foreground border-b border-muted-foreground/30"
          >
            Acessar Plataforma
          </h1>
          <div class="flex flex-col gap-6">
            <FormField v-slot="{ componentField }" name="email">
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Insira seu e-mail"
                    v-bind="componentField"
                    :disabled="isLoading"
                    class="bg-zinc-800"
                  />
                </FormControl>
              </FormItem>
            </FormField>
            <FormField v-slot="{ componentField }" name="password">
              <FormItem class="relative">
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <div v-if="viewPassword" class="relative">
                    <Input
                      type="text"
                      placeholder="Insira a senha"
                      v-bind="componentField"
                      :disabled="isLoading"
                      class="bg-zinc-800"
                      maxlength="8"
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
                      class="bg-zinc-800"
                      maxlength="8"
                    />
                    <Eye
                      class="h-5 w-5 absolute top-[10px] right-3 cursor-pointer hover:text-zinc-700"
                      :class="viewPassword ? 'text-zinc-700' : 'text-zinc-400'"
                      @click.prevent="revealPassword"
                    />
                  </div>
                </FormControl>
                <FormMessage class="text-xs" />
              </FormItem>
            </FormField>
            <div
              v-if="isLoading"
              class="mt-4 p-2 flex items-center justify-center bg-black rounded-md"
            >
              <LoaderCircle class="w-8 h-8 text-white animate-spin" />
            </div>
            <Button
              v-else
              class="mt-4 w-full h-[48px] bg-um-primary hover:bg-gradient-to-t from-um-primary to-black/30 text-black uppercase font-bold"
              type="submit"
            >
              Acessar
            </Button>
          </div>
          <div
            class="mt-6 flex flex-col items-center justify-center gap-6 text-muted-foreground text-xs"
          >
            <div>
              <NuxtLink to="#" class="hover:text-um-primary"> Lembrar senha </NuxtLink>
            </div>
            <div class="flex items-start gap-4">
              <NuxtLink to="/register?type=personal" class="hover:text-um-primary">
                Conta Pessoal
              </NuxtLink>
              <small>|</small>
              <NuxtLink to="/register?type=driver" class="hover:text-um-primary">
                Seja um Motorista
              </NuxtLink>
              <small>|</small>
              <NuxtLink to="/register?type=corporative" class="hover:text-um-primary">
                Conta Corporativa
              </NuxtLink>
            </div>
          </div>
        </div>
      </form>
    </Card>
  </div>
</template>

<style scoped></style>
