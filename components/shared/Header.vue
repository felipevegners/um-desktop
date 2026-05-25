<script setup lang="ts">
import { CircleUser, LogOut } from 'lucide-vue-next';
import { rolesTypes } from '~/config/roles';

import Notification from './Notification.vue';

const { data, signOut, status } = useAuth();
const route = useRoute();

const getUserRole = computed(() => {
  //@ts-ignore
  return rolesTypes[data?.value?.user?.role];
});
</script>
<template>
  <header
    class="mb-6 flex h-20 shrink-0 items-center justify-between transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 px-2"
  >
    <div class="flex items-center gap-2 px-2">
      <SidebarTrigger class="-ml-1" />
      <Separator orientation="vertical" class="mr-2 h-4" />
    </div>
    <div class="flex items-center justify-between md:justify-end gap-6 min-w-0 w-full">
      <div class="flex items-center gap-2 sm:gap-3 min-w-0">
        <div
          v-if="status === 'authenticated'"
          class="flex items-center gap-2 min-w-0 max-w-[52vw] sm:max-w-none"
        >
          <CircleUser class="h-6 w-6 shrink-0 sm:h-7 sm:w-7" />
          <div class="flex flex-col min-w-0">
            <h3 class="mb-0 truncate text-sm font-bold leading-tight sm:text-base">
              {{ data?.user?.name }}
            </h3>
            <small class="truncate text-[11px] text-muted-foreground sm:text-xs">{{
              getUserRole
            }}</small>
          </div>
        </div>
        <h3 class="text-sm" v-if="status !== 'authenticated'">
          Sua sessão expirou, faça novamente o login.
        </h3>
      </div>
      <Notification />
      <Button variant="outline" @click="signOut">
        <LogOut class="w-5 h-5" />
        <span class="hidden sm:inline">Logout</span>
      </Button>
    </div>
  </header>
</template>

<style scoped></style>
