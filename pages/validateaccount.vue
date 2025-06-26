<script setup lang="ts">
import { ArrowLeft, ArrowRight, LoaderCircle, UserCheck } from 'lucide-vue-next';
import useVerifyEmail from '~/composables/auth/useVerifyEmail';

const { verifyEmail, error, status } = useVerifyEmail();

definePageMeta({
  layout: 'login',
  auth: {
    unauthenticatedOnly: true,
  },
});

useHead({
  title: 'Urban Mobi | Validação de Conta de Acesso',
  meta: [
    {
      name: 'description',
      content:
        status.value === 'success'
          ? 'E-mail verificado com sucesso!'
          : 'Erro ao verificar o e-mail.',
    },
  ],
});

onMounted(async () => {
  await verifyEmail();
});
</script>
<template>
  <section class="mx-auto lg:grid lg:grid-cols-2 h-screen">
    <div
      class="p-10 lg:p-20 bg-black flex flex-col items-center lg:items-end justify-center bg-[url('/images/background.webp')] bg-cover bg-center bg-no-repeat"
    >
      <img class="h-8 lg:h-10" src="/images/logo_horizontal_white.svg" alt="" />
    </div>
    <div>
      <div
        class="relative w-full p-6 md:p-12 md:pb-4 flex h-[100%] items-center justify-center flex-col text-center bg-black"
      >
        <div
          v-if="status === 'success'"
          class="flex flex-col gap-20 grow items-start justify-center relative"
        >
          <div class="space-y-4 text-start">
            <UserCheck class="text-um-primary" :size="32" />
            <h2 class="text-xl md:text-2xl font-bold text-um-primary">
              Conta validada com sucesso!
            </h2>
            <p class="text-sm md:text-md text-muted-foreground">
              Validamos seus dados e agora você pode acessar a plataforma UM.
            </p>
          </div>
          <NuxtLink
            to="/login"
            class="py-1.5 px-2.5 flex items-start gap-4 text-um-primary text-sm border border-um-primary rounded-md uppercase"
          >
            Login
            <ArrowRight :size="16" />
          </NuxtLink>
        </div>
        <div
          v-else-if="status === 'loading' || status === 'idle'"
          class="flex flex-col gap-6 grow items-center justify-center"
        >
          <LoaderCircle class="animate-spin text-um-primary" :size="32" />
        </div>
        <div
          v-else-if="status === 'error'"
          class="flex flex-col gap-20 grow items-start justify-center"
        >
          <div class="space-y-4 text-start">
            <UserCheck class="text-um-primary" :size="32" />
            <h2 class="text-xl md:text-2xl font-bold text-um-primary">
              {{ error }}
            </h2>
            <p class="text-sm md:text-md text-muted-foreground">
              Tudo certo por aqui, faça seu login agora mesmo.
            </p>
          </div>
          <NuxtLink
            to="/login"
            class="py-1.5 px-2.5 flex items-start gap-4 text-um-primary text-sm border border-um-primary rounded-md uppercase"
          >
            Login
            <ArrowRight :size="16" />
          </NuxtLink>
        </div>
        <p class="grow-0 text-xs mt-4 relative text-muted-foreground">
          Precisa de ajuda?
          <NuxtLink
            :to="'mailto:help@urbanmobi.com.br'"
            class="hover:text-um-primary hover:underline"
          >
            help@urbanmobi.com.br
          </NuxtLink>
        </p>
      </div>
    </div>
  </section>
</template>
