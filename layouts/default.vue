<script setup lang="ts">
import {
  AudioWaveform,
  BadgeCheck,
  Bell,
  BookOpen,
  Bot,
  Building2,
  CalendarDays,
  Car,
  ChevronRight,
  ChevronsUpDown,
  Coins,
  Command,
  CreditCard,
  LayoutDashboard,
  Folder,
  Forward,
  Frame,
  GalleryVerticalEnd,
  HandCoins,
  LogOut,
  Map,
  MoreHorizontal,
  PieChart,
  Plus,
  Settings2,
  Sparkles,
  SquarePercent,
  SquareTerminal,
  SquareUserRound,
  Trash2,
  UserPen,
} from "lucide-vue-next";
import { ref } from "vue";
import Header from "~/components/shared/header.vue";

// This is sample data.
const data = {
  user: {
    name: "Felipe Vegners",
    company: "Urban Mobi",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Urban Mobi",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Clientes",
      url: "#",
      icon: Building2,
      isActive: false,
      items: [
        {
          title: "Ativos",
          url: "/admin/customers/active",
        },
        {
          title: "Pendentes",
          url: "#",
        },
        {
          title: "Inativos",
          url: "#",
        },
      ],
    },
    {
      title: "Motoristas",
      url: "#",
      icon: Car,
      items: [
        {
          title: "Ativos",
          url: "#",
        },
        {
          title: "Pendentes",
          url: "#",
        },
        {
          title: "Inativos",
          url: "#",
        },
        {
          title: "Parceiros",
          url: "#",
        },
      ],
    },
    {
      title: "Agendamentos",
      url: "#",
      icon: CalendarDays,
      items: [
        {
          title: "Abertos",
          url: "#",
        },
        {
          title: "Realizados",
          url: "#",
        },
        {
          title: "Cancelados",
          url: "#",
        },
        {
          title: "+ Novo agendamento",
          url: "#",
        },
      ],
    },
    {
      title: "Financeiro",
      url: "#",
      icon: HandCoins,
      items: [
        {
          title: "Faturas em aberto",
          url: "#",
        },
        {
          title: "Balanço",
          url: "#",
        },
        {
          title: "Canceladas",
          url: "#",
        },
        {
          title: "Pagamento Motoristas",
          url: "#",
        },
      ],
    },
  ],
  settings: [
    {
      name: "Tarifas",
      url: "#",
      icon: Coins,
    },
    {
      name: "Repasse Motorista",
      url: "#",
      icon: SquarePercent,
    },
    {
      name: "Usuários",
      url: "#",
      icon: UserPen,
    },
  ],
};

const activeTeam = ref(data.teams[0]);

function setActiveTeam(team: (typeof data.teams)[number]) {
  activeTeam.value = team;
}
</script>

<template>
  <SidebarProvider>
    <Sidebar collapsible="icon" class="bg-zinc-900 text-white">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div class="px-2 py-4 flex items-center">
              <img class="mr-2 w-10 h-10" src="/images/um_symbol.svg" alt="" />
              <h3 class="font-bold text-xl">urbanmobi</h3>
            </div>
            <!-- <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <SidebarMenuButton
                  size="lg"
                  class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div
                    class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
                  >
                    <component :is="activeTeam.logo" class="size-4" />
                  </div>
                  <div class="grid flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-semibold">{{
                      activeTeam.name
                    }}</span>
                    <span class="truncate text-xs">{{ activeTeam.plan }}</span>
                  </div>
                  <ChevronsUpDown class="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side="bottom"
                :side-offset="4"
              >
                <DropdownMenuLabel class="text-xs text-muted-foreground">
                  Teams
                </DropdownMenuLabel>
                <DropdownMenuItem
                  v-for="(team, index) in data.teams"
                  :key="team.name"
                  class="gap-2 p-2"
                  @click="setActiveTeam(team)"
                >
                  <div
                    class="flex size-6 items-center justify-center rounded-sm border"
                  >
                    <component :is="team.logo" class="size-4 shrink-0" />
                  </div>
                  {{ team.name }}
                  <DropdownMenuShortcut>⌘{{ index + 1 }}</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem class="gap-2 p-2">
                  <div
                    class="flex size-6 items-center justify-center rounded-md border bg-background"
                  >
                    <Plus class="size-4" />
                  </div>
                  <div class="font-medium text-muted-foreground">Add team</div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> -->
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent class="scrollbar-hidden">
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
              v-for="item in data.navMain"
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
                        <a :href="subItem.url">
                          <span>{{ subItem.title }}</span>
                        </a>
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
            <SidebarMenuItem v-for="item in data.settings" :key="item.name">
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
      <SidebarFooter class="bg-zinc-800">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <SidebarMenuButton
                  size="lg"
                  class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar class="h-8 w-8 rounded-lg">
                    <AvatarImage
                      :src="data.user.avatar"
                      :alt="data.user.name"
                    />
                    <AvatarFallback class="rounded-lg"> CN </AvatarFallback>
                  </Avatar>
                  <div class="grid flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-semibold">{{
                      data.user.name
                    }}</span>
                    <!-- <span class="truncate text-xs">{{ data.user.email }}</span> -->
                    <span class="truncate text-xs">{{
                      data.user.company
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
                        :src="data.user.avatar"
                        :alt="data.user.name"
                      />
                      <AvatarFallback class="rounded-lg"> CN </AvatarFallback>
                    </Avatar>
                    <div class="grid flex-1 text-left text-sm leading-tight">
                      <span class="truncate font-semibold">{{
                        data.user.name
                      }}</span>
                      <span class="truncate text-xs">{{
                        data.user.email
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
