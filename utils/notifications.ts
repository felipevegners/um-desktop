export type NotificationHistoryItem = {
  id: string;
  type: string;
  title: string;
  body: Record<string, unknown> | null;
  userId?: string | null;
  driverId?: string | null;
  contractId?: string | null;
  roles: string[];
  channel?: string | null;
  status?: string | null;
  sentAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  read?: boolean | null;
};

type NotificationSummaryItem = {
  label: string;
  value: string;
};

export type NotificationRideContext = {
  userName: string | null;
  requesterName: string | null;
  driverName: string | null;
  origin: string | null;
  destination: string | null;
  stops: string[];
  product: string | null;
  branchName: string | null;
  area: string | null;
  reason: string | null;
};

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function toDisplayValue(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return null;
}

function readNestedValue(
  source: Record<string, unknown> | null,
  path: string[],
): string | null {
  let current: unknown = source;

  for (const segment of path) {
    const next = toRecord(current);

    if (!next || !(segment in next)) {
      return null;
    }

    current = next[segment];
  }

  return toDisplayValue(current);
}

function pushSummaryItem(
  items: NotificationSummaryItem[],
  label: string,
  value: string | null | undefined,
) {
  if (!value) {
    return;
  }

  items.push({ label, value });
}

function readTravelStopLabels(body: Record<string, unknown> | null): string[] {
  const travel = body && 'travel' in body ? toRecord(body.travel) : null;

  if (!travel || !Array.isArray(travel.stops)) {
    return [];
  }

  return travel.stops
    .map((stop) => {
      if (typeof stop === 'string') {
        const trimmed = stop.trim();
        return trimmed.length > 0 ? trimmed : null;
      }

      const stopRecord = toRecord(stop);
      if (!stopRecord) {
        return null;
      }

      return (
        toDisplayValue(stopRecord.address) ??
        toDisplayValue(stopRecord.description) ??
        toDisplayValue(stopRecord.name)
      );
    })
    .filter((value): value is string => Boolean(value));
}

export function formatNotificationDate(value?: string | null): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function getNotificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    ride_created: 'Atendimento criado',
    ride_assigned: 'Atendimento atribuído',
    ride_accepted: 'Atendimento aceito',
    ride_cancelled: 'Atendimento cancelado',
    commission_paid: 'Comissão paga',
    invoice_pending_approval: 'Fechamento pendente',
    invoice_approved: 'Fechamento aprovado',
    invoice_rejected: 'Fechamento recusado',
    invoice_adjustment_requested: 'Fechamento em ajuste',
    invoice_auto_approved: 'Fechamento autoaprovado',
  };

  return labels[type] ?? type.replace(/_/g, ' ');
}

export function getNotificationChannelLabel(
  notification: NotificationHistoryItem,
): string {
  const rawChannel = String(notification.channel ?? '')
    .trim()
    .toLowerCase();

  if (rawChannel === 'driver-app' || rawChannel === 'driver_app') {
    return 'Driver App';
  }

  if (rawChannel === 'backoffice') {
    return 'Backoffice';
  }

  const body = toRecord(notification.body);
  const createdByRole = readNestedValue(body, ['createdBy', 'role']);

  if (notification.type === 'ride_accepted' || createdByRole === 'platform-driver') {
    return 'Driver App';
  }

  return 'Backoffice';
}

export function getNotificationRideContext(
  notification: NotificationHistoryItem,
): NotificationRideContext {
  const body = toRecord(notification.body);

  return {
    userName:
      readNestedValue(body, ['user', 'name']) ??
      readNestedValue(body, ['user', 'username']),
    requesterName:
      readNestedValue(body, ['createdBy', 'name']) ??
      readNestedValue(body, ['createdBy', 'email']),
    driverName:
      readNestedValue(body, ['driver', 'name']) ??
      readNestedValue(body, ['driverName']) ??
      readNestedValue(body, ['acceptedBy', 'name']) ??
      readNestedValue(body, ['driverEmail']),
    origin:
      readNestedValue(body, ['travel', 'originAddress']) ??
      readNestedValue(body, ['travel', 'origin', 'address']) ??
      readNestedValue(body, ['travel', 'origin', 'description']) ??
      readNestedValue(body, ['travel', 'origin', 'name']) ??
      readNestedValue(body, ['travel', 'origin']),
    destination:
      readNestedValue(body, ['travel', 'destinationAddress']) ??
      readNestedValue(body, ['travel', 'destination', 'address']) ??
      readNestedValue(body, ['travel', 'destination', 'description']) ??
      readNestedValue(body, ['travel', 'destination', 'name']) ??
      readNestedValue(body, ['travel', 'destination']),
    stops: readTravelStopLabels(body),
    product:
      readNestedValue(body, ['product', 'name']) ??
      readNestedValue(body, ['product', 'code']),
    branchName:
      readNestedValue(body, ['billing', 'paymentData', 'branchName']) ??
      readNestedValue(body, ['contract', 'branchName']),
    area:
      readNestedValue(body, ['billing', 'paymentData', 'area']) ??
      readNestedValue(body, ['billing', 'paymentData', 'areaName']) ??
      readNestedValue(body, ['billing', 'paymentData', 'areaCode']) ??
      readNestedValue(body, ['user', 'contract', 'area']),
    reason:
      readNestedValue(body, ['reason', 'name']) ??
      readNestedValue(body, ['reason', 'description']) ??
      readNestedValue(body, ['reason']),
  };
}

