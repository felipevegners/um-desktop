<script setup lang="ts">
import InvoicePreviewTable from '@/components/invoices/InvoicePreviewTable.vue';
import DataTable from '@/components/shared/DataTable.vue';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast/use-toast';
import {
  Download,
  Info,
  LoaderCircle,
  ReceiptText,
  Send,
  ThumbsUp,
} from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { downloadInvoicePdf } from '~/lib/invoice-pdf';
import { currencyFormat } from '~/lib/utils';

import { getColumns } from './invoice-columns';

type InvoiceListPageProps = {
  title: string;
  description?: string;
  canEdit?: boolean;
  allowReviewActions?: boolean;
  showCreateButton?: boolean;
  createButtonLabel?: string;
  createButtonTo?: string;
  contractId?: string;
  previewLogoSrc?: string;
  pageType?: 'admin' | 'corporative';
};

const props = withDefaults(defineProps<InvoiceListPageProps>(), {
  description: '',
  canEdit: false,
  allowReviewActions: false,
  showCreateButton: false,
  createButtonLabel: '+ Criar Fechamento',
  createButtonTo: '',
  contractId: '',
  previewLogoSrc: '/images/logo_horizontal_mono.svg',
  pageType: 'admin',
});

const { toast } = useToast();

const invoicesStore = useInvoicesStore();
const { getInvoicesAction } = invoicesStore;
const { invoices, isLoading, isUpdating } = storeToRefs(invoicesStore);

const searchNumber = ref('');
const previewInvoice = ref<any>(null);
const showPreviewModal = ref(false);
const previewActionMode = ref<'view' | 'adjust'>('view');
const adjustmentComment = ref('');

const normalizeInvoiceStatus = (status: string | undefined | null) => {
  const raw = String(status || '').toLowerCase();
  if (raw === 'approved' || raw === 'paid') return 'approved';
  if (raw === 'rejected' || raw === 'canceled' || raw === 'cancelled') return 'rejected';
  if (raw === 'in_adjustment') return 'in_adjustment';
  return 'pending';
};

const getApprovalDeadlineText = (invoice: any) => {
  const deadline = invoice?.customer?.invoiceApproval?.autoApproveAt;
  if (!deadline) return 'Prazo indisponível';

  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) return 'Prazo indisponível';

  const diffMinutes = Math.max(
    0,
    Math.round((deadlineDate.getTime() - Date.now()) / 60000),
  );
  if (diffMinutes === 0) return 'Vence agora';

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (hours <= 0) return `Expira em ${minutes} min`;
  if (minutes <= 0) return `Expira em ${hours}h`;
  return `Expira em ${hours}h ${minutes}min`;
};

const openPreview = (invoice: any) => {
  previewInvoice.value = invoice;
  previewActionMode.value = 'view';
  adjustmentComment.value = '';
  showPreviewModal.value = true;
};

const closePreview = () => {
  showPreviewModal.value = false;
  previewActionMode.value = 'view';
  adjustmentComment.value = '';
};

const refreshInvoices = async () => {
  await loadInvoices();
};

const previewIsPending = computed(() => {
  return normalizeInvoiceStatus(previewInvoice.value?.status) === 'pending';
});

const handleApprovePreview = async () => {
  if (!previewInvoice.value?.id) return;

  try {
    await invoicesStore.updateInvoiceAction(previewInvoice.value.id, {
      status: 'approved',
    });
    toast({
      title: 'Feito!',
      class: 'bg-green-500 border-0 text-white text-2xl',
      description: 'Fechamento aprovado com sucesso.',
    });
    closePreview();
    await refreshInvoices();
  } catch (error: any) {
    toast({
      title: 'Oops!',
      variant: 'destructive',
      description: error?.data?.message || 'Não foi possível aprovar o fechamento.',
    });
  }
};

const handleRequestAdjustment = async () => {
  if (!previewInvoice.value?.id) return;

  const comment = adjustmentComment.value.trim();
  if (!comment) {
    toast({
      title: 'Opss!',
      variant: 'destructive',
      description: 'Informe o motivo do ajuste antes de enviar.',
    });
    return;
  }

  try {
    await invoicesStore.updateInvoiceAction(previewInvoice.value.id, {
      status: 'in_adjustment',
      adjustmentComment: comment,
      observations: comment,
    });
    toast({
      title: 'Feito!',
      class: 'bg-green-500 border-0 text-white text-2xl',
      description: 'Solicitação de ajuste enviada para o backoffice.',
    });
    closePreview();
    await refreshInvoices();
  } catch (error: any) {
    toast({
      title: 'Oops!',
      variant: 'destructive',
      description: error?.data?.message || 'Não foi possível solicitar o ajuste.',
    });
  }
};

