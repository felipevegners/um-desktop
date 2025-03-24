<script setup lang="ts">
import FormSelect from '@/components/shared/FormSelect.vue';
import { Button } from '@/components/ui/button';
import { useAccountStore } from '@/stores/admin/account.store';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import * as z from 'zod';

const accountStore = useAccountStore();
const { registerUserAccountAction } = accountStore;

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

const form = useForm({
  validationSchema: formSchema,
});

const onSubmit = form.handleSubmit(async (values) => {
  console.log('values -> ', values);
  const accountData = {
    username: values.userEmail,
    name: values.userName,
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
        <FormItem>
          <FormLabel>Senha</FormLabel>
          <FormControl>
            <Input
              type="password"
              placeholder="Insira a senha"
              v-bind="componentField"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="role">
        <FormItem>
          <FormLabel>Nível de Acesso</FormLabel>
          <FormControl>
            <FormSelect
              v-bind="componentField"
              :items="[
                { label: 'Admin', value: 'admin' },
                { label: 'Gestor Master', value: 'masterManager' },
                { label: 'Gestor Filial', value: 'branchManager' },
                { label: 'Administrador', value: 'platformAdmin' },
                { label: 'Usuário', value: 'passenger' },
              ]"
              :label="'Selecione o nível'"
            />
          </FormControl>
        </FormItem>
      </FormField>
      <Button type="submit"> Registrar </Button>
    </div>
  </form>
</template>

<style scoped></style>
