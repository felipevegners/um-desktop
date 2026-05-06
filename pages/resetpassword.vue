<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod';
import { ArrowLeft, LoaderCircle } from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import * as z from 'zod';
import { useToast } from '~/components/ui/toast';

definePageMeta({
  layout: 'login',
  auth: false,
});

useHead({ title: 'Recuperar senha | Urban Mobi' });

const router = useRouter();
const { toast } = useToast();

type Step = 'email' | 'code' | 'password';
const currentStep = ref<Step>('email');
const currentEmail = ref('');
const currentRequestId = ref('');
const resetToken = ref('');
const isLoading = ref(false);
const codeResendCountdown = ref(0);

// Único useForm com schema reativo por step.
// IMPORTANTE: múltiplos useForm() no mesmo componente sobrescrevem o
// mesmo provide(FormContextKey), então todos os FormField se conectariam
// apenas ao último form criado. A solução é um único useForm().
const validationSchema = computed(() => {
  switch (currentStep.value) {
    case 'email':
      return toTypedSchema(
        z.object({
          email: z
            .string({ required_error: 'E-mail é obrigatório' })
            .min(1, 'E-mail é obrigatório')
            .email('E-mail inválido'),
        }),
      );
    case 'code':
      return toTypedSchema(
        z.object({
          code: z
            .string({ required_error: 'Código é obrigatório' })
            .min(1, 'Código é obrigatório')
            .length(6, 'O código deve ter 6 dígitos')
            .regex(/^\d+$/, 'O código deve conter apenas números'),
        }),
      );
    case 'password':
      return toTypedSchema(
        z
          .object({
            password: z
              .string({ required_error: 'Senha é obrigatória' })
              .min(1, 'Senha é obrigatória')
              .min(6, 'A senha deve ter no mínimo 6 caracteres')
              .max(8, 'A senha deve ter no máximo 8 caracteres'),
            confirmPassword: z
              .string({ required_error: 'Confirmação é obrigatória' })
              .min(1, 'Confirmação é obrigatória'),
          })
          .refine((d) => d.password === d.confirmPassword, {
            message: 'As senhas não coincidem',
            path: ['confirmPassword'],
          }),
      );
  }
});

const { handleSubmit, resetForm } = useForm({ validationSchema });

const onSubmit = handleSubmit(async (values) => {
  try {
    isLoading.value = true;

    if (currentStep.value === 'email') {
      const res = await $fetch<{ requestId: string; expiresIn: number }>(
        '/api/auth/password-reset-request',
        { method: 'POST', body: { email: (values as any).email } },
      );
      currentEmail.value = (values as any).email;
      currentRequestId.value = res.requestId;
      resetForm();
      currentStep.value = 'code';
      toast({
        title: 'Código enviado!',
        description: 'Verifique seu e-mail. O código é válido por 15 minutos.',
        class: 'bg-green-500 border-0 text-white',
      });
      startCountdown();
    } else if (currentStep.value === 'code') {
      const res = await $fetch<{ token: string; expiresIn: number }>(
        '/api/auth/password-reset-verify',
        {
          method: 'POST',
          body: { requestId: currentRequestId.value, code: (values as any).code },
        },
      );
      resetToken.value = res.token;
      resetForm();
      currentStep.value = 'password';
      toast({
        title: 'Código verificado!',
        description: 'Agora defina sua nova senha.',
        class: 'bg-green-500 border-0 text-white',
      });
    } else if (currentStep.value === 'password') {
      await $fetch('/api/auth/password-reset', {
        method: 'POST',
        body: { token: resetToken.value, password: (values as any).password },
      });
      toast({
        title: 'Sucesso!',
        description: 'Sua senha foi alterada. Redirecionando...',
        class: 'bg-green-500 border-0 text-white',
      });
      setTimeout(() => router.push('/auth/login'), 2000);
    }
  } catch (error: any) {
    toast({
      title: 'Erro',
      description:
        error.data?.message || error.message || 'Ocorreu um erro. Tente novamente.',
      class: 'bg-red-500 border-0 text-white',
    });
  } finally {
    isLoading.value = false;
  }
});

const startCountdown = () => {
  codeResendCountdown.value = 60;
  const interval = setInterval(() => {
    codeResendCountdown.value--;
    if (codeResendCountdown.value <= 0) clearInterval(interval);
  }, 1000);
};

const resendCode = async () => {
  if (codeResendCountdown.value > 0) return;
  try {
    isLoading.value = true;
    const res = await $fetch<{ requestId: string }>('/api/auth/password-reset-request', {
      method: 'POST',
      body: { email: currentEmail.value },
    });
    currentRequestId.value = res.requestId;
    toast({
      title: 'Código reenviado!',
      description: 'Verifique seu e-mail novamente.',
      class: 'bg-green-500 border-0 text-white',
    });
    startCountdown();
  } catch {
    toast({
      title: 'Erro',
      description: 'Não foi possível reenviar o código.',
      class: 'bg-red-500 border-0 text-white',
    });
  } finally {
    isLoading.value = false;
  }
};

const goBack = () => {
  resetForm();
  if (currentStep.value === 'code') currentStep.value = 'email';
  else if (currentStep.value === 'password') currentStep.value = 'code';
};
</script>

