<script setup lang="ts">
import { SharedBackLink } from '#components';
import AddressForm from '@/components/forms/AddressForm.vue';
import FormButtons from '@/components/forms/FormButtons.vue';
// import AvatarEdit from '@/components/shared/AvatarEdit.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { useAccountStore } from '@/stores/account.store';
import { toTypedSchema } from '@vee-validate/zod';
import {
  CircleAlert,
  Eye,
  EyeOff,
  History,
  Info,
  LoaderCircle,
  Lock,
  UserCog,
  X,
} from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import * as z from 'zod';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

useHead({
  title: `Minha Conta - Usuário UM | Urban Mobi`,
});

const { toast } = useToast();
const { data } = useAuth();
//@ts-ignore

const accountsStore = useAccountStore();
const { getUsersAccountsByIdAction, updateUserAccountAction } = accountsStore;
const { account, isLoading, isLoadingSend } = storeToRefs(accountsStore);

const hasPendingActions = ref<boolean>();
const viewPassword = ref<boolean>(false);
const changePassword = ref<boolean>(false);

const revealPassword = () => {
  viewPassword.value = !viewPassword.value;
};
//@ts-ignore
await getUsersAccountsByIdAction(data?.value?.user?.id as string);

const userAccountSchema = toTypedSchema(
  z.object({
    username: z.string({ message: 'Obrigatório!' }).min(2).max(50),
    email: z.string({ message: 'Obrigatório!' }).min(2).max(50),
    phone: z.string({ message: 'Obrigatório!' }).min(2).max(50),
    document: z.string({ message: 'Obrigatório!' }).min(2).max(14),
    birthDate: z.any().optional(),
    zipcode: z.string({ message: 'Obrigatório!' }).min(2).max(50),
    streetName: z.string({ message: 'Obrigatório!' }).min(2).max(50),
    streetNumber: z.string({ message: 'Obrigatório!' }).min(2).max(50),
    complement: z.string().min(0).max(50).optional(),
    neighborhood: z.string({ message: 'Obrigatório!' }).min(2).max(50),
    city: z.string({ message: 'Obrigatório!' }).min(2).max(50),
    state: z.string({ message: 'Obrigatório!' }).min(2).max(50),
    position: z.any().optional(),
    department: z.any().optional(),
    status: z.string().optional(),
    oldPassword: z
      .string({ message: 'A senha deve conter de 6 a 8 caracteres' })
      .min(6, { message: 'Mínimo 6 caracteres' })
      .max(8, { message: 'Máximo 8 caracteres' })
      .optional(),
    newPassword: z
      .string({ message: 'A senha deve conter de 6 a 8 caracteres' })
      .min(6, { message: 'Mínimo 6 caracteres' })
      .max(8, { message: 'Máximo 8 caracteres' })
      .optional(),
  }),
);

const usersForm = useForm({
  validationSchema: userAccountSchema,
  initialValues: {
    ...account?.value,
    birthDate: account?.value.birthDate,
    zipcode: account?.value.address?.zipcode,
    streetName: account?.value.address?.streetName,
    streetNumber: account?.value.address?.streetNumber,
    complement: account?.value.address?.complement,
    neighborhood: account?.value.address?.neighborhood,
    city: account?.value.address?.city,
    state: account?.value.address?.state,
    position: account?.value.position,
    department: account?.value.department,
  },
});

onMounted(async () => {
  const validateForm = await usersForm.validate();
  hasPendingActions.value = !validateForm.valid;
});

const isCorpAccount = computed(() => {
  const corpRoles = [
    'master-manager',
    'branch-manager',
    'platform-admin',
    'platform-corp-user',
  ];
  //@ts-ignore
  const { role } = data?.value?.user;
  return corpRoles.includes(role);
});

const onSubmit = usersForm.handleSubmit(async (values) => {
  const userAccountData = {
    ...values,
    ...account.value,
    accountId: account?.value.id as string,
    address: {
      zipcode: values.zipcode,
      streetName: values.streetName,
      streetNumber: values.streetNumber,
      complement: values.complement,
      neighborhood: values.neighborhood,
      city: values.city,
      state: values.state,
    },
    password: values.newPassword ? values.newPassword : '',
    birthDate: values.birthDate,
    status: 'validated',
    position: isCorpAccount ? values.position : '-',
    department: isCorpAccount ? values.department : '-',
  };

  if (values.newPassword && values.oldPassword === values.newPassword) {
    usersForm.setFieldError(
      'newPassword',
      'As senhas são iguais, verifique e tente novamente!',
    );
    toast({
      title: 'Oops!',
      description: `A senha atual é igual a nova senha. Verifique e tente novamente!`,
      variant: 'destructive',
    });
  } else {
    try {
      //@ts-ignore
      await updateUserAccountAction(userAccountData);
    } catch (error) {
      toast({
        title: 'Oops!',
        description: `Ocorreu um erro ao editar seus dados. Tente novamente!`,
        variant: 'destructive',
      });
    } finally {
      toast({
        title: 'Sucesso!',
        class: 'bg-green-600 border-0 text-white text-2xl',
        description: `Seus dados foram atualizados!`,
      });
      setTimeout(() => {
        navigateTo('/personal');
      }, 2000);
    }
  }
});
</script>

