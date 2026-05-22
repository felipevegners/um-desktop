import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type InvoiceItem = {
  rideId?: string;
  code?: string;
  user?: string;
  branch?: string;
  costCenter?: string;
  product?: string;
  requester?: string;
  finishedAt?: string;
  dateTime?: string;
  route?: string;
  tp?: string;
  kme?: string;
  kmePrice?: string;
  he?: string;
  hePrice?: string;
  extraCharges?: string;
  baseTotal?: string | number;
  allocatedTotal?: string | number;
  allocationPercentage?: string | number;
  allocationAreaCode?: string;
  allocationMode?: string;
  splitLabel?: string;
  total?: string | number;
};

type InvoiceLike = {
  number?: string;
  customer?: {
    customerName?: string;
    document?: string;
    areaCode?: string;
    costCenter?: string;
    costCenterCode?: string;
  };
  period?: string;
  createdAt?: string;
  dueDate?: string;
  items?: InvoiceItem[];
  value?: string | number;
};

function formatDate(value?: string): string {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('pt-BR');
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const sanitized = value.replace(/[^0-9,.-]/g, '').trim();
    if (!sanitized) return 0;

    const hasComma = sanitized.includes(',');
    const hasDot = sanitized.includes('.');

    let normalized = sanitized;

    if (hasComma && hasDot) {
      const decimalSeparator =
        sanitized.lastIndexOf(',') > sanitized.lastIndexOf('.') ? ',' : '.';
      const thousandsSeparator = decimalSeparator === ',' ? /\./g : /,/g;
      normalized = sanitized.replace(thousandsSeparator, '');
      if (decimalSeparator === ',') {
        normalized = normalized.replace(',', '.');
      }
    } else if (hasComma) {
      normalized = sanitized.replace(/\./g, '').replace(',', '.');
    } else if (hasDot) {
      const dotParts = sanitized.split('.');
      if (dotParts.length > 2) {
        const decimal = dotParts.pop();
        normalized = `${dotParts.join('')}.${decimal}`;
      } else {
        const decimalLength = dotParts[1]?.length || 0;
        normalized = decimalLength === 3 ? sanitized.replace('.', '') : sanitized;
      }
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatCurrency(value: unknown): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(toNumber(value));
}

function hasSplitAllocation(item: InvoiceItem): boolean {
  const percentage = toNumber(item.allocationPercentage ?? 100);
  const baseTotal = toNumber(item.baseTotal ?? item.total);
  const allocatedTotal = toNumber(item.allocatedTotal ?? item.total);
  return percentage !== 100 || Math.abs(baseTotal - allocatedTotal) > 0.009;
}

function sanitizeFileName(name: string): string {
  const safe = name.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
  return safe.length > 0 ? safe : 'fatura';
}

function resolveInvoiceCostCenterCode(invoice: InvoiceLike): string {
  const customer = invoice.customer || {};
  const customerCostCenter =
    customer.areaCode || customer.costCenter || customer.costCenterCode || null;
  if (customerCostCenter) return String(customerCostCenter);

  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const itemCostCenter =
    items.find((item) => item.allocationAreaCode)?.allocationAreaCode ||
    items.find((item) => item.costCenter)?.costCenter ||
    null;

  return itemCostCenter ? String(itemCostCenter) : '-';
}

async function loadSvgAsPngDataUrl(svgPath: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth || 600;
      canvas.height = image.naturalHeight || 120;

      const context = canvas.getContext('2d');
      if (!context) {
        resolve(null);
        return;
      }

      context.drawImage(image, 0, 0);
      try {
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = svgPath;
  });
}