const openAdjustmentMode = async () => {
  previewActionMode.value = 'adjust';
  await nextTick();

  const adjustArea = document.getElementById('adjust-area');
  if (!adjustArea) return;

  adjustArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const columns = computed(() =>
  getColumns({
    onPreview: openPreview,
    onEdit: props.canEdit
      ? (invoice: any) => {
          const editBasePath =
            props.pageType === 'corporative'
              ? '/corporative/finances/invoices/open'
              : '/admin/finances/invoices/open';
          navigateTo(`${editBasePath}/${invoice?.id}`);
        }
      : undefined,
    onDownload: async (invoice: any) => {
      try {
        await downloadInvoicePdf(invoice);
      } catch (error) {
        toast({
          title: 'Opss!',
          variant: 'destructive',
          description: 'Não foi possível gerar o PDF do fechamento.',
        });
      }
    },
  }),
);

const loadInvoices = async () => {
  const query: Record<string, string> = {};
  if (props.contractId) query.contractId = props.contractId;
  if (searchNumber.value) query.number = searchNumber.value;
  await getInvoicesAction(Object.keys(query).length ? query : undefined);
};

onBeforeMount(async () => {
  try {
    await loadInvoices();
  } catch (error) {
    toast({
      title: 'Opss!',
      variant: 'destructive',
      description:
        props.pageType === 'corporative'
          ? 'Não foi possível carregar os fechamentos.'
          : 'Não foi possível carregar os fechamentos emitidos.',
    });
  }
});

const handleSearch = async () => {
  try {
    await loadInvoices();
  } catch (error) {
    toast({
      title: 'Opss!',
      variant: 'destructive',
      description: 'Não foi possível buscar os fechamentos.',
    });
  }
};

const clearSearch = async () => {
  searchNumber.value = '';
  await handleSearch();
};

const invoiceStats = computed(() => {
  const list = invoices.value || [];

  const pending = list.filter((inv: any) =>
    ['pending', 'open'].includes(String(inv?.status || '')),
  );
  const approved = list.filter((inv: any) =>
    ['approved', 'paid'].includes(String(inv?.status || '')),
  );

  const toNumber = (v: any) => {
    const n = parseFloat(String(v ?? 0).replace(',', '.'));
    return Number.isNaN(n) ? 0 : n;
  };

  return {
    pendingCount: pending.length,
    pendingAmount: pending.reduce(
      (acc: number, inv: any) => acc + toNumber(inv?.value),
      0,
    ),
    approvedCount: approved.length,
    approvedAmount: approved.reduce(
      (acc: number, inv: any) => acc + toNumber(inv?.value),
      0,
    ),
    totalCount: list.length,
    totalAmount: list.reduce((acc: number, inv: any) => acc + toNumber(inv?.value), 0),
  };
});

function formatDate(value?: string) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('pt-BR');
}

function resolveInvoiceCostCenterCode(invoice: any): string {
  const customer = invoice?.customer || {};
  const customerCostCenter =
    customer?.areaCode || customer?.costCenter || customer?.costCenterCode || null;
  if (customerCostCenter) return String(customerCostCenter);

  const items = Array.isArray(invoice?.items) ? invoice.items : [];
  const itemCostCenter =
    items.find((item: any) => item?.allocationAreaCode)?.allocationAreaCode ||
    items.find((item: any) => item?.costCenter)?.costCenter ||
    null;

  return itemCostCenter ? String(itemCostCenter) : '-';
}
</script>

