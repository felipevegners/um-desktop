<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, BellRing, CheckCheck, ChevronRight, LoaderCircle } from 'lucide-vue-next';
import {
  getNotificationsService,
  markNotificationAsReadService,
} from '~/server/services/notifications';
import {
  type NotificationHistoryItem,
  formatNotificationDate,
  getNotificationDescription,
  getNotificationRideCode,
  getNotificationTypeLabel,
} from '~/utils/notifications';

const POLL_INTERVAL_MS = 30_000;

const notifications = ref<NotificationHistoryItem[]>([]);
const isLoading = ref(false);
const markingId = ref<string | null>(null);

let pollingTimer: ReturnType<typeof setInterval> | null = null;

const unreadCount = computed(
  () => notifications.value.filter((notification) => !notification.read).length,
);
const latestNotifications = computed(() => notifications.value.slice(0, 5));

const loadNotifications = async () => {
  isLoading.value = true;

  try {
    const response = await getNotificationsService();
    notifications.value = Array.isArray(response)
      ? (response as NotificationHistoryItem[])
      : [];
  } finally {
    isLoading.value = false;
  }
};

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

const openNotification = async (notification: NotificationHistoryItem) => {
  if (!notification.read) {
    await markAsRead(notification.id);
  }

  await navigateTo(`/notifications/${notification.id}`);
};

const openNotificationsList = async () => {
  await navigateTo('/notifications');
};

onMounted(() => {
  loadNotifications();
  pollingTimer = setInterval(loadNotifications, POLL_INTERVAL_MS);
});

onUnmounted(() => {
  if (pollingTimer !== null) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
});
</script>

<template>
  <div class="notification-wrapper">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <button type="button" class="notification-trigger" aria-label="Notificações">
          <BellRing v-if="unreadCount > 0" :size="18" />
          <Bell v-else :size="18" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" :side-offset="10" class="notification-menu">
        <div class="notification-header">
          <div>
            <p class="notification-title">Notificações</p>
            <p class="notification-subtitle">
              {{ unreadCount }} não lida<span v-if="unreadCount !== 1">s</span>
            </p>
          </div>
          <button type="button" class="notification-link" @click="openNotificationsList">
            Ver todas
          </button>
        </div>

        <div v-if="isLoading" class="notification-state">
          <LoaderCircle class="h-4 w-4 animate-spin" />
          Carregando notificações...
        </div>

        <div v-else-if="latestNotifications.length === 0" class="notification-state">
          Nenhuma notificação disponível.
        </div>

        <div v-else class="notification-list">
          <button
            v-for="notification in latestNotifications"
            :key="notification.id"
            type="button"
            class="notification-item"
            @click="openNotification(notification)"
          >
            <div class="notification-item-main">
              <div class="notification-item-topline">
                <span class="notification-type">{{
                  getNotificationTypeLabel(notification.type)
                }}</span>
                <span class="notification-date">
                  {{ formatNotificationDate(notification.createdAt) }}
                </span>
              </div>
              <p class="notification-item-title">{{ notification.title }}</p>
              <p class="notification-item-description">
                {{ getNotificationDescription(notification) }}
              </p>
              <NuxtLink
                v-if="
                  notification.type === 'ride_created' &&
                  getNotificationRideCode(notification)
                "
                :to="`/rides/form/edit/${getNotificationRideCode(notification)}`"
                class="notification-ride-link"
                @click.stop
              >
                Ver atendimento {{ getNotificationRideCode(notification) }}
              </NuxtLink>
            </div>
            <div class="notification-item-side">
              <button
                v-if="!notification.read"
                type="button"
                class="notification-mark-read"
                @click.stop="markAsRead(notification.id)"
              >
                <LoaderCircle
                  v-if="markingId === notification.id"
                  class="h-3.5 w-3.5 animate-spin"
                />
                <CheckCheck v-else class="h-3.5 w-3.5" />
              </button>
              <span v-else class="notification-read-pill">Lida</span>
              <ChevronRight class="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>

    <span
      v-if="unreadCount > 0"
      class="notification-badge"
      aria-label="notificações não lidas"
    >
      {{ unreadCount > 9 ? '9+' : unreadCount }}
    </span>
  </div>
</template>

<style scoped>
.notification-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
}

.notification-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid hsl(var(--border));
  border-radius: 9999px;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  transition: border-color 0.2s ease;
}

.notification-trigger:hover {
  border-color: hsl(var(--primary));
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 1.2rem;
  height: 1.2rem;
  padding: 0 0.25rem;
  border-radius: 9999px;
  background: hsl(var(--destructive));
  color: hsl(var(--destructive-foreground));
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.2rem;
  text-align: center;
  pointer-events: none;
}

.notification-menu {
  width: 24rem;
  padding: 0;
  overflow: hidden;
}

.notification-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid hsl(var(--border));
  background: hsl(var(--muted));
}

.notification-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: hsl(var(--foreground));
}

.notification-subtitle {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
}

.notification-link {
  color: hsl(var(--primary));
  font-size: 0.78rem;
  font-weight: 600;
}

.notification-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 6rem;
  padding: 1rem;
  color: hsl(var(--muted-foreground));
  font-size: 0.82rem;
}

.notification-list {
  max-height: 25rem;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  padding: 0.95rem 1rem;
  text-align: left;
  border-bottom: 1px solid hsl(var(--border));
  transition: background-color 0.15s ease;
}

.notification-item:hover {
  background: hsl(var(--muted));
}

.notification-item-main {
  min-width: 0;
  flex: 1;
}

.notification-item-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.notification-type {
  color: hsl(var(--primary));
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.notification-date {
  color: hsl(var(--muted-foreground));
  font-size: 0.72rem;
  white-space: nowrap;
}

.notification-item-title {
  margin-top: 0.35rem;
  color: hsl(var(--foreground));
  font-size: 0.9rem;
  font-weight: 700;
}

.notification-item-description {
  margin-top: 0.25rem;
  color: hsl(var(--muted-foreground));
  font-size: 0.8rem;
  line-height: 1.35;
}

.notification-ride-link {
  display: inline-flex;
  align-items: center;
  margin-top: 0.4rem;
  color: hsl(var(--primary));
  font-size: 0.76rem;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.notification-item-side {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 0.15rem;
}

.notification-mark-read {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  background: hsl(var(--muted));
  color: hsl(var(--primary));
}

.notification-read-pill {
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
  font-size: 0.68rem;
  font-weight: 700;
}
</style>
