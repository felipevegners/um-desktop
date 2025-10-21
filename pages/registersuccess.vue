<script setup lang="ts">
import { ArrowRight, CircleCheck } from 'lucide-vue-next';

definePageMeta({
  layout: 'login',
  auth: {
    unauthenticatedOnly: true,
  },
});
</script>
<template>
  <section class="mx-auto lg:grid lg:grid-cols-2 h-screen">
    <div
      class="p-10 lg:p-20 bg-black flex flex-col items-center lg:items-end justify-center bg-[url('/images/background.webp')] bg-cover bg-center bg-no-repeat"
    >
      <img class="h-8 lg:h-14" src="/images/logo_horizontal_white.svg" alt="" />
    </div>
    <div>
      <div
        class="relative w-full p-6 md:p-12 md:pb-4 flex h-[100%] items-center justify-center flex-col text-center bg-black"
      >
        <div class="flex flex-col gap-20 grow items-start justify-center">
          <div class="space-y-4 text-start">
            <CircleCheck class="text-um-primary" :size="32" />
            <h2 class="text-xl md:text-2xl font-bold text-um-primary">
              Conta criada com sucesso!
            </h2>
            <p class="text-sm md:text-md text-muted-foreground">
              Verifique seu e-mail para validar sua conta.
            </p>
          </div>
          <NuxtLink
            to="/auth/login"
            class="py-1.5 px-2.5 flex items-center gap-4 text-um-primary text-sm border border-um-primary rounded-md uppercase"
          >
            Login
            <ArrowRight :size="16" />
          </NuxtLink>
        </div>
        <p class="grow-0 text-[12px] mt-4 relative z-2 text-muted-foreground">
          Precisa de ajuda?
          <NuxtLink :to="'mailto:help@urbanmobi.com.br'" class="hover:text-um-primary">
            help@urbanmobi.com.br
          </NuxtLink>
        </p>
      </div>
    </div>
  </section>
</template>