<template>
  <main class="p-6">
    <header>
      <SharedBackLink />
    </header>

    <section class="mb-6 flex items-center justify-between gap-6">
      <h1 class="flex items-center gap-2 font-bold text-black text-2xl">
        <ReceiptText :size="24" />
        {{ title }}
      </h1>
      <Button
        v-if="showCreateButton && createButtonTo"
        type="button"
        @click="navigateTo(createButtonTo)"
      >
        {{ createButtonLabel }}
      </Button>
    </section>

    <!-- Stats cards -->
    <section
      v-if="!isLoading && invoices.length > 0"
      class="my-6 grid grid-cols-1 gap-4 md:grid-cols-3"
    >
      <SharedStatsCard
        label="Fechamentos pendentes"
        :value="invoiceStats.pendingCount"
        :sub-value="currencyFormat(invoiceStats.pendingAmount)"
        variant="warning"
      />
      <SharedStatsCard
        label="Fechamentos aprovados"
        :value="invoiceStats.approvedCount"
        :sub-value="currencyFormat(invoiceStats.approvedAmount)"
        variant="success"
      />
      <SharedStatsCard
        label="Total Geral"
        :value="invoiceStats.totalCount"
        :sub-value="currencyFormat(invoiceStats.totalAmount)"
        variant="default"
      />
    </section>

    <section class="mb-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          v-model="searchNumber"
          placeholder="Buscar por número do fechamento"
          class="md:max-w-[320px]"
        />
        <div class="flex items-center gap-2">
          <Button type="button" :disabled="isLoading || isUpdating" @click="handleSearch">
            Buscar
          </Button>
          <Button
            type="button"
            variant="outline"
            :disabled="isLoading || isUpdating"
            @click="clearSearch"
          >
            Limpar
          </Button>
        </div>
      </div>
    </section>

    <section>
      <div v-if="isLoading" class="flex items-center justify-center py-10">
        <LoaderCircle class="animate-spin" :size="48" />
      </div>

      <div v-else-if="!invoices.length" class="py-10 text-center text-sm text-zinc-600">
        Nenhum fechamento encontrado.
      </div>

      <div v-else>
        <DataTable
          :columns="columns"
          :data="invoices"
          :show-filter="false"
          :show-column-select="false"
          :show-pagination="true"
        />
      </div>
    </section>

    <Dialog
      :open="showPreviewModal"
      @update:open="(value) => (value ? (showPreviewModal = value) : closePreview())"
    >
      <DialogContent class="w-[80vw] max-w-[80vw] p-2 sm:p-3 lg:p-4">
        <DialogHeader>
          <div class="flex items-start justify-between gap-4">
            <div>
              <DialogTitle>Preview do Fechamento Operacional</DialogTitle>
              <p v-if="previewInvoice" class="mt-1 text-xs text-zinc-500">
                Nº {{ previewInvoice.number }}
              </p>
            </div>
            <span
              v-if="props.allowReviewActions && previewInvoice"
              class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800"
            >
              {{ getApprovalDeadlineText(previewInvoice) }}
            </span>
          </div>
        </DialogHeader>

        <section
          v-if="previewInvoice"
          class="max-h-[72vh] overflow-auto rounded-md bg-white p-2"
        >
          <div
            class="mx-auto w-full rounded-md border border-zinc-200 bg-white p-2 sm:p-3"
          >
            <header
              class="mb-5 flex items-start justify-between gap-4 border-b border-zinc-200 pb-3"
            >
              <div>
                <h3 class="text-lg font-bold">FECHAMENTO POR PERÍODO</h3>
                <p class="text-sm">Nº {{ previewInvoice.number }}</p>
              </div>
              <img
                :src="previewLogoSrc"
                alt="Urban Mobi"
                class="h-12 w-auto object-contain"
              />
            </header>

            <section class="mb-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="font-bold">Cliente</p>
                <p class="text-sm">
                  {{ previewInvoice.customer?.customerName }}
                </p>
                <p class="text-sm">
                  <strong>Centro de Custo:</strong>
                  {{ resolveInvoiceCostCenterCode(previewInvoice) }}
                </p>
                <p class="text-sm">
                  <strong>CNPJ:</strong> {{ previewInvoice.customer?.document }}
                </p>
              </div>
              <div>
                <p class="font-bold">Período</p>
                <p class="text-sm">{{ previewInvoice.period }}</p>
                <p class="text-sm">
                  <strong>Emissão:</strong> {{ formatDate(previewInvoice.createdAt) }}
                </p>
                <p class="text-sm">
                  <strong>Vencimento:</strong> {{ formatDate(previewInvoice.dueDate) }}
                </p>
              </div>
            </section>

            <InvoicePreviewTable :items="previewInvoice.items || []" />

            <section
              v-if="props.allowReviewActions && previewActionMode === 'adjust'"
              class="mt-6 rounded-lg border border-amber-400 bg-amber-100 p-4"
            >
              <div class="space-y-2" id="adjust-area">
                <p class="font-bold">Solicitação de ajustes</p>
                <textarea
                  v-model="adjustmentComment"
                  rows="4"
                  class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                  placeholder="Descreva o que precisa ser ajustado no fechamento"
                />
              </div>
            </section>
          </div>
        </section>

        <DialogFooter class="flex-col gap-2 sm:flex-row">
          <!-- <Button type="button" variant="outline" @click="closePreview"> Fechar </Button> -->
          <Button
            v-if="props.allowReviewActions && previewActionMode === 'view'"
            type="button"
            :disabled="isUpdating || !previewIsPending"
            class="text-white bg-amber-600 hover:bg-amber-700 hover:text-white"
            @click="openAdjustmentMode"
          >
            <Info />
            Solicitar Ajuste
          </Button>
          <Button
            v-if="props.allowReviewActions && previewActionMode === 'adjust'"
            type="button"
            variant="ghost"
            :disabled="isUpdating"
            @click="previewActionMode = 'view'"
          >
            Cancelar
          </Button>
          <Button
            v-if="props.allowReviewActions && previewActionMode === 'adjust'"
            type="button"
            :disabled="isUpdating || !previewIsPending"
            @click="handleRequestAdjustment"
          >
            <LoaderCircle v-if="isUpdating" class="animate-spin" />
            <Send v-else />
            Enviar
          </Button>
          <Button
            v-if="props.allowReviewActions && previewActionMode === 'view'"
            type="button"
            :disabled="isUpdating || !previewIsPending"
            class="bg-green-600 hover:bg-green-700"
            @click="handleApprovePreview"
          >
            <LoaderCircle v-if="isUpdating" class="animate-spin" />
            <ThumbsUp v-else />
            Aprovar
          </Button>
          <Button
            v-if="!props.allowReviewActions"
            type="button"
            variant="outline"
            :disabled="!previewInvoice"
            @click="previewInvoice && downloadInvoicePdf(previewInvoice)"
          >
            <Download class="w-4 h-4 mr-1" />
            Baixar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </main>
</template>
