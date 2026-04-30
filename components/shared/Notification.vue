<script setup lang="ts">
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAccountStore } from '@/stores/account.store';
import { Bell, CheckCheck, ChevronRight, LoaderCircle } from 'lucide-vue-next';
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

const accountStore = useAccountStore();
const currentAccount = computed(() => accountStore.account || {});

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readNestedValue(source: Record<string, unknown> | null, path: string[]) {
  let current: unknown = source;
  for (const segment of path) {
    const next = toRecord(current);
    if (!next || !(segment in next)) return null;
    current = next[segment];
  }

  if (typeof current === 'string') return current.trim();
  if (typeof current === 'number' || typeof current === 'boolean') return String(current);
  return null;
}

function hasContractMatch(
  notification: NotificationHistoryItem,
  contractId?: string | null,
) {
  if (!contractId) return false;
  // Prefer top-level contractId
  if (notification.contractId && String(notification.contractId) === contractId)
    return true;
  const body = toRecord(notification.body);
  return (
    readNestedValue(body, ['billing', 'paymentData', 'contractId']) === contractId ||
    readNestedValue(body, ['user', 'contract', 'contractId']) === contractId
  );
}

function hasBranchMatch(notification: NotificationHistoryItem, branchId?: string | null) {
  if (!branchId) return false;
  // Prefer top-level branchId
  if (
    (notification as any).branchId &&
    String((notification as any).branchId) === branchId
  )
    return true;
  const body = toRecord(notification.body);
  return (
    readNestedValue(body, ['user', 'contract', 'branchId']) === branchId ||
    readNestedValue(body, ['branchId']) === branchId ||
    readNestedValue(body, ['contract', 'branchId']) === branchId ||
    readNestedValue(body, ['billing', 'paymentData', 'branchId']) === branchId ||
    readNestedValue(body, ['billing', 'paymentData', 'contract', 'branchId']) === branchId
  );
}

// Server now handles scoping. The client shows whatever the API returns.
const filteredNotifications = computed(() => notifications.value);

const latestNotifications = computed(() => filteredNotifications.value.slice(0, 5));

const unreadCount = computed(
  () => filteredNotifications.value.filter((notification) => !notification.read).length,
);

const loadNotifications = async () => {
  isLoading.value = true;

  try {
    const response = await getNotificationsService();
    if (Array.isArray(response)) {
      notifications.value = response as NotificationHistoryItem[];
    }
  } finally {
    isLoading.value = false;
  }
};

const markAsRead = async (notificationId: string) => {
  if (markingId.value === notificationId) return;
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
  <div class="relative inline-flex items-center justify-center p-1">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <div class="relative">
          <Bell v-if="unreadCount > 0" :size="24" />
          <Bell v-else :size="24" />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        :side-offset="10"
        class="w-96 min-w-[24rem] p-0 overflow-hidden"
      >
        <div
          class="flex items-start justify-between gap-4 p-4 border-b border-zinc-200 bg-zinc-50"
        >
          <div>
            <p class="text-sm font-bold text-zinc-900">Notificações</p>
            <p class="mt-1 text-xs text-zinc-500">
              {{ unreadCount }} não lida<span v-if="unreadCount !== 1">s</span>
            </p>
          </div>
          <Button variant="secondary" @click="openNotificationsList"> Ver todas </Button>
        </div>

        <div v-if="isLoading" class="max-h-96 overflow-y-auto">
          <!-- single skeleton row to avoid dropdown height jump -->
          <div
            class="flex items-start justify-between gap-3 w-full p-4 border-b border-zinc-200"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-3">
                <span class="block h-3 w-28 rounded bg-zinc-200 animate-pulse"></span>
                <span class="block h-3 w-16 rounded bg-zinc-200 animate-pulse"></span>
              </div>
              <div class="mt-3 h-4 w-3/5 rounded bg-zinc-200 animate-pulse"></div>
              <div class="mt-2 h-3 w-4/5 rounded bg-zinc-200 animate-pulse"></div>
            </div>
            <div class="flex items-center gap-2 pt-1">
              <span class="block h-7 w-7 rounded-full bg-zinc-200 animate-pulse"></span>
              <ChevronRight class="h-4 w-4 text-zinc-400" />
            </div>
          </div>
        </div>

        <div
          v-else-if="latestNotifications.length === 0"
          class="flex items-center justify-center gap-2 min-h-24 p-4 text-zinc-500 text-sm"
        >
          Nenhuma notificação disponível.
        </div>

        <div v-else class="max-h-96 overflow-y-auto">
          <button
            v-for="notification in latestNotifications"
            :key="notification.id"
            type="button"
            class="flex items-start justify-between gap-3 w-full p-4 border-b border-zinc-200 hover:bg-zinc-50"
            @click="openNotification(notification)"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-3">
                <span class="text-primary text-xs font-bold uppercase tracking-wider">{{
                  getNotificationTypeLabel(notification.type)
                }}</span>
                <span class="text-xs text-zinc-500 whitespace-nowrap">{{
                  formatNotificationDate(notification.createdAt)
                }}</span>
              </div>
              <p class="mt-1 text-sm font-bold text-zinc-900">{{ notification.title }}</p>
              <p class="mt-2 text-sm text-zinc-600 leading-5">
                {{ getNotificationDescription(notification) }}
              </p>
              <NuxtLink
                v-if="
                  notification.type === 'ride_created' &&
                  getNotificationRideCode(notification)
                "
                :to="`/rides/form/edit/${getNotificationRideCode(notification)}`"
                class="inline-flex items-center mt-2 text-primary text-sm font-semibold underline underline-offset-2"
                @click.stop
                >Ver atendimento {{ getNotificationRideCode(notification) }}</NuxtLink
              >
            </div>
            <div class="flex items-center gap-2 pt-1">
              <button
                v-if="!notification.read"
                type="button"
                class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-100 text-primary"
                @click.stop="markAsRead(notification.id)"
              >
                <LoaderCircle
                  v-if="markingId === notification.id"
                  class="h-3.5 w-3.5 animate-spin"
                />
                <CheckCheck v-else class="h-3.5 w-3.5" />
              </button>
              <span
                v-else
                class="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-xs font-bold"
                >Lida</span
              >
              <ChevronRight class="h-4 w-4 text-zinc-400" />
            </div>
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>

    <span
      v-if="unreadCount > 0"
      class="absolute top-0 right-0 min-w-[1.2rem] h-5 px-1 rounded-full bg-um-primary text-black text-[0.68rem] font-bold leading-5 text-center pointer-events-none"
      aria-label="notificações não lidas"
      >{{ unreadCount > 9 ? '9+' : unreadCount }}</span
    >
  </div>
</template>
