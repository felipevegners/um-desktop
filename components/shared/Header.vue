<script setup lang="ts">
import { CircleUser, LogOut } from 'lucide-vue-next';
import { rolesTypes } from '~/config/roles';

const { data, signOut, status } = useAuth();
const route = useRoute();

const getUserRole = computed(() => {
  //@ts-ignore
  return rolesTypes[data?.value?.user?.role];
});
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
        <div v-if="status === 'authenticated'" class="flex items-center gap-2">
          <CircleUser :size="30" />
          <div class="flex flex-col">
            <h3 class="text-md font-bold mb-0">
              {{ data?.user?.name }}
            </h3>
            <small class="text-muted-foreground text-xs">{{ getUserRole }}</small>
          </div>
        </div>
        <h3 class="text-md" v-else>Sua sessão expirou, faça novamente o login.</h3>
        <Button class="mr-4" variant="outline" @click="signOut">
          <LogOut class="w-5 h-5" />
          Logout
        </Button>
      </div>
    </div>
  </header>
</template>

<style scoped></style>
