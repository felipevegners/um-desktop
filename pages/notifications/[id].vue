<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BellRing, CheckCheck, LoaderCircle, MailOpen } from 'lucide-vue-next';
import {
  getNotificationByIdService,
  markNotificationAsReadService,
} from '~/server/services/notifications';
import {
  type NotificationHistoryItem,
  formatNotificationDate,
  getNotificationDescription,
  getNotificationRideCode,
  getNotificationSummaryItems,
  getNotificationTypeLabel,
  stringifyNotificationBody,
} from '~/utils/notifications';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

const route = useRoute();
const notification = ref<NotificationHistoryItem | null>(null);
const isLoading = ref(false);
const isMarking = ref(false);
const errorMessage = ref('');

const notificationId = computed(() => String(route.params.id || ''));

useHead(() => ({
  title: notification.value
    ? `${notification.value.title} | Notificações | Urban Mobi`
    : 'Notificação | Urban Mobi',
}));

const markAsRead = async () => {
  if (!notification.value || notification.value.read || isMarking.value) {
    return;
  }

  isMarking.value = true;

  try {
    await markNotificationAsReadService(notification.value.id);
    notification.value = { ...notification.value, read: true };
  } finally {
    isMarking.value = false;
  }
};

const loadNotification = async () => {
  if (!notificationId.value) {
    errorMessage.value = 'Notificação inválida.';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const response = await getNotificationByIdService(notificationId.value);
    notification.value = response as NotificationHistoryItem;

    if (notification.value && !notification.value.read) {
      await markAsRead();
    }
  } catch (error: any) {
    errorMessage.value =
      error?.data?.message ||
      error?.statusMessage ||
      'Não foi possível carregar a notificação.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadNotification();
});
</script>

<template>
  <main class="space-y-6 p-6">
    <section class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="space-y-3">
        <button type="button" class="back-link" @click="navigateTo('/notifications')">
          <ArrowLeft class="h-4 w-4" />
          Voltar para notificações
        </button>
        <div v-if="notification" class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="detail-chip type">{{
              getNotificationTypeLabel(notification.type)
            }}</span>
            <span class="detail-chip neutral">
              {{ formatNotificationDate(notification.createdAt) }}
            </span>
            <span :class="['detail-chip', notification.read ? 'success' : 'warning']">
              {{ notification.read ? 'Lida' : 'Não lida' }}
            </span>
          </div>
          <h1 class="flex items-center gap-2 text-2xl font-bold text-zinc-950">
            <BellRing :size="24" />
            {{ notification.title }}
          </h1>
          <p class="max-w-4xl text-sm leading-7 text-zinc-600">
            {{ getNotificationDescription(notification) }}
          </p>
        </div>
      </div>

      <div v-if="notification" class="flex flex-wrap items-center gap-3">
        <NuxtLink
          v-if="
            notification.type === 'ride_created' && getNotificationRideCode(notification)
          "
          :to="`/rides/form/edit/${getNotificationRideCode(notification)}`"
          class="mark-read-button"
        >
          Ver atendimento {{ getNotificationRideCode(notification) }}
        </NuxtLink>
        <button
          v-if="!notification.read"
          type="button"
          class="mark-read-button"
          @click="markAsRead"
        >
          <LoaderCircle v-if="isMarking" class="h-4 w-4 animate-spin" />
          <CheckCheck v-else class="h-4 w-4" />
          Marcar como lida
        </button>
        <span v-else class="read-pill">
          <MailOpen class="h-4 w-4" />
          Notificação já lida
        </span>
      </div>
    </section>

    <section v-if="isLoading" class="detail-state">
      <LoaderCircle class="h-5 w-5 animate-spin" />
      Carregando notificação...
    </section>

    <section v-else-if="errorMessage" class="detail-state error">
      {{ errorMessage }}
    </section>

    <template v-else-if="notification">
      <section class="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card class="border-zinc-200 bg-white">
          <CardHeader>
            <CardTitle>Resumo principal</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div
              v-for="item in getNotificationSummaryItems(notification)"
              :key="`${notification.id}-${item.label}`"
              class="detail-summary-item"
            >
              <span class="detail-summary-label">{{ item.label }}</span>
              <strong class="detail-summary-value">{{ item.value }}</strong>
            </div>
          </CardContent>
        </Card>

        <Card class="border-zinc-200 bg-zinc-950 text-white">
          <CardHeader>
            <CardTitle>Leitura rápida</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3 text-sm leading-6 text-zinc-300">
            <p>
              Use este bloco para ver rápido o tipo, contexto, ride, contrato e motorista
              sem abrir o payload inteiro.
            </p>
            <p>
              O payload completo permanece abaixo para auditoria, troubleshooting e
              suporte.
            </p>
          </CardContent>
        </Card>
      </section>

      <Card class="border-zinc-200 bg-white">
        <CardHeader>
          <CardTitle>Payload completo</CardTitle>
        </CardHeader>
        <CardContent>
          <pre class="payload-view">{{ stringifyNotificationBody(notification) }}</pre>
        </CardContent>
      </Card>
    </template>
  </main>
</template>

<style scoped>
.back-link,
.mark-read-button {
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
    opacity 0.15s ease,
    border-color 0.15s ease;
}

.back-link {
  border: 1px solid hsl(var(--border));
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}

.mark-read-button {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.back-link:hover {
  background: hsl(var(--muted));
}

.mark-read-button:hover {
  opacity: 0.9;
}

.read-pill,
.detail-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2rem;
  padding: 0 0.75rem;
  border-radius: 9999px;
  font-size: 0.74rem;
  font-weight: 700;
}

.detail-chip.type {
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
}

.detail-chip.neutral {
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
}

.detail-chip.success,
.read-pill {
  background: #ecfdf5;
  color: #15803d;
}

.detail-chip.warning {
  background: #fef3c7;
  color: #b45309;
}

.detail-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 12rem;
  padding: 2rem;
  border: 1px dashed hsl(var(--border));
  border-radius: 1.5rem;
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
}

.detail-state.error {
  border-style: solid;
  border-color: hsl(var(--destructive) / 0.3);
  background: hsl(var(--destructive) / 0.06);
  color: hsl(var(--destructive));
}

.detail-summary-item {
  padding: 1rem;
  border-radius: 1rem;
  background: hsl(var(--muted));
}

.detail-summary-label {
  display: block;
  color: hsl(var(--muted-foreground));
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.detail-summary-value {
  display: block;
  margin-top: 0.35rem;
  color: hsl(var(--card-foreground));
  line-height: 1.5;
}

.payload-view {
  overflow-x: auto;
  padding: 1rem;
  border-radius: 1rem;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 0.82rem;
  line-height: 1.6;
}
</style>