<template>
  <header>
    <div class="flex items-center">
      <SharedBackLink />
    </div>
  </header>
  <main class="px-6">
    <section
      v-if="isLoading"
      class="p-10 h-40 flex items-center justify-center bg-zinc-200 rounded-md"
    >
      <LoaderCircle :size="48" class="animate-spin" />
    </section>
    <section v-else class="py-4">
      <h1 class="mb-6 flex items-center gap-2 text-2xl font-bold">
        <UserCog :size="24" />
        Minha Conta UM
      </h1>
      <section
        v-if="hasPendingActions"
        class="my-10 p-6 rounded-md border border-zinc-900 bg-amber-300"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-base flex items-center gap-2">
            <CircleAlert />
            Seu cadastro está pendente de informações. Atualize seus dados para utilizar
            os serviços UM.
          </h2>
          <X @click="hasPendingActions = false" class="cursor-pointer" />
        </div>
      </section>
      <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
        <Card class="bg-zinc-200">
          <CardContent class="space-y-20">
            <section>
              <h2 class="my-6 text-lg font-bold">Dados Pessoais</h2>
              <div class="mb-4 w-full grid grid-cols-3 gap-8">
                <FormField v-slot="{ componentField }" name="username">
                  <FormItem class="col-span-2">
                    <FormLabel>Nome Completo*</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="email">
                  <FormItem>
                    <FormLabel>E-mail*</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="phone">
                  <FormItem>
                    <FormLabel>Celular</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        v-bind="componentField"
                        v-maska="'(##) # ####-####'"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="document">
                  <FormItem class="col-span-1">
                    <FormLabel>CPF*</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        v-bind="componentField"
                        v-maska="'###.###.###-##'"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="birthDate">
                  <FormItem class="col-span-1">
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" v-maska="'##/##/####'" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  {{ usersForm.values.birthDate }}
                </FormField>
              </div>
            </section>
            <section v-if="isCorpAccount">
              <h2 class="mb-6 text-lg font-bold">Dados Corporavitos</h2>
              <div class="mb-4 w-full grid grid-cols-3 gap-8">
                <FormField v-slot="{ componentField }" name="position">
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="department">
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>
            </section>
            <section>
              <h2 class="mb-6 text-lg font-bold">Meu Endereço</h2>
              <AddressForm :edit-mode="false" :form="usersForm" />
            </section>
            <section class="my-10">
              <h2 class="my-6 font-bold text-xl flex items-center gap-2">
                <History />
                Meu Histórico de Atendimentos
              </h2>
              <div class="mb-6 p-6 flex items-center justify-center rounded-md bg-white">
                <p class="text-zinc-400">Nenhum histórico encontrado</p>
              </div>
            </section>
            <section class="my-10">
              <h2 class="my-6 font-bold text-xl flex items-center gap-2">
                <Lock />
                Dados de Acesso
              </h2>
              <div
                v-if="!changePassword"
                class="mb-6 p-6 flex flex-col gap-6 max-w-[400px] rounded-md border border-zinc-900"
              >
                <Button type="button" @click.prevent="changePassword = true">
                  Quero alterar minha senha
                </Button>
              </div>
              <div
                v-else
                class="mb-6 p-6 flex flex-col gap-6 max-w-md rounded-md bg-white border border-zinc-900"
              >
                <div
                  class="pb-4 border-b border-zinc-300 flex items-center justify-between"
                >
                  <span class="font-bold">Alterar senha</span>
                  <X
                    class="cursor-pointer text-muted-foreground hover:text-accent-foreground"
                    @click.prevent="changePassword = false"
                  />
                </div>
                <FormField v-slot="{ componentField }" name="oldPassword">
                  <FormItem class="relative">
                    <FormLabel>Senha Atual*</FormLabel>
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
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="newPassword">
                  <FormItem class="relative">
                    <FormLabel>Nova Senha*</FormLabel>
                    <FormControl>
                      <div v-if="viewPassword" class="relative">
                        <Input
                          type="text"
                          placeholder="Insira a sua senha atual"
                          v-bind="componentField"
                          :disabled="isLoadingSend"
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
                          placeholder="Insira a sua nova senha"
                          v-bind="componentField"
                          :disabled="isLoadingSend"
                        />
                        <Eye
                          class="h-5 w-5 absolute top-[10px] right-3 cursor-pointer hover:text-zinc-700"
                          :class="viewPassword ? 'text-zinc-700' : 'text-zinc-400'"
                          @click.prevent="revealPassword"
                        />
                      </div>
                    </FormControl>
                    <small class="text-xs text-muted-foreground flex items-center gap-2">
                      <Info :size="14" />
                      A senha deve conter de 6 a 8 caracteres
                    </small>
                  </FormItem>
                  <FormMessage />
                </FormField>
              </div>
            </section>
          </CardContent>
        </Card>
        <FormButtons
          :cancel="'/personal'"
          :loading="isLoadingSend"
          sbm-label="Salvar Meus Dados"
          cnc-label="Cancelar"
        />
      </form>
    </section>
  </main>
</template>

<style scoped></style>
