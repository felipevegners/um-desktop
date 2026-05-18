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
  total?: string | number;
};

type InvoiceLike = {
  number?: string;
  customer?: {
    customerName?: string;
    document?: string;
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

function sanitizeFileName(name: string): string {
  const safe = name.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
  return safe.length > 0 ? safe : 'fatura';
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
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const logoDataUrl = await loadSvgAsPngDataUrl('/images/logo_horizontal_mono.svg');
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', 390, 30, 155, 48);
  }

  const invoiceNumber = invoice.number || 'FATURA DE SERVIÇOS';
  const customerName = invoice.customer?.customerName || '-';
  const customerDocument = invoice.customer?.document || '-';
  const period = invoice.period || '-';
  const createdAt = formatDate(invoice.createdAt);
  const dueDate = formatDate(invoice.dueDate);
  const items = Array.isArray(invoice.items) ? invoice.items : [];

  const tableRows = items.map((item) => [
    item.code || '-',
    item.user || '-',
    item.branch || '-',
    item.costCenter || '-',
    item.product || '-',
    item.requester || '-',
    item.finishedAt || '-',
    formatCurrency(item.total),
  ]);

  const computedTotal =
    items.length > 0
      ? items.reduce((sum, item) => sum + toNumber(item.total), 0)
      : toNumber(invoice.value);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('FATURA DE SERVIÇOS', 40, 50);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nº ${invoiceNumber}`, 40, 72);

  doc.setDrawColor(220, 220, 220);
  doc.line(40, 86, 555, 86);

  doc.setFont('helvetica', 'bold');
  doc.text('Cliente', 40, 112);
  doc.setFont('helvetica', 'normal');
  doc.text(customerName, 40, 130);
  doc.text(`CNPJ: ${customerDocument}`, 40, 147);

  doc.setFont('helvetica', 'bold');
  doc.text('Período', 320, 112);
  doc.setFont('helvetica', 'normal');
  doc.text(period, 320, 130);
  doc.setFont('helvetica', 'bold');
  doc.text(`Emissão: ${createdAt}`, 320, 147);
  doc.text(`Vencimento: ${dueDate}`, 320, 164);

  autoTable(doc, {
    startY: 190,
    margin: { left: 40, right: 40 },
    head: [
      [
        'Código',
        'Usuário',
        'Filial',
        'CC',
        'Produto',
        'Solicitante',
        'Finalizado em',
        'Valor Total',
      ],
    ],
    body:
      tableRows.length > 0
        ? tableRows
        : [['-', '-', '-', '-', '-', '-', '-', formatCurrency(invoice.value)]],
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 6,
      textColor: [20, 20, 20],
    },
    headStyles: {
      fillColor: [244, 244, 245],
      textColor: [20, 20, 20],
      fontStyle: 'bold',
    },
    bodyStyles: {
      lineColor: [229, 231, 235],
      lineWidth: 0.5,
    },
    theme: 'grid',
    columnStyles: {
      7: { halign: 'right' },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 240;

  doc.setDrawColor(220, 220, 220);
  doc.rect(355, finalY + 16, 200, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Total de itens:', 370, finalY + 38);
  doc.text(String(items.length), 535, finalY + 38, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total da fatura:', 370, finalY + 62);
  doc.text(formatCurrency(invoice.value ?? computedTotal), 535, finalY + 62, {
    align: 'right',
  });

  doc.save(`${sanitizeFileName(invoiceNumber)}.pdf`);
}
