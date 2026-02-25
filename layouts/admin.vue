<script setup lang="ts">
import Header from '@/components/shared/Header.vue';
import { useToast } from '@/components/ui/toast';
import { useRemoteSessionCheck } from '@/composables/auth/useRemoteSessionCheck';
import { generateMenu } from '@/config/menu/generateMenu';
import {
  ChevronRight,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Package,
  User,
} from 'lucide-vue-next';

import { privacyTerms } from '../config/privacy';

useRemoteSessionCheck();

const { toast } = useToast();

const { data, signOut } = useAuth();
//@ts-ignore
const { user } = data.value;
const menuData = generateMenu(user.role);

const accountStore = useAccountStore();
const { updateUserAccountAction } = accountStore;
const { isLoadingSend } = storeToRefs(accountStore);

// Terms management
const accept_terms = useCookie('accept_terms');
const showTermsMessage = ref(accept_terms.value === 'false' || !accept_terms.value);
const showContinueBtn = ref(false);

const acceptTerms = async () => {
  try {
    const accountData = {
      accountId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      enabled: user.enabled,
      status: user.status,
      avatar: user.avatar,
      contract: user.contract,
      phone: user.phone,
      position: user.position,
      department: user.department,
      document: user.document,
      birthDate: user.birthDate,
      address: user.address,
      emailConfirmed: user.emailConfirmed,
      acceptTerms: true,
    };
    await updateUserAccountAction(accountData);
  } catch (error) {
    console.error('Erro ao enviar o aceite dos termos', error);
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao enviar o aceite dos termos. Tente novamente.`,
    });
  } finally {
    accept_terms.value = 'true';
    showTermsMessage.value = false;
  }
};

const userTermsFileUrl =
  privacyTerms.find((item) => item.title === 'Termos de Uso')?.url || '#';

// Cookie management
const accept_cookies = useCookie('accept_cookies');
const showCookieMessage = ref(accept_cookies.value === 'false' || !accept_cookies.value);

const acceptCookies = () => {
  accept_cookies.value = 'true';
  showCookieMessage.value = false;
};

const cookiesPoliceFileUrl =
  'https://1f76f02ebg.ufs.sh/f/kwE4poT2ybaglWtZTAQV7Wx9FKAmke5pJPqZjf4gYzBL3lr2';

// const userNameInitials = computed(() => {
//   const splited = menuData.user.name.split(' ');
//   return splited.map((word: string) => word[0]).join('');
// });
</script>

<template>
  <div
    v-if="showTermsMessage"
    class="fixed flex items-center justify-center bg-zinc-950/90 z-50 w-full h-full"
  >
    <div
      class="max-w-sm md:max-w-lg bg-zinc-950 rounded-lg shadow-lg p-6 m-auto text-white space-y-12"
    >
      <img class="h-10" src="/images/logo_horizontal_white.svg" />
      <h2 class="mb-6 font-bold text-xl">Termos de Uso</h2>
      <div class="space-y-3">
        <p>
          Verificamos que você ainda não aceitou
          <NuxtLink
            :href="userTermsFileUrl"
            target="_blank"
            class="underline text-um-primary"
          >
            nossos termos de uso.
          </NuxtLink>
        </p>
        <p>Por favor, leia e aceite os termos para continuar utilizando a plataforma.</p>
      </div>
      <div class="my-10 flex items-center gap-4">
        <Checkbox
          class="w-5 h-5 bg-transparent border border-um-primary data-[state=checked]:text-um-primary"
          v-model="showContinueBtn"
          @update:checked="(value) => (showContinueBtn = value)"
        />
        <label class="text-sm">Declaro que li e aceito os termos de uso.</label>
      </div>
      <Button
        type="button"
        class="border border-um-primary text-um-primary hover:bg-um-primary/80 hover:text-black uppercase"
        :disabled="!showContinueBtn"
        @click="acceptTerms"
      >
        <LoaderCircle :size="16" class="animate-spin mr-2" v-if="isLoadingSend" />
        Continuar
        <ChevronRight :size="16" />
      </Button>
    </div>
  </div>
  <SidebarProvider>
    <Sidebar collapsible="icon" class="text-white bg-zinc-950 border-none">
      <SidebarHeader class="sidebar">
        <SidebarMenu>
          <SidebarMenuItem>
            <div class="py-2 flex items-start justify-center">
              <img
                class="mt-8 mb-10 h-12 group-data-[collapsible=icon]:hidden"
                src="/images/logo_horizontal_white.svg"
              />
              <img
                class="hidden mt-8 h-10 text-um-primary group-data-[collapsible=icon]:block transition-all"
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
                  <SidebarMenuButton :tooltip="item.title" class="my-3">
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
                        <NuxtLink
                          :href="subItem.url"
                          exact-active-class="text-um-primary"
                        >
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
        <div v-if="menuData?.settings?.length > 0">
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
                    exact-active-class="text-um-primary"
                  >
                    <component :is="item.icon" />
                    <span>{{ item.name }}</span>
                  </NuxtLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarSeparator class="border-b border-zinc-700" />
        </div>
        <!-- @vue-skip -->
        <SidebarGroup v-if="menuData.sac">
          <SidebarGroupLabel class="text-[#33ffcc] text-md"> SAC </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in menuData.sac" :key="item.name">
              <SidebarMenuButton as-child>
                <!-- @vue-skip -->
                <NuxtLink
                  :to="item.url"
                  :class="`${item?.active ? 'text-um-primary' : 'text-white'}`"
                  exact-active-class="text-um-primary"
                >
                  <component :is="item.icon" />
                  <span>{{ item.name }}</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup class="bg-zinc-950 text-white">
          <SidebarGroupLabel class="text-[#33ffcc] text-md">
            Privacidade
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in privacyTerms" :key="item.title">
              <SidebarMenuButton as-child>
                <!-- @vue-skip -->
                <NuxtLink :to="item.url" target="_blank" class="hover:underline">
                  <span>{{ item.title }}</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator class="border-b border-zinc-700" />
      <SidebarGroup class="p-2 flex flex-row items-center gap-2 bg-zinc-950">
        <Package class="text-muted-foreground" :size="16" />
        <small class="text-muted-foreground"> v{{ $config.public.clientVersion }} </small>
      </SidebarGroup>
      <SidebarSeparator class="border-b border-zinc-700" />
      <SidebarGroup class="bg-zinc-950 text-white">
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
    <SidebarInset class="md:max-w-[calc(100%-256px)]">
      <Header />
      <slot />
      <!-- Cookie Acceptance Message -->
      <div
        v-if="showCookieMessage"
        class="p-6 fixed bottom-4 right-5 bg-zinc-950 text-white rounded-lg shadow-lg z-40 flex flex-col gap-4 max-w-sm md:max-w-lg"
      >
        <h3 class="font-bold">Política de Cookies</h3>
        <p class="block text-sm">
          Usamos cookies para melhorar sua experiência. Ao continuar navegando, você
          aceita nossa
          <NuxtLink
            :href="cookiesPoliceFileUrl"
            target="_blank"
            exact-active-class="text-um-primary underline"
            class="text-um-primary underline"
          >
            política de cookies.
          </NuxtLink>
        </p>
        <div class="mt-4 flex gap-2">
          <Button
            type="button"
            class="border border-um-primary text-um-primary hover:bg-um-primary/80 hover:text-black uppercase"
            @click="acceptCookies"
          >
            Aceitar
          </Button>
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

<style scoped>
.sidebar {
  @apply md:bg-transparent bg-zinc-950 text-white;
}

.sidebar-footer {
  @apply md:bg-transparent bg-zinc-950 text-white;
}
</style>
