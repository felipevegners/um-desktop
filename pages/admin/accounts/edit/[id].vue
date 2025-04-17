<script setup lang="ts">
import BackLink from '@/components/shared/BackLink.vue';
import RegisterForm from '@/components/shared/RegisterForm.vue';
import { useToast } from '@/components/ui/toast';
import { useAccountStore } from '@/stores/admin/account.store';
import { Trash, UserPen } from 'lucide-vue-next';

const accountStore = useAccountStore();
const {
  getUsersAccountsAction,
  deleteUserAccountAction,
  getUsersAccountsByIdAction,
} = accountStore;
const { isLoading, account } = storeToRefs(accountStore);

const route = useRoute();
const { toast } = useToast();
const { data } = useAuth();
//@ts-ignore
const { user } = data.value;

const accountSituation = ref<boolean>(false);
const loadingDelete = ref<boolean>(false);

definePageMeta({
  layout: 'admin',
});

defineOptions({
  name: 'Backoffice - Editar Conta de Usuário | Urban Mobi',
});

onBeforeMount(async () => {
  await getUsersAccountsByIdAction(route.params.id as string);
});

accountSituation.value = account?.value?.enabled;

const deleteUserAccount = async () => {
  loadingDelete.value = true;
  try {
    await deleteUserAccountAction(route.params.id as string);
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao remover a conta de usuário. Tente novamente.`,
    });
    throw error;
  } finally {
    loadingDelete.value = false;
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Conta de Usuário removida com sucesso!`,
    });
    await getUsersAccountsAction();
  }
};
</script>
<template>
  <main>
    <header>
      <BackLink />
    </header>
    <section class="px-6 mb-10 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-3xl font-bold">
        <UserPen :size="32" />
        Editar Conta de Usuário
      </h1>
      <div class="flex gap-10 items-center">
        <div>
          <Label class="text-md font-bold"> Desativar Usuário </Label>
          <div class="mt-2 flex items-center gap-3">
            <Label class="text-sm text-zinc-500"> Inativo </Label>
            <Switch
              v-model:checked="accountSituation"
              class="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
            />
            <Label class="text-sm text-zinc-500"> Ativo </Label>
          </div>
        </div>
        <Button
          v-if="user.role === 'admin'"
          variant="destructive"
          @click="deleteUserAccount"
        >
          <Trash class="w-4 h-4" /> Excluir Usuário
        </Button>
      </div>
    </section>
    <section class="p-6">
      <RegisterForm
        :editMode="true"
        :values="account"
        :situation="accountSituation"
      />
    </section>
  </main>
</template>

<style scoped></style>
