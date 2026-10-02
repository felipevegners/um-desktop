import { currencyFormat, formatDateTimePtBR, formatInvoiceUser } from '~/lib/utils';

const csvColumns: Array<{ key: string; label: string }> = [
  { key: 'code', label: 'Código' },
  { key: 'user', label: 'Usuário' },
  { key: 'branch', label: 'Filial' },
  { key: 'costCenter', label: 'CC' },
  { key: 'product', label: 'Produto' },
  { key: 'requester', label: 'Solicitante' },
  { key: 'openedAt', label: 'Aberto em' },
  { key: 'finalizedAt', label: 'Finalizado' },
  { key: 'origin', label: 'Origem' },
  { key: 'destination', label: 'Destino' },
  { key: 'driver', label: 'Motorista' },
  { key: 'tp', label: 'TP' },
  { key: 'kme', label: 'KME' },
  { key: 'kmePrice', label: 'Valor KME' },
  { key: 'he', label: 'HE' },
  { key: 'hePrice', label: 'Valor HE' },
  { key: 'extraCharges', label: 'Adicionais' },
  { key: 'baseTotal', label: 'Valor Total' },
  { key: 'allocatedTotal', label: 'Valor Rateado' },
];

const escapeCsvValue = (value: unknown) => {
  const stringValue = value === null || value === undefined ? '' : String(value);
  if (/[";\r\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return '-';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('pt-BR');
};

const resolveCostCenterCode = (invoice: any) => {
  const customer = invoice?.customer || {};
  const customerCostCenter =
    customer.areaCode || customer.costCenter || customer.costCenterCode || null;
  if (customerCostCenter) return String(customerCostCenter);

  const items = Array.isArray(invoice?.items) ? invoice.items : [];
  const itemCostCenter =
    items.find((item: any) => item?.allocationAreaCode)?.allocationAreaCode ||
    items.find((item: any) => item?.costCenter)?.costCenter ||
    null;

  return itemCostCenter ? String(itemCostCenter) : '-';
};

const buildItemRow = (item: any) => {
  const [routeOrigin = '', ...routeDestinationParts] = String(item?.route || '').split(
    ' -> ',
  );

  return {
    ...item,
    user: formatInvoiceUser(item?.user, Boolean(item?.isVisitor)),
    origin: item?.origin || routeOrigin || '-',
    destination: item?.destination || routeDestinationParts.join(' -> ') || '-',
    driver: item?.driver || '-',
    openedAt: formatDateTimePtBR(item?.openedAt),
    finalizedAt: formatDateTimePtBR(
      item?.finalizedAt ||
        (item?.finishedAt && item?.finishedTime
          ? `${item.finishedAt} - ${item.finishedTime}`
          : item?.finishedAt),
    ),
    baseTotal: currencyFormat(item?.baseTotal ?? item?.total),
    allocatedTotal: currencyFormat(item?.allocatedTotal ?? item?.total),
  };
};

export function downloadInvoiceCsv(invoice: any, fallbackName = 'atendimentos') {
  const items: any[] = Array.isArray(invoice?.items) ? invoice.items : [];
  const customer = invoice?.customer || {};

  const metadataRows = [
    [`Nº ${invoice?.number || '-'}`],
    [],
    ['Cliente', '', '', 'Período'],
    [customer.customerName || '-', '', '', invoice?.period || '-'],
    [
      'Centro de Custo:',
      resolveCostCenterCode(invoice),
      '',
      'Emissão:',
      formatDate(invoice?.createdAt),
    ],
    ['CNPJ:', customer.document || '-', '', 'Vencimento:', formatDate(invoice?.dueDate)],
    [],
  ];

  const tableRows = [
    csvColumns.map((column) => column.label),
    ...items.map((item) => {
      const row: Record<string, any> = buildItemRow(item);
      return csvColumns.map((column) => row[column.key] ?? '');
    }),
  ];

  const csvContent = [...metadataRows, ...tableRows]
    .map((row) => row.map(escapeCsvValue).join(';'))
    .join('\n');

  const blob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `fechamento-UM-${invoice?.number || fallbackName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