export async function downloadInvoicePdf(invoice: InvoiceLike): Promise<void> {
  const invoiceNumber = invoice.number || 'FOP';
  const customerName = invoice.customer?.customerName || '-';
  const customerDocument = invoice.customer?.document || '-';
  const customerCostCenter = resolveInvoiceCostCenterCode(invoice);
  const period = invoice.period || '-';
  const createdAt = formatDate(invoice.createdAt);
  const dueDate = formatDate(invoice.dueDate);
  const items = Array.isArray(invoice.items) ? invoice.items : [];

  const columnWidths = [
    72, // Codigo
    126, // Usuario
    132, // Filial
    70, // CC
    95, // Produto
    120, // Solicitante
    82, // Finalizado
    108, // Data e Hora
    270, // Rota
    42, // TP
    54, // KME
    82, // Valor KME
    46, // HE
    82, // Valor HE
    88, // Adicionais
    100, // Valor Total
    108, // Valor Rateado
  ];

  const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  const pageMargin = 24;
  const headerHeight = 156;
  const estimatedRowHeight = 24;
  const estimatedTableHeight = Math.max(48, (items.length + 1) * estimatedRowHeight);
  const splitBannerHeight = items.some((item) => hasSplitAllocation(item)) ? 58 : 0;
  const summaryHeight = 92;

  const pageWidth = pageMargin * 2 + tableWidth;
  const pageHeight =
    pageMargin +
    headerHeight +
    18 +
    estimatedTableHeight +
    14 +
    splitBannerHeight +
    14 +
    summaryHeight +
    pageMargin;

  const doc = new jsPDF({
    unit: 'pt',
    format: [pageWidth, pageHeight],
    orientation: 'landscape',
  });

  const logoDataUrl = await loadSvgAsPngDataUrl('/images/logo_horizontal_mono.svg');
  if (logoDataUrl) {
    const logoProps = doc.getImageProperties(logoDataUrl);
    const maxLogoWidth = 220;
    const maxLogoHeight = 56;
    const logoRatio = logoProps.width / Math.max(1, logoProps.height);

    let logoWidth = maxLogoWidth;
    let logoHeight = logoWidth / logoRatio;
    if (logoHeight > maxLogoHeight) {
      logoHeight = maxLogoHeight;
      logoWidth = logoHeight * logoRatio;
    }

    doc.addImage(
      logoDataUrl,
      'PNG',
      pageWidth - pageMargin - logoWidth,
      20,
      logoWidth,
      logoHeight,
    );
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Fechamento Operacional', pageMargin, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`FOP - ${invoiceNumber}`, pageMargin, 56);

  // doc.setDrawColor(229, 231, 235);
  // doc.line(pageMargin, 68, pageWidth - pageMargin, 68);

  const leftCardX = pageMargin;
  const topCardY = 82;
  const cardGap = 16;
  const cardWidth = (pageWidth - pageMargin * 2 - cardGap) / 2;
  const rightCardX = leftCardX + cardWidth + cardGap;
  const cardHeight = 76;

  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(leftCardX, topCardY, cardWidth, cardHeight, 6, 6, 'S');
  doc.roundedRect(rightCardX, topCardY, cardWidth, cardHeight, 6, 6, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Cliente', leftCardX + 12, topCardY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(String(customerName), leftCardX + 12, topCardY + 34);
  doc.setFont('helvetica', 'bold');
  doc.text('Centro de Custo:', leftCardX + 12, topCardY + 50);
  doc.setFont('helvetica', 'normal');
  doc.text(String(customerCostCenter), leftCardX + 95, topCardY + 50);
  doc.setFont('helvetica', 'bold');
  doc.text('CNPJ:', leftCardX + 12, topCardY + 66);
  doc.setFont('helvetica', 'normal');
  doc.text(String(customerDocument), leftCardX + 46, topCardY + 66);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Período', rightCardX + 12, topCardY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(String(period), rightCardX + 12, topCardY + 34);
  doc.setFont('helvetica', 'bold');
  doc.text('Emissão:', rightCardX + 12, topCardY + 50);
  doc.setFont('helvetica', 'normal');
  doc.text(String(createdAt), rightCardX + 58, topCardY + 50);
  doc.setFont('helvetica', 'bold');
  doc.text('Vencimento:', rightCardX + 12, topCardY + 66);
  doc.setFont('helvetica', 'normal');
  doc.text(String(dueDate), rightCardX + 74, topCardY + 66);

  const tableRows = items.map((item) => [
    item.code || '-',
    item.user || '-',
    item.branch || '-',
    item.costCenter || '-',
    item.product || '-',
    item.requester || '-',
    item.finishedAt || '-',
    item.dateTime || '-',
    item.route || '-',
    item.tp || '-',
    item.kme || '-',
    item.kmePrice || '-',
    item.he || '-',
    item.hePrice || '-',
    item.extraCharges || '-',
    formatCurrency(item.baseTotal ?? item.total),
    formatCurrency(item.allocatedTotal ?? item.total),
  ]);

  const computedTotal =
    items.length > 0
      ? items.reduce((sum, item) => sum + toNumber(item.allocatedTotal ?? item.total), 0)
      : toNumber(invoice.value);

  const computedGrossTotal =
    items.length > 0
      ? items.reduce((sum, item) => sum + toNumber(item.baseTotal ?? item.total), 0)
      : toNumber(invoice.value);

  const splitItemsCount = items.filter((item) => hasSplitAllocation(item)).length;

  autoTable(doc, {
    startY: topCardY + cardHeight + 20,
    margin: { left: pageMargin, right: pageMargin },
    head: [
      [
        'Código',
        'Usuário',
        'Filial',
        'CC',
        'Produto',
        'Solicitante',
        'Finalizado',
        'Data e Hora',
        'Rota',
        'TP',
        'KME',
        'Valor KME',
        'HE',
        'Valor HE',
        'Adicionais',
        'Valor Total',
        'Valor Rateado',
      ],
    ],
    body:
      tableRows.length > 0
        ? tableRows
        : [
            [
              '-',
              '-',
              '-',
              '-',
              '-',
              '-',
              '-',
              '-',
              '-',
              '-',
              '-',
              '-',
              '-',
              '-',
              '-',
              formatCurrency(invoice.value),
              formatCurrency(invoice.value),
            ],
          ],
    styles: {
      font: 'helvetica',
      fontSize: 9.5,
      cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
      textColor: [20, 20, 20],
      overflow: 'ellipsize',
    },
    headStyles: {
      fillColor: [244, 244, 245],
      textColor: [20, 20, 20],
      fontStyle: 'bold',
      fontSize: 9.5,
    },
    bodyStyles: {
      lineColor: [229, 231, 235],
      lineWidth: 0.5,
      fontSize: 9,
    },
    theme: 'grid',
    columnStyles: {
      0: { cellWidth: columnWidths[0] },
      1: { cellWidth: columnWidths[1] },
      2: { cellWidth: columnWidths[2] },
      3: { cellWidth: columnWidths[3], halign: 'center' },
      4: { cellWidth: columnWidths[4] },
      5: { cellWidth: columnWidths[5] },
      6: { cellWidth: columnWidths[6], halign: 'center' },
      7: { cellWidth: columnWidths[7], halign: 'center' },
      8: { cellWidth: columnWidths[8], overflow: 'linebreak' },
      9: { cellWidth: columnWidths[9], halign: 'center' },
      10: { cellWidth: columnWidths[10], halign: 'center' },
      11: { cellWidth: columnWidths[11], halign: 'right' },
      12: { cellWidth: columnWidths[12], halign: 'center' },
      13: { cellWidth: columnWidths[13], halign: 'right' },
      14: { cellWidth: columnWidths[14], halign: 'center' },
      15: { cellWidth: columnWidths[15], halign: 'right' },
      16: { cellWidth: columnWidths[16], halign: 'right' },
    },
    tableWidth,
    pageBreak: 'avoid',
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 240;

  if (splitItemsCount > 0) {
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(251, 191, 36);
    doc.roundedRect(pageMargin, finalY + 16, pageWidth - pageMargin * 2, 46, 4, 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Rateio identificado neste fechamento', pageMargin + 12, finalY + 33);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(
      'Itens rateados: ' +
        String(splitItemsCount) +
        ' | Valor bruto: ' +
        formatCurrency(computedGrossTotal) +
        ' | Valor rateado: ' +
        formatCurrency(computedTotal),
      pageMargin + 12,
      finalY + 48,
    );
  }

  doc.setDrawColor(220, 220, 220);
  const summaryBoxWidth = 320;
  const summaryBoxX = pageWidth - pageMargin - summaryBoxWidth;
  const summaryBoxY = finalY + 16 + (splitItemsCount > 0 ? 58 : 0);
  doc.rect(summaryBoxX, summaryBoxY, summaryBoxWidth, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    'Total de atendimentos',
    summaryBoxX + 14,
    finalY + 38 + (splitItemsCount > 0 ? 58 : 0),
  );
  doc.text(
    String(items.length),
    summaryBoxX + summaryBoxWidth - 14,
    finalY + 38 + (splitItemsCount > 0 ? 58 : 0),
    {
      align: 'right',
    },
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total geral', summaryBoxX + 14, finalY + 62 + (splitItemsCount > 0 ? 58 : 0));
  doc.text(
    formatCurrency(computedTotal),
    summaryBoxX + summaryBoxWidth - 14,
    finalY + 62 + (splitItemsCount > 0 ? 58 : 0),
    {
      align: 'right',
    },
  );

  doc.save(
    `FOP-${sanitizeFileName(customerName)}-${sanitizeFileName(customerCostCenter)}-${sanitizeFileName(invoiceNumber)}.pdf`,
  );
}
