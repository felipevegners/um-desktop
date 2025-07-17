<script setup lang="ts">
import { CircleUser, LogOut } from 'lucide-vue-next';

import Notification from './Notification.vue';
import ThemeSelector from './ThemeSelector.vue';

const { data, signOut, status } = useAuth();
const route = useRoute();
</script>
<template>
  <header
    class="flex h-16 shrink-0 items-center justify-between transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
  >
    <div class="flex items-center gap-2 px-4">
      <SidebarTrigger class="-ml-1" />
      <Separator orientation="vertical" class="mr-2 h-4" />
      <!-- <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem class="hidden md:block">
            <BreadcrumbLink> <NuxtLink to="/">Dashboards</NuxtLink> </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator class="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>{{ route.fullPath }}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb> -->
    </div>
    <div class="flex items-center justify-between gap-6">
      <!-- <Notification /> -->
      <!-- <ThemeSelector /> -->
      <!-- @vue-skip -->
      <div class="flex items-center gap-6">
        <h3 class="text-md flex items-center gap-2" v-if="data">
          <CircleUser />
          <span class="font-bold">{{ data?.user?.name }} </span>
        </h3>
        <h3 class="text-md" v-else>Sua sessão expirou, faça novamente o login.</h3>
        <Button class="mr-4" variant="outline" @click="signOut">
          <LogOut class="w-5 h-5" />
          Sair
        </Button>
      </div>
    </div>
  </header>
</template>

<style scoped></style>
