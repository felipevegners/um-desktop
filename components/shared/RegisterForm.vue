<script setup lang="ts">
import FormSelect from '@/components/shared/FormSelect.vue';
import { Button } from '@/components/ui/button';
import { useAccountStore } from '@/stores/admin/account.store';
import { toTypedSchema } from '@vee-validate/zod';
import { Eye, LoaderCircle } from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import * as z from 'zod';

const accountStore = useAccountStore();
const { registerUserAccountAction } = accountStore;
const { isLoadingSend } = storeToRefs(accountStore);

definePageMeta({
  title: 'RegisterForm',
});

const formSchema = toTypedSchema(
  z.object({
    userName: z.string().min(2).max(40),
    userEmail: z.string().min(2).max(100).email(),
    userPassword: z.string().min(2).max(8),
    role: z.string().min(2).max(20),
  }),
);

const viewPassword = ref<boolean>(false);

const revealPassword = () => {
  viewPassword.value = !viewPassword.value;
};

const form = useForm({
  validationSchema: formSchema,
});

const onSubmit = form.handleSubmit(async (values) => {
  const accountData = {
    username: values.userName,
    password: values.userPassword,
    email: values.userEmail,
    role: values.role,
  };

  try {
    await registerUserAccountAction(accountData);
  } catch (error) {
    console.log('Error no envio do user -> ', error);
  }
});
</script>
<template>
  <form @submit="onSubmit" @keydown.enter.prevent="true">
    <div class="flex flex-col gap-4 w-[350px]">
      <FormField v-slot="{ componentField }" name="userName">
        <FormItem>
          <FormLabel>Nome de Usuário</FormLabel>
          <FormControl>
            <Input
              type="text"
              placeholder="Insira um nome de usuário"
              v-bind="componentField"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="userEmail">
        <FormItem>
          <FormLabel>E-mail</FormLabel>
          <FormControl>
            <Input
              type="text"
              placeholder="Insira o e-mail"
              v-bind="componentField"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="userPassword">
        <FormItem class="relative">
          <FormLabel>Senha</FormLabel>
          <FormControl class="relative">
            <Input
              v-if="viewPassword"
              type="text"
              placeholder="Insira a senha"
              v-bind="componentField"
            />
            <Input
              v-else
              type="password"
              placeholder="Insira a senha"
              v-bind="componentField"
            />
            <Eye
              class="h-5 w-5 absolute top-8 right-3 cursor-pointer hover:text-zinc-700"
              :class="viewPassword ? 'text-zinc-700' : 'text-zinc-400'"
              @click.prevent="revealPassword"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="role">
        <FormItem>
          <FormLabel>Tipo de Acesso</FormLabel>
          <FormControl>
            <FormSelect
              v-bind="componentField"
              :items="[
                { label: 'Admin', value: 'admin' },
                { label: 'Gestor Master', value: 'master-manager' },
                { label: 'Gestor Filial', value: 'branch-manager' },
                { label: 'Administrador', value: 'platform-admin' },
                { label: 'Usuário', value: 'platform-user' },
              ]"
              :label="'Selecione'"
            />
          </FormControl>
        </FormItem>
      </FormField>
      <Button type="submit">
        <LoaderCircle v-if="isLoadingSend" class="w-6 h-6 animate-spin" />
        Registrar
      </Button>
    </div>
  </form>
</template>

<style scoped></style>
