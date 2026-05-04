<script setup lang="ts">
import ProductTag from '@/components/shared/ProductTag.vue';
import RideStatusFlag from '@/components/shared/RideStatusFlag.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Eye,
  Filter,
  LoaderCircle,
  Mail,
  MailCheck,
  MailOpen,
  Search,
} from 'lucide-vue-next';
import {
  getNotificationsService,
  markNotificationAsReadService,
} from '~/server/services/notifications';
import {
  type NotificationHistoryItem,
  formatNotificationDate,
  getNotificationChannelLabel,
  getNotificationDescription,
  getNotificationRideCode,
  getNotificationRideContext,
  getNotificationRideStatus,
  getNotificationSearchText,
  getNotificationTypeLabel,
  isRideNotification,
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

const filteredNotifications = computed(() => {
  const normalizedSearch = searchTerm.value.trim().toLowerCase();
  return notifications.value.filter((notification) => {
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

const rideContext = (notification: NotificationHistoryItem) =>
  getNotificationRideContext(notification);
const rideStatus = (notification: NotificationHistoryItem) =>
  getNotificationRideStatus(notification);

onMounted(() => {
  loadNotifications();
});
</script>

<template>
  <main class="space-y-6 p-6">
    <section class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-bold">
          <Mail :size="24" />
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
      class="grid gap-4 p-4 border border-zinc-200 rounded-lg bg-white lg:grid-cols-[1fr_16rem_auto] lg:items-center"
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
      class="flex items-center justify-center gap-3 min-h-40 p-8 border border-dashed rounded-lg"
    >
      <LoaderCircle class="animate-spin" :size="32" />
    </section>

    <section
      v-else-if="errorMessage"
      class="flex items-center justify-center gap-3 min-h-40 p-8 border border-solid border-red-200 rounded-lg bg-red-50 text-red-600"
    >
      {{ errorMessage }}
    </section>

    <section
      v-else-if="filteredNotifications.length === 0"
      class="flex items-center justify-center gap-3 min-h-40 p-8 border border-dashed rounded-lg bg-zinc-50 text-zinc-500"
    >
      Nenhuma notificação encontrada.
    </section>

    <section v-else class="space-y-4">
      <article
        v-for="notification in filteredNotifications"
        :key="notification.id"
        class="p-6 border border-zinc-200 rounded-lg bg-white"
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
              class="inline-flex items-center gap-2 h-10 px-4 rounded-full text-xs border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
            >
              <Eye :size="18" />
              Ver atendimento
            </NuxtLink>
            <button
              v-if="!notification.read"
              type="button"
              class="inline-flex items-center gap-2 h-10 px-4 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90"
              @click="markAsRead(notification.id)"
            >
              <LoaderCircle
                v-if="markingId === notification.id"
                class="h-4 w-4 animate-spin"
              />
              <MailCheck v-else class="h-4 w-4" />
              Marcar como lida
            </button>
            <span v-else class="inline-flex items-center gap-1 text-zinc-500 text-xs">
              <MailOpen class="h-4 w-4" />
            </span>
          </div>
        </div>

        <div
          v-if="isRideNotification(notification)"
          class="mt-5 rounded-xl border border-zinc-200 bg-zinc-50/70 p-5"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="inline-flex items-center h-7 px-3 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800"
            >
              {{ getNotificationChannelLabel(notification) }}
            </span>
          </div>

          <div class="mt-4 grid gap-4 lg:grid-cols-2">
            <div class="space-y-1.5">
              <span
                class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500"
                >Status do atendimento</span
              >
              <div>
                <RideStatusFlag
                  v-if="rideStatus(notification)"
                  :ride-status="rideStatus(notification)"
                />
                <p v-else class="text-sm font-semibold text-zinc-900">-</p>
              </div>
            </div>

            <div class="space-y-1.5">
              <span
                class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500"
                >Produto</span
              >
              <div>
                <ProductTag
                  v-if="rideContext(notification).product"
                  :label="rideContext(notification).product || '-'"
                  :type="(rideContext(notification).product || '').toUpperCase()"
                />
                <p v-else class="text-sm font-semibold text-zinc-900">-</p>
              </div>
            </div>

            <div class="space-y-1.5">
              <span
                class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500"
                >Atendimento</span
              >
              <p class="text-sm font-semibold text-zinc-900">
                {{ getNotificationRideCode(notification) || '-' }}
              </p>
            </div>

            <div class="space-y-1.5">
              <span
                class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500"
                >Usuário</span
              >
              <p class="text-sm font-semibold text-zinc-900">
                {{ rideContext(notification).userName || '-' }}
              </p>
            </div>

            <div class="space-y-1.5">
              <span
                class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500"
                >Solicitante</span
              >
              <p class="text-sm font-semibold text-zinc-900">
                {{ rideContext(notification).requesterName || '-' }}
              </p>
            </div>

            <div v-if="notification.type === 'ride_accepted'" class="space-y-1.5">
              <span
                class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500"
                >Motorista</span
              >
              <p class="text-sm font-semibold text-zinc-900">
                {{ rideContext(notification).driverName || '-' }}
              </p>
            </div>

            <div class="space-y-1.5">
              <span
                class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500"
                >Filial / Centro de custo</span
              >
              <p class="text-sm font-semibold text-zinc-900">
                {{
                  rideContext(notification).branchName || rideContext(notification).area
                    ? `${rideContext(notification).branchName || '-'} / ${
                        rideContext(notification).area || '-'
                      }`
                    : '-'
                }}
              </p>
            </div>

            <div class="space-y-1.5">
              <span
                class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500"
                >Origem</span
              >
              <p class="text-sm font-semibold text-zinc-900">
                {{ rideContext(notification).origin || '-' }}
              </p>
            </div>

            <div class="space-y-1.5">
              <span
                class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500"
                >Destino</span
              >
              <p class="text-sm font-semibold text-zinc-900">
                {{ rideContext(notification).destination || '-' }}
              </p>
            </div>

            <div
              v-if="rideContext(notification).stops.length > 0"
              class="space-y-1.5 lg:col-span-2"
            >
              <span
                class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500"
                >Paradas</span
              >
              <ul class="space-y-1 text-sm font-semibold text-zinc-900">
                <li
                  v-for="(stop, index) in rideContext(notification).stops"
                  :key="`${notification.id}-stop-${index}`"
                >
                  {{ index + 1 }}. {{ stop }}
                </li>
              </ul>
            </div>
          </div>

          <div class="mt-4 space-y-1.5">
            <span
              class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500"
              >Motivo</span
            >
            <p class="text-sm leading-6 text-zinc-700">
              {{ rideContext(notification).reason || '-' }}
            </p>
          </div>
        </div>
      </article>
    </section>
  </main>
</template>
