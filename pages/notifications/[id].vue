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
        <button
          type="button"
          class="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-semibold border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
          @click="navigateTo('/notifications')"
        >
          <ArrowLeft class="h-4 w-4" />
          Voltar para notificações
        </button>
        <div v-if="notification" class="space-y-3">
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
          class="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90"
          >Ver atendimento {{ getNotificationRideCode(notification) }}</NuxtLink
        >
        <button
          v-if="!notification.read"
          type="button"
          class="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90"
          @click="markAsRead"
        >
          <LoaderCircle v-if="isMarking" class="h-4 w-4 animate-spin" />
          <CheckCheck v-else class="h-4 w-4" />
          Marcar como lida
        </button>
        <span
          v-else
          class="inline-flex items-center gap-2 text-zinc-500 text-sm font-semibold"
        >
          <MailOpen class="h-4 w-4" />
          Notificação já lida
        </span>
      </div>
    </section>

    <section
      v-if="isLoading"
      class="flex items-center justify-center gap-3 min-h-48 p-8 border border-dashed rounded-xl bg-zinc-50 text-zinc-500"
    >
      <LoaderCircle class="h-5 w-5 animate-spin" />
      Carregando notificação...
    </section>

    <section
      v-else-if="errorMessage"
      class="flex items-center justify-center gap-3 min-h-48 p-8 border border-solid border-red-200 rounded-xl bg-red-50 text-red-600"
    >
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
              class="p-4 rounded-lg bg-zinc-50"
            >
              <span
                class="block text-zinc-500 text-xs font-bold uppercase tracking-wider"
                >{{ item.label }}</span
              >
              <strong class="block mt-1 text-zinc-900 leading-6">{{ item.value }}</strong>
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
          <pre
            class="overflow-x-auto p-4 rounded-lg bg-slate-900 text-slate-200 text-sm leading-6 font-mono"
            >{{ stringifyNotificationBody(notification) }}</pre
          >
        </CardHeader>
        <CardContent>
          <pre class="payload-view">{{ stringifyNotificationBody(notification) }}</pre>
        </CardContent>
      </Card>
    </template>
  </main>
</template>
<style scoped></style>
