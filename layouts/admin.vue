<script setup lang="ts">
import { ChevronRight, LayoutDashboard, LogOut, User } from 'lucide-vue-next';
import Header from '~/components/shared/Header.vue';
import { generateMenu } from '~/config/menu/generateMenu';

const { data, signOut } = useAuth();
//@ts-ignore
const { user } = data.value;
const menuData = generateMenu(user.role);

// const userNameInitials = computed(() => {
//   const splited = menuData.user.name.split(' ');
//   return splited.map((word: string) => word[0]).join('');
// });
</script>

<template>
  <SidebarProvider>
    <Sidebar collapsible="icon" class="text-white bg-zinc-900 border-none">
      <SidebarHeader class="sidebar">
        <SidebarMenu>
          <SidebarMenuItem>
            <div class="py-2 flex items-start justify-center">
              <img
                class="mt-8 mb-10 h-8 group-data-[collapsible=icon]:hidden"
                src="/images/logo_horizontal_white.svg"
              />
              <img
                class="hidden text-um-primary group-data-[collapsible=icon]:block"
                src="/images/um_symbol_negative.svg"
              />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent class="scrollbar-hidden sidebar">
        <SidebarGroup>
          <SidebarGroupLabel class="mb-4 text-base">
            <User class="mr-2" :size="18" />
            {{ menuData.title }}
          </SidebarGroupLabel>
          <SidebarSeparator class="border-b border-zinc-700" />
          <SidebarMenu>
            <SidebarMenuItem class="my-4">
              <SidebarMenuButton tooltip="Dashboard">
                <component :is="LayoutDashboard" class="text-[#33ffcc]" />
                <a class="text-[#33ffcc] text-base" href="/">Dashboard</a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarSeparator class="mb-4 border-b border-zinc-700" />
            <Collapsible
              v-for="item in menuData.navMain"
              :key="item.title"
              as-child
              :default-open="item.isActive"
              class="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton :tooltip="item.title">
                    <component
                      :is="item.icon"
                      :class="`${item.isActive ? 'text-um-primary' : 'text-white'}`"
                    />
                    <span
                      :class="`${item.isActive ? 'text-um-primary' : 'text-white'}`"
                      class="text-base"
                    >
                      {{ item.title }}
                    </span>
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
                          <!-- @vue-skip -->
                          <component :v-if="subItem.icon" :is="subItem.icon" />
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
        <SidebarSeparator class="border-b border-zinc-700" />
        <SidebarGroup>
          <SidebarGroupLabel class="text-[#33ffcc] text-md">
            Configurações
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in menuData.settings" :key="item.name">
              <SidebarMenuButton as-child>
                <!-- @vue-skip -->
                <NuxtLink
                  :to="item.url"
                  :class="`${item?.active ? 'text-um-primary' : 'text-white'}`"
                >
                  <component :is="item.icon" />
                  <span>{{ item.name }}</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator class="border-b border-zinc-700" />
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              as-child
              @click="signOut"
              class="cursor-pointer hover:text-um-primary"
            >
              <span><LogOut /> Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <!-- <SidebarFooter class="sidebar-footer">
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
                      :src="menuData.user.avatar"
                      :alt="menuData.user.name"
                    />
                    <AvatarFallback class="rounded-lg">
                      {{ userNameInitials }}
                    </AvatarFallback>
                  </Avatar>
                  <div class="grid flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-semibold">{{
                      menuData.user.name
                    }}</span>
                    <span class="truncate text-xs">{{
                      menuData.user.company
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
                    <Avatar class="h-8 w-8 bg-um-primary rounded-lg">
                      <AvatarImage
                        :src="menuData.user.avatar"
                        :alt="menuData.user.name"
                      />
                      <AvatarFallback class="rounded-lg">
                        {{ userNameInitials }}
                      </AvatarFallback>
                    </Avatar>
                    <div class="grid flex-1 text-left text-sm leading-tight">
                      <span class="truncate font-semibold">{{
                        menuData.user.name
                      }}</span>
                      <span class="truncate text-xs">{{
                        menuData.user.email
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
                <DropdownMenuItem
                  class="hover:bg-zinc-500"
                  @click.prevent="signOut"
                >
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter> -->
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
  @apply md:bg-transparent bg-zinc-600 text-white;
}

.sidebar-footer {
  @apply md:bg-transparent bg-zinc-600 text-white;
}
</style>
