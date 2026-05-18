<script setup lang="ts">
import DataTable from '@/components/shared/DataTable.vue';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast/use-toast';
import { Download, LoaderCircle, ReceiptText } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { downloadInvoicePdf } from '~/lib/invoice-pdf';
import { currencyFormat } from '~/lib/utils';

import { getColumns } from './invoice-columns';

type InvoiceListPageProps = {
  title: string;
  description?: string;
  canEdit?: boolean;
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
  showCreateButton: false,
  createButtonLabel: '+ Emitir Fatura',
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

const columns = computed(() =>
  getColumns({
    onPreview: (invoice: any) => {
      previewInvoice.value = invoice;
      showPreviewModal.value = true;
    },
    onEdit: props.canEdit
      ? (invoice: any) => {
          navigateTo(`/admin/finances/invoices/open/${invoice?.id}`);
        }
      : undefined,
    onDownload: async (invoice: any) => {
      try {
        await downloadInvoicePdf(invoice);
      } catch (error) {
        toast({
          title: 'Opss!',
          variant: 'destructive',
          description: 'Não foi possível gerar o PDF da fatura.',
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
          ? 'Não foi possível carregar as faturas.'
          : 'Não foi possível carregar as faturas emitidas.',
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
      description: 'Não foi possível buscar as faturas.',
    });
  }
};

const clearSearch = async () => {
  searchNumber.value = '';
  await handleSearch();
};

const invoiceStats = computed(() => {
  const list = invoices.value || [];

  const open = list.filter((inv: any) => inv?.status === 'open');
  const paid = list.filter((inv: any) => inv?.status === 'paid');

  const toNumber = (v: any) => {
    const n = parseFloat(String(v ?? 0).replace(',', '.'));
    return Number.isNaN(n) ? 0 : n;
  };

  return {
    openCount: open.length,
    openAmount: open.reduce((acc: number, inv: any) => acc + toNumber(inv?.value), 0),
    paidCount: paid.length,
    paidAmount: paid.reduce((acc: number, inv: any) => acc + toNumber(inv?.value), 0),
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
        label="Faturas em Aberto"
        :value="invoiceStats.openCount"
        :sub-value="currencyFormat(invoiceStats.openAmount)"
        variant="warning"
      />
      <SharedStatsCard
        label="Faturas Pagas"
        :value="invoiceStats.paidCount"
        :sub-value="currencyFormat(invoiceStats.paidAmount)"
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
          placeholder="Buscar por número da fatura"
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
        <LoaderCircle class="animate-spin" :size="24" />
      </div>

      <div v-else-if="!invoices.length" class="py-10 text-center text-sm text-zinc-600">
        Nenhuma fatura encontrada.
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

    <Dialog :open="showPreviewModal" @update:open="(value) => (showPreviewModal = value)">
      <DialogContent class="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Preview de Fatura</DialogTitle>
        </DialogHeader>

        <section
          v-if="previewInvoice"
          class="max-h-[70vh] overflow-auto rounded-md border border-zinc-200 bg-white p-8"
        >
          <div
            class="mx-auto w-full max-w-[794px] min-h-[1123px] border border-zinc-200 bg-white p-8"
          >
            <header
              class="mb-8 flex items-start justify-between gap-4 border-b border-zinc-200 pb-4"
            >
              <div>
                <h3 class="text-2xl font-bold">FATURA DE SERVIÇOS</h3>
                <p class="text-sm text-zinc-700">Nº {{ previewInvoice.number }}</p>
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
                <p class="text-sm text-zinc-700">
                  {{ previewInvoice.customer?.customerName }}
                </p>
                <p class="text-sm text-zinc-700">
                  CNPJ: {{ previewInvoice.customer?.document }}
                </p>
              </div>
              <div>
                <p class="font-bold">Período</p>
                <p class="text-sm text-zinc-700">{{ previewInvoice.period }}</p>
                <p class="text-sm">Emissão: {{ formatDate(previewInvoice.createdAt) }}</p>
                <p class="text-sm text-zinc-700">
                  Vencimento: {{ formatDate(previewInvoice.dueDate) }}
                </p>
              </div>
            </section>

            <section>
              <div class="overflow-auto rounded-md border border-zinc-200">
                <table class="w-full text-xs">
                  <thead class="bg-zinc-100">
                    <tr>
                      <th class="p-3 text-left">Código</th>
                      <th class="p-3 text-left">Usuário</th>
                      <th class="p-3 text-left">Filial</th>
                      <th class="p-3 text-left">CC</th>
                      <th class="p-3 text-left">Produto</th>
                      <th class="p-3 text-left">Solicitante</th>
                      <th class="p-3 text-left">Finalizado</th>
                      <th class="p-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in previewInvoice.items"
                      :key="item.rideId"
                      class="border-t border-zinc-200"
                    >
                      <td class="p-3">{{ item.code }}</td>
                      <td class="p-3">{{ item.user }}</td>
                      <td class="p-3">{{ item.branch }}</td>
                      <td class="p-3">{{ item.costCenter }}</td>
                      <td class="p-3">{{ item.product }}</td>
                      <td class="p-3">{{ item.requester }}</td>
                      <td class="p-3">{{ item.finishedAt }}</td>
                      <td class="p-3 text-right font-semibold">
                        {{ currencyFormat(item.total) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="mt-4 flex justify-end">
                <div
                  class="w-full max-w-sm rounded-md border border-zinc-200 bg-zinc-50 p-4"
                >
                  <div class="flex items-center justify-between text-sm">
                    <span>Total de itens:</span>
                    <span>{{
                      Array.isArray(previewInvoice.items)
                        ? previewInvoice.items.length
                        : 0
                    }}</span>
                  </div>
                  <div class="mt-2 flex items-center justify-between text-base font-bold">
                    <span>Total da fatura:</span>
                    <span>{{ currencyFormat(previewInvoice.value) }}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            @click="
              () => {
                showPreviewModal = false;
                downloadInvoicePdf(previewInvoice);
              }
            "
          >
            <Download class="w-4 h-4 mr-1" />
            Baixar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </main>
</template>
