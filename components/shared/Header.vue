<script setup lang="ts">
import { LogOut } from 'lucide-vue-next';

import Notification from './Notification.vue';
import ThemeSelector from './ThemeSelector.vue';

const { data, signOut } = useAuth();
//@ts-ignore
const { user } = data.value;
</script>
<template>
  <header
    class="flex h-16 shrink-0 items-center justify-between transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
  >
    <div class="flex items-center gap-2 px-4">
      <SidebarTrigger class="-ml-1" />
      <Separator orientation="vertical" class="mr-2 h-4" />
      <!-- @vue-skip -->
      <h3 class="text-md">
        Olá, <span class="font-bold">{{ user.username }}</span>
      </h3>
      <!-- <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem class="hidden md:block">
            <BreadcrumbLink href="#"> Plataforma de Gestão </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator class="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb> -->
    </div>
    <div class="flex items-center justify-between">
      <Notification />
      <!-- <ThemeSelector /> -->
      <Button class="mr-4" variant="ghost" @click="signOut">
        <LogOut class="w-5 h-5" />
        Logout</Button
      >
    </div>
  </header>
</template>

<style scoped></style>
