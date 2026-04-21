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
      <button type="button" class="reload-button" @click="loadNotifications">
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

    <section class="filter-panel">
      <label class="filter-search">
        <Search class="h-4 w-4 text-zinc-400" />
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Buscar por título, atendimento ou código"
        />
      </label>

      <label class="filter-select">
        <Filter class="h-4 w-4 text-zinc-400" />
        <select v-model="typeFilter">
          <option value="all">Todos os tipos</option>
          <option v-for="type in uniqueTypes" :key="type" :value="type">
            {{ getNotificationTypeLabel(type) }}
          </option>
        </select>
      </label>

      <div class="filter-statuses">
        <button
          type="button"
          :class="['filter-status', { active: readFilter === 'all' }]"
          @click="readFilter = 'all'"
        >
          Todas
        </button>
        <button
          type="button"
          :class="['filter-status', { active: readFilter === 'unread' }]"
          @click="readFilter = 'unread'"
        >
          Não lidas
        </button>
        <button
          type="button"
          :class="['filter-status', { active: readFilter === 'read' }]"
          @click="readFilter = 'read'"
        >
          Lidas
        </button>
      </div>
    </section>

    <section v-if="isLoading" class="state-panel">
      <LoaderCircle class="h-5 w-5 animate-spin" />
      Carregando notificações...
    </section>

    <section v-else-if="errorMessage" class="state-panel error">
      {{ errorMessage }}
    </section>

    <section v-else-if="filteredNotifications.length === 0" class="state-panel">
      Nenhuma notificação encontrada com os filtros atuais.
    </section>

    <section v-else class="space-y-4">
      <article
        v-for="notification in filteredNotifications"
        :key="notification.id"
        class="notification-card"
      >
        <div class="notification-card-head">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="notification-chip type">
                {{ getNotificationTypeLabel(notification.type) }}
              </span>
              <span class="notification-chip neutral">
                {{ formatNotificationDate(notification.createdAt) }}
              </span>
              <span
                :class="['notification-chip', notification.read ? 'success' : 'warning']"
              >
                {{ notification.read ? 'Lida' : 'Não lida' }}
              </span>
            </div>
            <h2 class="text-lg font-semibold text-zinc-950">{{ notification.title }}</h2>
            <p class="text-sm leading-6 text-zinc-600">
              {{ getNotificationDescription(notification) }}
            </p>
          </div>

          <div class="notification-actions">
            <NuxtLink
              v-if="
                notification.type === 'ride_created' &&
                getNotificationRideCode(notification)
              "
              :to="`/rides/form/edit/${getNotificationRideCode(notification)}`"
              class="secondary-button"
            >
              Ver atendimento
            </NuxtLink>
            <button
              type="button"
              class="secondary-button"
              @click="goToDetail(notification.id)"
            >
              Ver completa
            </button>
            <button
              v-if="!notification.read"
              type="button"
              class="primary-button"
              @click="markAsRead(notification.id)"
            >
              <LoaderCircle
                v-if="markingId === notification.id"
                class="h-4 w-4 animate-spin"
              />
              <CheckCheck v-else class="h-4 w-4" />
              Marcar como lida
            </button>
            <span v-else class="read-indicator">
              <MailOpen class="h-4 w-4" />
              Já lida
            </span>
          </div>
        </div>

        <div class="notification-summary-grid">
          <div
            v-for="item in getNotificationSummaryItems(notification)"
            :key="`${notification.id}-${item.label}`"
            class="notification-summary-item"
          >
            <span class="notification-summary-label">{{ item.label }}</span>
            <strong class="notification-summary-value">{{ item.value }}</strong>
          </div>
        </div>
      </article>
    </section>
  </main>
</template>

<style scoped>
.reload-button,
.primary-button,
.secondary-button,
.filter-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.6rem;
  padding: 0 1rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 700;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.reload-button,
.secondary-button {
  border: 1px solid hsl(var(--border));
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}

.primary-button,
.filter-status.active {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.reload-button:hover,
.secondary-button:hover {
  background: hsl(var(--muted));
}

.primary-button:hover {
  opacity: 0.9;
}

.filter-panel {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid hsl(var(--border));
  border-radius: 1.5rem;
  background: hsl(var(--card));
}

.filter-search,
.filter-select {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 3rem;
  padding: 0 1rem;
  border: 1px solid hsl(var(--border));
  border-radius: 9999px;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}

.filter-search input,
.filter-select select {
  width: 100%;
  background: transparent;
  color: inherit;
  outline: none;
}

.filter-statuses {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.filter-status {
  border: 1px solid hsl(var(--border));
  background: hsl(var(--background));
  color: hsl(var(--muted-foreground));
}

.state-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 10rem;
  padding: 2rem;
  border: 1px dashed hsl(var(--border));
  border-radius: 1.5rem;
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
}

.state-panel.error {
  border-style: solid;
  border-color: hsl(var(--destructive) / 0.3);
  background: hsl(var(--destructive) / 0.06);
  color: hsl(var(--destructive));
}

.notification-card {
  padding: 1.5rem;
  border: 1px solid hsl(var(--border));
  border-radius: 1.5rem;
  background: hsl(var(--card));
}

.notification-card-head {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notification-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.read-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: hsl(var(--muted-foreground));
  font-size: 0.85rem;
  font-weight: 600;
}

.notification-chip {
  display: inline-flex;
  align-items: center;
  min-height: 1.9rem;
  padding: 0 0.7rem;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 700;
}

.notification-chip.type {
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
}

.notification-chip.neutral {
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
}

.notification-chip.success {
  background: #ecfdf5;
  color: #15803d;
}

.notification-chip.warning {
  background: #fef3c7;
  color: #b45309;
}

.notification-summary-grid {
  display: grid;
  gap: 0.9rem;
  margin-top: 1.25rem;
}

.notification-summary-item {
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  background: hsl(var(--muted));
}

.notification-summary-label {
  display: block;
  color: hsl(var(--muted-foreground));
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.notification-summary-value {
  display: block;
  margin-top: 0.35rem;
  color: hsl(var(--card-foreground));
  line-height: 1.45;
}

@media (min-width: 960px) {
  .filter-panel {
    grid-template-columns: minmax(0, 2fr) minmax(16rem, 1fr) auto;
    align-items: center;
  }

  .notification-card-head {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }

  .notification-actions {
    justify-content: flex-end;
  }

  .notification-summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
