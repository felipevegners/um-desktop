<script setup lang="ts">
import { Info, User, WandSparkles } from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { storeToRefs } from 'pinia';
import { generatePassword } from '~/lib/utils';
import { useContractsStore } from '~/stores/contracts.store';

const store = useContractsStore();
const { contractId } = storeToRefs(store);

definePageMeta({
  name: 'MasterManagerForm',
});

const props = defineProps<{
  editMode?: boolean;
  editId?: string;
  form?: any;
}>();

const handleGeneratePassword = () => {
  const randomPassword = generatePassword();
  if (randomPassword.length) {
    props.form.setValues({
      password: randomPassword,
    });
  }
};
</script>
<template v-if="currentStep === 1">
  <section class="px-6">
    <div class="mb-4 grid grid-cols-4 gap-6">
      <FormField v-slot="{ componentField }" name="managerName">
        <FormItem>
          <FormLabel>Nome</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" :disabled="editMode" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="managerEmail">
        <FormItem>
          <FormLabel>E-mail</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" :disabled="editMode" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="managerCellPhone">
        <FormItem>
          <FormLabel>Celular</FormLabel>
          <FormControl>
            <Input
              type="text"
              v-bind="componentField"
              v-maska="'(##) #####-####'"
              :disabled="editMode"
            />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="position">
        <FormItem>
          <FormLabel>Cargo</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" :disabled="editMode" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="department">
        <FormItem>
          <FormLabel>Departamento</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" :disabled="editMode" />
          </FormControl>
        </FormItem>
      </FormField>
      <div class="col-span-4 p-6 border border-zinc-900 rounded-md">
        <p class="font-bold">Dados de Acesso</p>
        <div v-if="editMode">
          <p class="text-muted-foreground text-sm">
            Para editar os dados de acesso (Nome, Email e Senha) do Gestor Master clique
            no botão abaixo
          </p>
          <Button
            type="button"
            class="my-4"
            @click="
              navigateTo(
                {
                  name: 'admin-accounts-edit-id',
                  params: { id: editId },
                },
                { open: { target: '_blank' } },
              )
            "
          >
            <User />
            Editar Conta de Usuário
          </Button>
        </div>
        <div v-else>
          <p class="flex items-center gap-1 text-muted-foreground text-sm">
            <Info :size="14" />
            O Gestor Master usará os dados abaixo para acessar a plataforma
          </p>
          <div class="mt-6 grid grid-cols-3 gap-6 items-end">
            <FormField v-slot="{ componentField }" name="managerEmail">
              <FormItem class="relative">
                <FormLabel>E-mail de Acesso</FormLabel>
                <FormControl>
                  <Input type="email" v-bind="componentField" />
                </FormControl>
                <FormMessage
                  class="p-2 absolute w-full bg-red-500 text-white text-sm rounded-md"
                />
              </FormItem>
            </FormField>
            <FormField v-slot="{ componentField }" name="password">
              <FormItem>
                <FormLabel>Senha Temporária</FormLabel>
                <FormControl>
                  <Input type="text" v-bind="componentField" maxlength="8" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
            <Button
              class="mb-1 px-2 max-w-[140px]"
              @click.prevent="handleGeneratePassword"
            >
              <WandSparkles class="w-6 h-6" />
              Gerar Senha
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped></style>