<template>
  <div
    class="dark w-full h-screen flex flex-col justify-center items-center bg-black bg-[url('/images/background.webp')] bg-cover bg-center bg-no-repeat"
  >
    <img class="mb-12 h-14" src="/images/logo_horizontal_white.svg" alt="" />
    <Card class="p-8 w-full max-w-sm md:max-w-md border-none bg-black shadow-lg">
      <form @submit="onSubmit">
        <!-- Step 1: E-mail -->
        <template v-if="currentStep === 'email'">
          <div class="space-y-8">
            <div class="pb-4 flex items-center gap-2 border-b border-muted-foreground/30">
              <button
                type="button"
                class="p-1 hover:bg-zinc-800 rounded-md transition"
                @click="router.push('/auth/login')"
              >
                <ArrowLeft :size="20" class="text-muted-foreground" />
              </button>
              <h1 class="text-lg text-muted-foreground">Recuperar Senha</h1>
            </div>

            <div class="flex flex-col gap-6">
              <p class="text-sm text-muted-foreground">
                Digite seu e-mail para receber um código de verificação.
              </p>

              <FormField v-slot="{ componentField }" name="email">
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Insira seu e-mail"
                      class="bg-zinc-800"
                      :disabled="isLoading"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage class="text-xs" />
                </FormItem>
              </FormField>

              <div v-if="isLoading" class="mt-4 p-2 flex items-center justify-center">
                <LoaderCircle class="w-8 h-8 text-white animate-spin" />
              </div>
              <Button
                v-else
                type="submit"
                variant="ghost"
                class="mt-4 w-full h-[48px] bg-um-primary hover:bg-um-primary-foreground text-black uppercase font-bold"
              >
                Enviar Código
              </Button>
            </div>
          </div>
        </template>

        <!-- Step 2: Código -->
        <template v-else-if="currentStep === 'code'">
          <div class="space-y-8">
            <div class="pb-4 flex items-center gap-2 border-b border-muted-foreground/30">
              <button
                type="button"
                class="p-1 hover:bg-zinc-800 rounded-md transition"
                @click="goBack"
              >
                <ArrowLeft :size="20" class="text-muted-foreground" />
              </button>
              <h1 class="text-lg text-muted-foreground">Verificar Código</h1>
            </div>

            <div class="flex flex-col gap-6">
              <div>
                <p class="text-sm text-muted-foreground">
                  Enviamos um código de 6 dígitos para:
                </p>
                <p class="text-sm font-medium text-foreground mt-1">{{ currentEmail }}</p>
              </div>

              <FormField v-slot="{ componentField }" name="code">
                <FormItem>
                  <FormLabel>Código de Verificação</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="000000"
                      inputmode="numeric"
                      maxlength="6"
                      class="bg-zinc-800 text-center text-2xl tracking-widest"
                      :disabled="isLoading"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage class="text-xs" />
                </FormItem>
              </FormField>

              <div class="text-center">
                <button
                  type="button"
                  :disabled="codeResendCountdown > 0 || isLoading"
                  class="text-sm text-um-primary hover:text-um-primary-foreground disabled:text-muted-foreground transition"
                  @click="resendCode"
                >
                  {{
                    codeResendCountdown > 0
                      ? `Reenviar em ${codeResendCountdown}s`
                      : 'Reenviar código'
                  }}
                </button>
              </div>

              <div v-if="isLoading" class="mt-4 p-2 flex items-center justify-center">
                <LoaderCircle class="w-8 h-8 text-white animate-spin" />
              </div>
              <Button
                v-else
                type="submit"
                variant="ghost"
                class="mt-4 w-full h-[48px] bg-um-primary hover:bg-um-primary-foreground text-black uppercase font-bold"
              >
                Verificar Código
              </Button>
            </div>
          </div>
        </template>

        <!-- Step 3: Nova Senha -->
        <template v-else-if="currentStep === 'password'">
          <div class="space-y-8">
            <div class="pb-4 flex items-center gap-2 border-b border-muted-foreground/30">
              <button
                type="button"
                class="p-1 hover:bg-zinc-800 rounded-md transition"
                @click="goBack"
              >
                <ArrowLeft :size="20" class="text-muted-foreground" />
              </button>
              <h1 class="text-lg text-muted-foreground">Nova Senha</h1>
            </div>

            <div class="flex flex-col gap-6">
              <p class="text-sm text-muted-foreground">
                Defina sua nova senha (6 a 8 caracteres).
              </p>

              <FormField v-slot="{ componentField }" name="password">
                <FormItem>
                  <FormLabel>Nova Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Digite sua nova senha"
                      class="bg-zinc-800"
                      :disabled="isLoading"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage class="text-xs" />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="confirmPassword">
                <FormItem>
                  <FormLabel>Confirmar Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirme sua nova senha"
                      class="bg-zinc-800"
                      :disabled="isLoading"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage class="text-xs" />
                </FormItem>
              </FormField>

              <div v-if="isLoading" class="mt-4 p-2 flex items-center justify-center">
                <LoaderCircle class="w-8 h-8 text-white animate-spin" />
              </div>
              <Button
                v-else
                type="submit"
                variant="ghost"
                class="mt-4 w-full h-[48px] bg-um-primary hover:bg-um-primary-foreground text-black uppercase font-bold"
              >
                Redefinir Senha
              </Button>
            </div>
          </div>
        </template>
      </form>
    </Card>
  </div>
</template>