export function isRideNotification(notification: NotificationHistoryItem): boolean {
  return notification.type.startsWith('ride_');
}

export function getNotificationRideStatus(
  notification: NotificationHistoryItem,
): string | null {
  const body = toRecord(notification.body);

  return (
    readNestedValue(body, ['status']) ??
    readNestedValue(body, ['progress', 'status']) ??
    null
  );
}

export function getNotificationDescription(
  notification: NotificationHistoryItem,
): string {
  const body = toRecord(notification.body);
  const message =
    readNestedValue(body, ['message']) ??
    readNestedValue(body, ['description']) ??
    readNestedValue(body, ['html']);
  const code = readNestedValue(body, ['code']);
  const driverEmail = readNestedValue(body, ['driverEmail']);

  if (message) {
    return message;
  }

  if (notification.type === 'ride_created' && code) {
    return `O atendimento ${code} foi criado e ficou disponível no histórico.`;
  }

  if (notification.type === 'ride_accepted' && code) {
    return driverEmail
      ? `O motorista ${driverEmail} aceitou o atendimento ${code}.`
      : `O atendimento ${code} foi aceito pelo motorista.`;
  }

  if (notification.type === 'ride_cancelled' && code) {
    const body = toRecord(notification.body);
    const cancelledBy =
      readNestedValue(body, ['createdBy', 'name']) ??
      readNestedValue(body, ['createdBy', 'email']);

    return cancelledBy
      ? `${cancelledBy} cancelou o atendimento ${code}.`
      : `O atendimento ${code} foi cancelado.`;
  }

  if (notification.type === 'invoice_pending_approval') {
    return 'Um novo fechamento foi gerado e aguarda aprovação.';
  }

  if (notification.type === 'invoice_adjustment_requested') {
    return 'Foram solicitados ajustes no fechamento.';
  }

  if (notification.type === 'invoice_approved') {
    return 'O fechamento foi aprovado.';
  }

  if (notification.type === 'invoice_rejected') {
    return 'O fechamento foi recusado.';
  }

  if (notification.type === 'invoice_auto_approved') {
    return 'O fechamento foi autoaprovado após 24h úteis sem ação.';
  }

  return notification.title;
}

export function getNotificationSummaryItems(
  notification: NotificationHistoryItem,
): NotificationSummaryItem[] {
  const body = toRecord(notification.body);
  const items: NotificationSummaryItem[] = [];

  pushSummaryItem(items, 'Tipo', getNotificationTypeLabel(notification.type));
  pushSummaryItem(items, 'Canal', getNotificationChannelLabel(notification));
  pushSummaryItem(items, 'Status', notification.status ?? null);
  pushSummaryItem(
    items,
    'Contrato',
    notification.contractId ??
      readNestedValue(body, ['billing', 'paymentData', 'contractId']) ??
      readNestedValue(body, ['user', 'contract', 'contractId']),
  );
  pushSummaryItem(items, 'Atendimento', readNestedValue(body, ['code']));
  pushSummaryItem(
    items,
    'Motorista',
    notification.driverId ??
      readNestedValue(body, ['driverId']) ??
      readNestedValue(body, ['driver', 'id']) ??
      readNestedValue(body, ['driverEmail']),
  );
  pushSummaryItem(
    items,
    'Solicitante',
    readNestedValue(body, ['createdBy', 'email']) ??
      readNestedValue(body, ['createdBy', 'name']) ??
      readNestedValue(body, ['user', 'name']),
  );

  return items;
}

export function getNotificationSearchText(notification: NotificationHistoryItem): string {
  return [
    notification.title,
    notification.type,
    getNotificationDescription(notification),
    notification.contractId,
    notification.driverId,
    ...getNotificationSummaryItems(notification).map((item) => item.value),
    JSON.stringify(notification.body ?? {}),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function stringifyNotificationBody(notification: NotificationHistoryItem): string {
  return JSON.stringify(notification.body ?? {}, null, 2);
}

export function getNotificationRideCode(
  notification: NotificationHistoryItem,
): string | null {
  const body = toRecord(notification.body);
  return readNestedValue(body, ['code']);
}
