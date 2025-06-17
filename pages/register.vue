<script setup lang="ts">
import { useToast } from '@/components/ui/toast';
import { useAccountStore } from '@/stores/admin/account.store';
import { toTypedSchema } from '@vee-validate/zod';
import { Eye, EyeOff, Info, LoaderCircle } from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { useForm } from 'vee-validate';
import * as z from 'zod';

definePageMeta({
  layout: 'login',
  auth: {
    unauthenticatedOnly: true,
  },
});

useHead({
  title: 'Nova Conta de Usuário | Urban Mobi',
});

const { toast } = useToast();

const accountStore = useAccountStore();
const { registerUserAccountAction } = accountStore;
const { isLoadingSend } = storeToRefs(accountStore);

const route = useRoute();
const viewPassword = ref<boolean>(false);
const revealPassword = () => {
  viewPassword.value = !viewPassword.value;
};
const isLoading = ref<boolean>(false);
const userType = ref('');
userType.value = route?.query?.type as string;

const registerType = {
  personal: 'platform-user',
  corporative: 'master-manager',
  driver: 'platform-driver',
};

const newAccountType = computed(() => {
  //@ts-ignore
  return registerType[route?.query?.type];
});

const formSchema = toTypedSchema(
  z.object({
    name: z.string({ message: 'Campo obrigatório' }).min(2, 'Mínimo 2 caracteres'),
    email: z.string().min(2, 'Insira um e-mail válido').email(),
    document: z.string().min(2, 'Insira um documento válido').max(18).optional(),
    password: z
      .string()
      .min(6, 'Mínimo de 6 caracteres')
      .max(8, 'Máximo de 8 caracteres'),
    phone: z.string({ message: 'Campo obrigatório' }),
    position: z.string().optional(),
    department: z.string().optional(),
  }),
);

const form = useForm({
  validationSchema: formSchema,
});

const onSubmit = form.handleSubmit(async (values) => {
  const accountData = {
    username: values.name,
    document: values.document,
    email: values.email,
    password: values.password,
    role: newAccountType.value || 'platform-user',
    enabled: true,
    status: 'pending',
    phone: values.phone,
    position: values.position || '',
    department: values.department || '',
    avatar: {
      name: '',
      url: '',
    },
    contract: {
      contractId: '-',
      name: '-',
      branchId: '-',
      area: '-',
    },
  };

  try {
    await registerUserAccountAction(accountData);
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao criar a sua conta. Tente novamente.`,
    });
    throw error;
  } finally {
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description:
        'Conta de Usuário cadastrado com sucesso. Acesse seu e-mail para prosseguir!',
    });
    navigateTo('/login');
  }
});
</script>
<template>
  <main class="h-screen">
    <section class="mx-auto lg:grid lg:grid-cols-2 lg:gap-6 h-full">
      <div
        class="p-10 lg:p-20 bg-black flex flex-col items-center lg:items-end justify-center bg-[url('/images/background.webp')] bg-cover bg-center bg-no-repeat"
      >
        <img class="h-8 lg:h-10" src="/images/logo_horizontal_white.svg" alt="" />
      </div>
      <div class="p-10 lg:p-20 flex items-center max-w-xl mx-auto">
        <form
          @submit.prevent="onSubmit"
          @keydown.enter.prevent="true"
          class="mx-auto w-full"
          :validation-schema="formSchema"
        >
          <div class="flex flex-col gap-6">
            <h1 class="text-4xl font-bold text-zinc-900 tracking-tight">
              Vamos criar sua conta na Urban Mobi?
            </h1>
            <p class="text-muted-foreground text-sm">
              Para realizarmos seu atendimento, preencha seus dados abaixo. Você receberá
              um e-mail para confirmarmos seus dados. Leva apenas 2 minutos.
            </p>
            <div class="flex flex-col gap-6">
              <FormField v-slot="{ componentField, errorMessage }" name="name">
                <FormItem class="relative">
                  <FormLabel>Nome Completo*</FormLabel>
                  <FormControl>
                    <Input type="text" v-bind="componentField" />
                  </FormControl>
                  <!-- <FormMessage class="absolute left-0 text-xs" /> -->
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="phone">
                <FormItem class="relative">
                  <FormLabel>Celular*</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      v-bind="componentField"
                      v-maska="'(##) ####-####'"
                    />
                  </FormControl>
                  <!-- <FormMessage class="absolute right-0 text-xs" /> -->
                </FormItem>
              </FormField>
              <FormField
                v-if="userType === 'corporative'"
                v-slot="{ componentField }"
                name="document"
              >
                <FormItem class="relative">
                  <FormLabel>CNPJ*</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      v-bind="componentField"
                      v-maska="'##.###.###/####-##'"
                    />
                  </FormControl>
                  <FormMessage class="absolute right-0 text-xs" />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="email">
                <FormItem class="relative">
                  <FormLabel>E-mail*</FormLabel>
                  <FormControl>
                    <Input type="text" v-bind="componentField" />
                  </FormControl>
                  <FormMessage class="absolute right-0 text-xs" />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="password">
                <FormItem class="relative">
                  <div class="flex items-center gap-2">
                    <FormLabel>Senha*</FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <Info class="w-4 h-4 text-zinc-400" />
                        </TooltipTrigger>
                        <TooltipContent class="bg-zinc-700 text-white">
                          <TooltipArrow />
                          <p>A senha deve conter de 6 a 8 caracteres alfanuméricos</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
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
                        placeholder="Insira a sua senha"
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
                  <FormMessage class="absolute right-0 text-xs" />
                </FormItem>
              </FormField>
            </div>
            <Button class="mt-4 w-full h-[48px]" type="submit">
              <LoaderCircle v-if="isLoadingSend" class="w-6 h-6 animate-spin" />
              Criar conta
            </Button>
            <div class="flex items-center justify-center gap-1 text-muted-foreground">
              <small>Já possui uma conta?</small>
              <NuxtLink
                class="text-xs hover:text-zinc-500 hover:underline"
                :href="'/login'"
              >
                Acesse aqui.
              </NuxtLink>
            </div>
          </div>
        </form>
      </div>
    </section>
  </main>
</template>

<style scoped></style>
