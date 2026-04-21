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
    ride_accepted: 'Atendimento aceito',
  };

  return labels[type] ?? type.replace(/_/g, ' ');
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

  return notification.title;
}

export function getNotificationSummaryItems(
  notification: NotificationHistoryItem,
): NotificationSummaryItem[] {
  const body = toRecord(notification.body);
  const items: NotificationSummaryItem[] = [];

  pushSummaryItem(items, 'Tipo', getNotificationTypeLabel(notification.type));
  pushSummaryItem(items, 'Canal', notification.channel ?? null);
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
    'Ride ID',
    readNestedValue(body, ['rideId']) ?? readNestedValue(body, ['id']),
  );
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
