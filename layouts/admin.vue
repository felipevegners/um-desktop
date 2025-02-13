<script setup lang="ts">
import { sideMenuData } from "~/config/admin/dashboard-menu";
import Header from "~/components/shared/Header.vue";
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  ChevronsUpDown,
  CreditCard,
  LayoutDashboard,
  Folder,
  Forward,
  LogOut,
  MoreHorizontal,
  Sparkles,
  Trash2
} from "lucide-vue-next";
import { ref, computed } from "vue";

const userNameInitials = computed(() => {
  const splited = sideMenuData.user.name.split(" ");
  return splited.map((word) => word[0]).join("");
});
</script>

<template>
  <SidebarProvider>
    <Sidebar collapsible="icon" class="text-white bg-zinc-900 border-none">
      <SidebarHeader class="sidebar">
        <SidebarMenu>
          <SidebarMenuItem>
            <div class="px-2 py-4 flex items-center">
              <img
                class="my-6 h-9"
                src="/images/logo_horizontal_white.svg"
                alt=""
              />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent class="scrollbar-hidden sidebar">
        <SidebarGroup>
          <SidebarGroupLabel class="mb-2 text-lg"
            >Platforma de Gestão</SidebarGroupLabel
          >
          <SidebarMenu>
            <SidebarMenuItem class="my-4">
              <SidebarMenuButton tooltip="Dashboard">
                <component :is="LayoutDashboard" />
                <a href="/admin">Dashboard</a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarSeparator class="mb-4 border-b border-zinc-800" />
            <Collapsible
              v-for="item in sideMenuData.navMain"
              :key="item.title"
              as-child
              :default-open="item.isActive"
              class="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton :tooltip="item.title">
                    <component :is="item.icon" />
                    <span>{{ item.title }}</span>
                    <ChevronRight
                      class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem
                      v-for="subItem in item.items"
                      :key="subItem.title"
                      class="hover:bg-zinc-800"
                    >
                      <SidebarMenuSubButton as-child>
                        <NuxtLink :href="subItem.url">
                          <span>{{ subItem.title }}</span>
                        </NuxtLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator class="border-b border-zinc-800" />
        <SidebarGroup class="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Configurações</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem
              v-for="item in sideMenuData.settings"
              :key="item.name"
            >
              <SidebarMenuButton as-child>
                <a :href="item.url">
                  <component :is="item.icon" />
                  <span>{{ item.name }}</span>
                </a>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <SidebarMenuAction show-on-hover>
                    <MoreHorizontal />
                    <span class="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  class="w-48 rounded-lg"
                  side="bottom"
                  align="end"
                >
                  <DropdownMenuItem>
                    <Folder class="text-muted-foreground" />
                    <span>View Project</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Forward class="text-muted-foreground" />
                    <span>Share Project</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Trash2 class="text-muted-foreground" />
                    <span>Delete Project</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton class="text-sidebar-foreground/70">
                <MoreHorizontal class="text-sidebar-foreground/70" />
                <span>More</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter class="bg-zinc-800 sidebar-footer">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <SidebarMenuButton
                  size="lg"
                  class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar class="h-8 w-8 rounded-lg bg-um-primary">
                    <AvatarImage
                      :src="sideMenuData.user.avatar"
                      :alt="sideMenuData.user.name"
                    />
                    <AvatarFallback class="rounded-lg">
                      {{ userNameInitials }}
                    </AvatarFallback>
                  </Avatar>
                  <div class="grid flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-semibold">{{
                      sideMenuData.user.name
                    }}</span>
                    <span class="truncate text-xs">{{
                      sideMenuData.user.company
                    }}</span>
                  </div>
                  <ChevronsUpDown class="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                :side-offset="4"
              >
                <DropdownMenuLabel class="p-0 font-normal">
                  <div
                    class="flex items-center gap-2 px-1 py-1.5 text-left text-sm"
                  >
                    <Avatar class="h-8 w-8 rounded-lg">
                      <AvatarImage
                        :src="sideMenuData.user.avatar"
                        :alt="sideMenuData.user.name"
                      />
                      <AvatarFallback class="rounded-lg">
                        {{ userNameInitials }}
                      </AvatarFallback>
                    </Avatar>
                    <div class="grid flex-1 text-left text-sm leading-tight">
                      <span class="truncate font-semibold">{{
                        sideMenuData.user.name
                      }}</span>
                      <span class="truncate text-xs">{{
                        sideMenuData.user.email
                      }}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Sparkles />
                    Upgrade to Pro
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <BadgeCheck />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
    <SidebarInset>
      <Header />
      <slot />
    </SidebarInset>
  </SidebarProvider>
</template>

<style scoped>
.sidebar {
  @apply md:bg-transparent bg-zinc-900 text-white;
}
.sidebar-footer {
  @apply md:bg-transparent bg-zinc-800 text-white;
}
</style>
