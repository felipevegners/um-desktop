<script setup lang="ts">
import { rolesTypes } from '@/config/roles';
import {
  Info,
  LoaderCircle,
  UserCog,
  UserPen,
  UserPlus,
  WandSparkles,
  X,
} from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { generatePassword } from '~/lib/utils';

import FormSelect from './FormSelect.vue';

defineOptions({
  name: 'ChangeMasterManager',
});

const props = defineProps<{
  editMode?: boolean;
  managerData?: any;
  form?: any;
  loading?: boolean;
  usersList?: any;
}>();
const route = useRoute();
const { data } = useAuth();
//@ts-ignore
const role = data.value?.user?.role;

const showNewManagerSelect = ref<boolean>(false);
const managerUsersList = ref<any>([]);
const managerRoles = ['master-manager', 'branch-manager'];

const generateManagerList = () => {
  const findContractUsers = props.usersList.filter((account: any) =>
    managerRoles.includes(account.role),
  );
  managerUsersList.value = findContractUsers.map((user: any) => {
    return {
      label: `${user.username} - ${rolesTypes[user.role]}`,
      value: user.id,
    };
  });
};

const handleChangeManager = () => {
  generateManagerList();
  showNewManagerSelect.value = true;
};

const handleCancelChangeManager = () => {
  props.form.setValues({
    branchManagerName: props.managerData.manager?.username,
    branchManagerPhone: props.managerData.manager?.phone,
    branchManagerPosition: props.managerData.manager?.position,
    branchManagerDepartment: props.managerData.manager?.department,
  });
  showNewManagerSelect.value = false;
};

const handleGeneratePassword = () => {
  const randomPassword = generatePassword();
  if (randomPassword.length) {
    props.form.setValues({
      password: randomPassword,
    });
  }
};

const generateEditAccountUrl = computed(() => {
  let url = '';
  switch (true) {
    case role === 'master-manager' || role === 'branch-manager':
      url = 'corporative-accounts-edit-id';
      break;
    case role === 'admin':
      url = 'admin-accounts-edit-id';
      break;
    default:
      url = 'admin-accounts-edit-id';
  }

  return url;
});

const targetAccountPath = computed(() => {
  const parentBase = route.path.split('/')[1]; // e.g., 'corporative'
  return `/${parentBase}/accounts/new`;
});
</script>
<template>
  <section v-if="loading">
    <LoaderCircle class="animate-spin" :size="40" />
  </section>
  <section v-else>
    <div class="mb-4 flex flex-row items-center gap-3">
      <Button
        v-if="managerData !== null && !showNewManagerSelect"
        type="button"
        variant="destructive"
        class="my-4"
        @click="handleChangeManager"
      >
        <UserPen />
        Alterar Gestor
      </Button>
    </div>
    <div class="col-span-4 p-6 border border-zinc-900 rounded-md">
      <!-- se não tiver gestor atribuido -->
      <div
        v-if="managerData === null || showNewManagerSelect"
        class="flex flex-col items-start gap-6"
      >
        <div
          v-if="!showNewManagerSelect"
          class="p-2 flex items-center gap-3 bg-red-200 rounded-md border border-red-500"
        >
          <InfoIcon class="text-red-500" />
          <small class="text-red-500">
            Esta filial ainda não possui um
            <span class="font-bold">Gestor de Filial</span> atribuído. Selecione um
            usuário com perfil Gestor de Filial na lista abaixo ou adicione um novo
            usuário.
          </small>
        </div>

        <!-- Seletor de Gestor -->
        <div class="grid grid-cols-4 gap-6 w-full">
          <FormField v-slot="{ componentField }" name="managerId">
            <FormItem class="col-span-1">
              <FormLabel class="font-bold">Selecionar Gestor da Filial</FormLabel>
              <FormDescription class="text-xs">
                *Caso o usuário não esteja listado, adicione um novo.
              </FormDescription>
              <FormControl>
                <FormSelect
                  v-bind="componentField"
                  :items="managerUsersList"
                  label="Selecione"
                />
              </FormControl>
            </FormItem>
          </FormField>
          <div class="flex items-end gap-4">
            <Button
              type="button"
              @click.prevent="
                () =>
                  navigateTo(targetAccountPath, {
                    open: {
                      target: '_blank',
                    },
                  })
              "
            >
              <UserPlus />
              Adicionar novo usuário
            </Button>
            <Button
              v-if="showNewManagerSelect"
              type="button"
              variant="ghost"
              @click.prevent="handleCancelChangeManager"
            >
              <X />
              Cancelar
            </Button>
          </div>
        </div>
        <!-- -- -->
      </div>

      <div
        v-if="!showNewManagerSelect && managerData !== null"
        class="mb-4 grid grid-cols-4 gap-6"
      >
        <FormField v-slot="{ componentField }" name="managerName">
          <FormItem>
            <FormLabel>Nome</FormLabel>
            <FormControl>
              <Input type="text" v-bind="componentField" :disabled="editMode" />
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="managerPhone">
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
        <FormField v-slot="{ componentField }" name="managerPosition">
          <FormItem>
            <FormLabel>Cargo</FormLabel>
            <FormControl>
              <Input type="text" v-bind="componentField" :disabled="editMode" />
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="managerDepartment">
          <FormItem>
            <FormLabel>Departamento</FormLabel>
            <FormControl>
              <Input type="text" v-bind="componentField" :disabled="editMode" />
            </FormControl>
          </FormItem>
        </FormField>
        <div v-if="!editMode" class="col-span-3">
          <p class="flex gap-1 items-center text-muted-foreground text-sm">
            <Info :size="14" />
            O Gestor da Filial usará os dados abaixo para acessar a plataforma
          </p>
          <div class="mt-6 grid grid-cols-3 gap-6 items-end">
            <FormField v-slot="{ componentField }" name="managerEmail">
              <FormItem class="relative">
                <FormLabel>E-mail de Acesso</FormLabel>
                <FormControl>
                  <Input type="email" v-bind="componentField" />
                </FormControl>
              </FormItem>
            </FormField>
            <FormField v-slot="{ componentField }" name="password">
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input type="text" v-bind="componentField" maxlength="8" />
                </FormControl>
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
      <Button
        v-if="editMode && managerData !== null && !showNewManagerSelect"
        type="button"
        class="my-4"
        @click="
          navigateTo(
            {
              name: generateEditAccountUrl,
              params: { id: managerData.id },
            },
            { open: { target: '_blank' } },
          )
        "
      >
        <UserCog />
        Editar Dados do Gestor
      </Button>
    </div>
  </section>
</template>

<style scoped></style>
