<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BellRing,
  CheckCheck,
  Filter,
  LoaderCircle,
  MailOpen,
  Search,
} from 'lucide-vue-next';
import { useNotificationClientFilter } from '~/composables/useNotificationClientFilter';
import {
  getNotificationsService,
  markNotificationAsReadService,
} from '~/server/services/notifications';
import {
  type NotificationHistoryItem,
  formatNotificationDate,
  getNotificationDescription,
  getNotificationRideCode,
  getNotificationSearchText,
  getNotificationSummaryItems,
  getNotificationTypeLabel,
} from '~/utils/notifications';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

useHead({
  title: 'Notificações | Urban Mobi',
});

const notifications = ref<NotificationHistoryItem[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');
const searchTerm = ref('');
const typeFilter = ref('all');
const readFilter = ref<'all' | 'unread' | 'read'>('all');
const markingId = ref<string | null>(null);

const loadNotifications = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const response = await getNotificationsService();
    notifications.value = Array.isArray(response)
      ? (response as NotificationHistoryItem[])
      : [];
  } catch (error: any) {
    errorMessage.value =
      error?.data?.message ||
      error?.statusMessage ||
      'Não foi possível carregar as notificações.';
  } finally {
    isLoading.value = false;
  }
};

const uniqueTypes = computed(() => {
  const types = new Set<string>();

  for (const notification of notifications.value) {
    types.add(notification.type);
  }

  return Array.from(types).sort();
});

const counters = computed(() => ({
  total: notifications.value.length,
  unread: notifications.value.filter((notification) => !notification.read).length,
  read: notifications.value.filter((notification) => notification.read).length,
}));

const filteredByRole = useNotificationClientFilter(notifications.value);
const filteredNotifications = computed(() => {
  if (filteredByRole.value === null) return null; // loading
  const normalizedSearch = searchTerm.value.trim().toLowerCase();
  return filteredByRole.value.filter((notification) => {
    if (typeFilter.value !== 'all' && notification.type !== typeFilter.value) {
      return false;
    }
    if (readFilter.value === 'unread' && notification.read) {
      return false;
    }
    if (readFilter.value === 'read' && !notification.read) {
      return false;
    }
    if (!normalizedSearch) {
      return true;
    }
    return getNotificationSearchText(notification).includes(normalizedSearch);
  });
});

const markAsRead = async (notificationId: string) => {
  if (markingId.value === notificationId) {
    return;
  }

  markingId.value = notificationId;

  try {
    await markNotificationAsReadService(notificationId);
    notifications.value = notifications.value.map((notification) =>
      notification.id === notificationId ? { ...notification, read: true } : notification,
    );
  } finally {
    markingId.value = null;
  }
};

const goToDetail = async (notificationId: string) => {
  await navigateTo(`/notifications/${notificationId}`);
};

onMounted(() => {
  loadNotifications();
});
</script>

