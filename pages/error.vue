<script setup lang="ts">
import { ArrowLeft, ArrowRight, XCircleIcon } from 'lucide-vue-next';
import { EMAIL_FROM } from '~/server/providers/ config';

definePageMeta({
  layout: 'login',
  auth: {
    unauthenticatedOnly: true,
  },
});

const route = useRoute();
const error = route.query.error as string;
const formatedError = ref<any>('');

onBeforeMount(() => {
  const errorStr = error?.includes(',') ? error?.split(',') : error;
  formatedError.value = errorStr;
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
        <div class="flex flex-col gap-20 grow items-start justify-center">
          <div class="space-y-4 text-start">
            <XCircleIcon :size="32" class="text-um-primary" />
            <h2 class="text-xl md:text-2xl font-bold text-um-primary">Ooops!</h2>
            <div v-if="Array.isArray(formatedError)">
              <h2 class="text-xl md:text-2xl font-bold text-um-primary">
                {{ formatedError[0] }}
              </h2>
              <p class="text-base md:text-md text-muted-foreground">
                {{ formatedError[1] }}
              </p>
            </div>
            <h2 v-else class="text-xl md:text-2xl font-bold text-um-primary">
              {{ error }}
            </h2>
          </div>
          <NuxtLink
            to="/login"
            class="py-1.5 px-2.5 flex items-center gap-4 text-um-primary text-sm border border-um-primary rounded-md uppercase"
          >
            <ArrowLeft :size="16" />
            Voltar
          </NuxtLink>
        </div>
        <p class="grow-0 text-[12px] mb-4 relative z-2 text-muted-foreground self-left">
          Precisa de ajuda?
          <NuxtLink :to="`mailto:${EMAIL_FROM}`" class="hover:text-um-primary">
            help@urbanmobi.com.br
          </NuxtLink>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped></style>
