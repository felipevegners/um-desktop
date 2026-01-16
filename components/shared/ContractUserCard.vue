<script setup lang="ts">
import { rolesTypes, userRestrictions } from '@/config/roles';
import { Edit } from 'lucide-vue-next';
import { dateFormat } from '~/lib/utils';

const { data } = useAuth();

export type Account = {
  id: string;
  username: string;
  email?: string;
  role?: string;
  status?: string;
  enabled?: boolean;
  createdAt?: string;
  avatar?: {
    url: string;
    name: string;
  };
  contract: {
    restrictions?: Array<string>;
    branchId: string;
  };
};
const props = defineProps<{
  account: Account;
  branches: any;
}>();

const userNameInitials = (name: string) => {
  const splited = name.split(' ').splice(0, 2);
  return splited.map((word: string) => word[0]).join('');
};

const findUserBranchNameAndCode = (branchId: string) => {
  const branch = props.branches.find((branch: any) => branch.id === branchId);
  return branch ? `${branch.branchCode} - ${branch.fantasyName}` : 'Todas as filiais';
};

const toggleRestriction = (account: Account, restrictionId: string) => {
  if (!account.contract.restrictions) {
    account.contract.restrictions = [];
  }
  const idx = account.contract.restrictions.indexOf(restrictionId);
  if (idx === -1) {
    account.contract.restrictions.push(restrictionId);
  } else {
    account.contract.restrictions.splice(idx, 1);
  }
};
</script>
<template>
  <li class="flex flex-col items-start flex-1" :key="account?.id">
    <Card class="md:min-w-[250px] w-full">
      <div class="p-2 flex flex-row items-center justify-end gap-4">
        <span
          v-if="data?.user?.name === account?.username"
          class="py-0.5 px-1.5 rounded-md bg-blue-600 text-white text-xs"
        >
          Sua conta
        </span>
        <!-- v-if="
            account.role === 'master-manager' ||
            account.role === 'branch-manager' ||
            account.role === 'branch-manager' ||
            account.role === 'admin'
          " -->
        <Button
          title="Editar usuário"
          variant="ghost"
          size="icon"
          @click.prevent="
            navigateTo({
              name: 'corporative-accounts-edit-id',
              params: {
                id: account?.id,
              },
            })
          "
          class="hover:bg-zinc-950 hover:text-white rounded-lg"
        >
          <Edit />
        </Button>
      </div>
      <CardHeader class="flex items-center">
        <Avatar class="h-20 w-20 mb-6 border-4 border-zinc-950">
          <AvatarImage :src="account?.avatar?.url || ''" />
          <AvatarFallback class="text-3xl font-medium text-muted-foreground/30">
            {{ userNameInitials(account?.username as string) }}
          </AvatarFallback>
        </Avatar>
        <div class="flex flex-col items-center">
          <h2 class="font-bold text-xl">{{ account?.username }}</h2>
          <small class="text-muted-foreground">
            {{ account?.email }}
          </small>
          <small class="my-4 py-0.5 px-2 bg-zinc-950 rounded-md text-white">
            {{ rolesTypes[account?.role as string] }}
          </small>
          <p class="font-bold">
            {{ findUserBranchNameAndCode(account?.contract?.branchId) }}
          </p>
        </div>
      </CardHeader>
      <CardContent class="flex flex-col justify-start gap-6">
        <div class="grid grid-cols-3 gap-4">
          <div class="flex flex-col items-center p-1 border border-zinc-900 rounded-md">
            <small class="text-[10px] text-muted-foreground uppercase">
              Cadastrado
            </small>
            <span class="font-bold text-xs">
              {{ dateFormat(account?.createdAt) }}
            </span>
          </div>
          <div class="flex flex-col items-center p-1 border border-zinc-900 rounded-md">
            <span class="text-[10px] text-muted-foreground uppercase"> Status </span>
            <span class="font-bold text-sm">
              {{ account?.status === 'pending' ? 'Pendente' : 'Validado' }}
            </span>
          </div>
          <div class="flex flex-col items-center p-1 border border-zinc-900 rounded-md">
            <span class="text-[10px] text-muted-foreground uppercase"> Ativo </span>
            <span
              class="font-bold text-sm"
              :class="account?.enabled ? 'text-green-600' : 'text-red-600'"
            >
              {{ account?.enabled ? 'Sim' : 'Não' }}
            </span>
          </div>
        </div>
        <Separator />
        <h3 class="font-bold text-lg">Restrições de Atendimento</h3>
        <ul class="space-y-3">
          <li
            v-for="restriction in userRestrictions"
            :key="restriction.id"
            class="flex items-center gap-2"
          >
            <Checkbox
              :checked="account?.contract.restrictions?.includes(restriction.id)"
              @update:checked="toggleRestriction(account, restriction.id)"
            />
            <label :for="restriction.id">{{ restriction.label }}</label>
          </li>
        </ul>
      </CardContent>
    </Card>
  </li>
</template>

<style scoped></style>