<template>
  <main class="space-y-6 p-6">
    <section class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-bold">
          <BellRing :size="24" />
          Central de Notificações
        </h1>
      </div>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full text-sm font-semibold transition-colors border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
        @click="loadNotifications"
      >
        Atualizar
      </button>
    </section>

    <section class="grid gap-4 md:grid-cols-3">
      <Card class="border-zinc-200 bg-white">
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-semibold text-zinc-500">Total</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold text-zinc-950">{{ counters.total }}</p>
        </CardContent>
      </Card>
      <Card class="border-amber-200 bg-amber-50">
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-semibold text-amber-700">Não lidas</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold text-amber-900">{{ counters.unread }}</p>
        </CardContent>
      </Card>
      <Card class="border-emerald-200 bg-emerald-50">
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-semibold text-emerald-700">Lidas</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold text-emerald-900">{{ counters.read }}</p>
        </CardContent>
      </Card>
    </section>

    <section
      class="grid gap-4 p-4 border border-zinc-200 rounded-xl bg-white lg:grid-cols-[1fr_16rem_auto] lg:items-center"
    >
      <label
        class="flex items-center gap-3 min-h-12 px-4 border border-zinc-200 rounded-full bg-white text-zinc-900 flex-1"
      >
        <Search class="h-4 w-4 text-zinc-400" />
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Buscar por título, atendimento ou código"
          class="flex-1 bg-transparent outline-none"
        />
      </label>

      <label
        class="flex items-center gap-3 min-h-12 px-4 border border-zinc-200 rounded-full bg-white text-zinc-900"
      >
        <Filter class="h-4 w-4 text-zinc-400" />
        <select v-model="typeFilter" class="bg-transparent outline-none">
          <option value="all">Todos os tipos</option>
          <option v-for="type in uniqueTypes" :key="type" :value="type">
            {{ getNotificationTypeLabel(type) }}
          </option>
        </select>
      </label>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          :class="[
            readFilter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'border border-zinc-200 bg-white text-zinc-500',
            'inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-semibold',
          ]"
          @click="readFilter = 'all'"
        >
          Todas
        </button>
        <button
          type="button"
          :class="[
            readFilter === 'unread'
              ? 'bg-primary text-primary-foreground'
              : 'border border-zinc-200 bg-white text-zinc-500',
            'inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-semibold',
          ]"
          @click="readFilter = 'unread'"
        >
          Não lidas
        </button>
        <button
          type="button"
          :class="[
            readFilter === 'read'
              ? 'bg-primary text-primary-foreground'
              : 'border border-zinc-200 bg-white text-zinc-500',
            'inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-semibold',
          ]"
          @click="readFilter = 'read'"
        >
          Lidas
        </button>
      </div>
    </section>

    <section
      v-if="isLoading || filteredNotifications === null"
      class="flex items-center justify-center gap-3 min-h-40 p-8 border border-dashed rounded-xl bg-zinc-50 text-zinc-500"
    >
      <LoaderCircle class="h-5 w-5 animate-spin" />
      Carregando notificações...
    </section>

    <section
      v-else-if="errorMessage"
      class="flex items-center justify-center gap-3 min-h-40 p-8 border border-solid border-red-200 rounded-xl bg-red-50 text-red-600"
    >
      {{ errorMessage }}
    </section>

    <section
      v-else-if="filteredNotifications.length === 0"
      class="flex items-center justify-center gap-3 min-h-40 p-8 border border-dashed rounded-xl bg-zinc-50 text-zinc-500"
    >
      Nenhuma notificação encontrada com os filtros atuais.
    </section>

    <section v-else class="space-y-4">
      <article
        v-for="notification in filteredNotifications"
        :key="notification.id"
        class="p-6 border border-zinc-200 rounded-xl bg-white"
      >
        <div class="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="inline-flex items-center h-8 px-3 rounded-full text-xs font-bold bg-primary/10 text-primary"
                >{{ getNotificationTypeLabel(notification.type) }}</span
              >
              <span
                class="inline-flex items-center h-8 px-3 rounded-full text-xs font-bold bg-zinc-100 text-zinc-500"
                >{{ formatNotificationDate(notification.createdAt) }}</span
              >
              <span
                :class="[
                  notification.read
                    ? 'inline-flex items-center h-8 px-3 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800'
                    : 'inline-flex items-center h-8 px-3 rounded-full text-xs font-bold bg-amber-50 text-amber-700',
                ]"
                >{{ notification.read ? 'Lida' : 'Não lida' }}</span
              >
            </div>
            <h2 class="text-lg font-semibold text-zinc-900">{{ notification.title }}</h2>
            <p class="text-sm leading-6 text-zinc-600">
              {{ getNotificationDescription(notification) }}
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <NuxtLink
              v-if="
                notification.type === 'ride_created' &&
                getNotificationRideCode(notification)
              "
              :to="`/rides/form/edit/${getNotificationRideCode(notification)}`"
              class="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-semibold border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
              >Ver atendimento</NuxtLink
            >
            <button
              type="button"
              class="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-semibold border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
              @click="goToDetail(notification.id)"
            >
              Ver completa
            </button>
            <button
              v-if="!notification.read"
              type="button"
              class="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90"
              @click="markAsRead(notification.id)"
            >
              <LoaderCircle
                v-if="markingId === notification.id"
                class="h-4 w-4 animate-spin"
              />
              <CheckCheck v-else class="h-4 w-4" />
              Marcar como lida
            </button>
            <span
              v-else
              class="inline-flex items-center gap-1 text-zinc-500 text-sm font-semibold"
              ><MailOpen class="h-4 w-4" />Já lida</span
            >
          </div>
        </div>

        <div class="grid gap-3 mt-5 lg:grid-cols-3">
          <div
            v-for="item in getNotificationSummaryItems(notification)"
            :key="`${notification.id}-${item.label}`"
            class="p-4 rounded-lg bg-zinc-50"
          >
            <span
              class="block text-zinc-500 text-xs font-bold uppercase tracking-wider"
              >{{ item.label }}</span
            >
            <strong class="block mt-1 text-zinc-900 leading-6">{{ item.value }}</strong>
          </div>
        </div>
      </article>
    </section>
  </main>
</template>
