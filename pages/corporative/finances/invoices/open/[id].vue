<script setup lang="ts">
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast/use-toast';
import {
  CheckCircle2,
  LoaderCircle,
  Paperclip,
  ReceiptText,
  Trash,
} from 'lucide-vue-next';
import { storeToRefs } from 'pinia';

definePageMeta({
  middleware: 'sidebase-auth',
  layout: 'admin',
});

useHead({
  title: 'Corporativo - Editar Fechamento | Urban Mobi',
});

const route = useRoute();
const { toast } = useToast();

const invoicesStore = useInvoicesStore();
const { getInvoiceByIdAction, getInvoicesAction, updateInvoiceAction } = invoicesStore;
const { invoice, isLoading, isUpdating, invoices } = storeToRefs(invoicesStore);

const normalizeInvoiceStatus = (status: string | undefined | null) => {
  const raw = String(status || '').toLowerCase();
  if (raw === 'approved' || raw === 'paid') return 'approved';
  if (raw === 'rejected' || raw === 'canceled' || raw === 'cancelled') return 'rejected';
  if (raw === 'in_adjustment') return 'in_adjustment';
  return 'pending';
};

const routeBasePath = computed(() => '/corporative/finances/invoices');

const invoiceStatusOptions = [
  { label: 'Pendente', value: 'pending' },
  { label: 'Aprovado', value: 'approved' },
  { label: 'Recusado', value: 'rejected' },
  { label: 'Em ajuste', value: 'in_adjustment' },
];

const selectedStatus = ref<string>('pending');
const observations = ref<string>('');
const adjustmentComment = ref<string>('');
const currentNfDocument = ref<{ name: string; url: string } | null>(null);
const nfFileInput = ref<HTMLInputElement | null>(null);
const isUploadingNf = ref(false);
const isRemovingNf = ref(false);
const invoiceId = ref<string>('');

const openNfFilePicker = () => {
  nfFileInput.value?.click();
};

const handleNfFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target?.files?.[0];
  if (!file) return;

  try {
    isUploadingNf.value = true;
    const formData = new FormData();
    formData.append('file', file);

    const response = await $fetch<{
      data?: { name?: string; key?: string; url?: string };
    }>('/api/files?endpoint=driverFiles', {
      method: 'POST',
      body: formData,
    });

    const uploaded = response?.data;
    if (!uploaded?.url) {
      throw new Error('upload_missing_url');
    }

    currentNfDocument.value = {
      name: uploaded.name || file.name || 'Documento NF',
      url: uploaded.url,
    };

    toast({
      title: 'Feito!',
      class: 'bg-green-500 border-0 text-white text-2xl',
      description: 'NF enviada com sucesso!',
    });
  } catch (error: any) {
    toast({
      title: 'Oops!',
      variant: 'destructive',
      description: error?.data?.message || 'Erro no upload da NF. Tente novamente.',
    });
  } finally {
    isUploadingNf.value = false;
    if (target) {
      target.value = '';
    }
  }
};

const removeCurrentNf = async () => {
  if (!currentNfDocument.value?.url) return;

  try {
    isRemovingNf.value = true;
    await $fetch('/api/files', {
      method: 'DELETE',
      body: { fileUrl: currentNfDocument.value.url },
    });

    currentNfDocument.value = null;

    toast({
      title: 'Feito!',
      class: 'bg-green-500 border-0 text-white text-2xl',
      description: 'NF removida com sucesso. Voce ja pode anexar outra.',
    });
  } catch (error: any) {
    toast({
      title: 'Oops!',
      variant: 'destructive',
      description: error?.data?.message || 'Nao foi possivel remover a NF.',
    });
  } finally {
    isRemovingNf.value = false;
  }
};

const resolveInvoiceByParam = async () => {
  const idOrNumber = String(route.params.id || '').trim();
  if (!idOrNumber) return;

  const looksLikeObjectId = /^[a-f0-9]{24}$/i.test(idOrNumber);
  if (looksLikeObjectId) {
    try {
      await getInvoiceByIdAction(idOrNumber);
      invoiceId.value = idOrNumber;
      return;
    } catch (error) {
      // fallback by number search
    }
  }

  await getInvoicesAction({ number: idOrNumber });
  const matched = (invoices.value || []).find(
    (item: any) => String(item?.number || '').toLowerCase() === idOrNumber.toLowerCase(),
  );

  if (!matched?.id) {
    throw new Error('invoice_not_found');
  }

  invoiceId.value = matched.id;
  await getInvoiceByIdAction(matched.id);
};

watch(
  () => invoice.value,
  (value) => {
    if (!value) return;
    selectedStatus.value = normalizeInvoiceStatus(value.status);
    observations.value = value.observations || '';
    adjustmentComment.value =
      value?.customer?.invoiceApproval?.lastAdjustmentComment || '';

    const tracking = value?.customer?.invoiceTracking;
    if (tracking?.nfDocument?.url) {
      currentNfDocument.value = {
        name: tracking.nfDocument.name || 'Documento NF',
        url: tracking.nfDocument.url,
      };
    } else {
      currentNfDocument.value = null;
    }
  },
  { immediate: true },
);

const saveInvoice = async () => {
  if (!invoiceId.value) {
    toast({
      title: 'Opss!',
      variant: 'destructive',
      description: 'Fechamento nao encontrado para atualizacao.',
    });
    return;
  }

  try {
    await updateInvoiceAction(invoiceId.value, {
      status: selectedStatus.value,
      observations: observations.value,
      adjustmentComment: adjustmentComment.value,
      nfDocument: currentNfDocument.value ?? null,
    });

    toast({
      title: 'Sucesso!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: 'Fechamento atualizado com sucesso.',
    });

    await navigateTo(routeBasePath.value);
  } catch (error) {
    toast({
      title: 'Opss!',
      variant: 'destructive',
      description: 'Nao foi possivel salvar o fechamento.',
    });
  }
};

onBeforeMount(async () => {
  try {
    await resolveInvoiceByParam();
  } catch (error) {
    toast({
      title: 'Opss!',
      variant: 'destructive',
      description: 'Fechamento nao encontrado.',
    });
    await navigateTo(routeBasePath.value);
  }
});
</script>

<template>
  <main class="p-6">
    <header>
      <SharedBackLink />
    </header>

    <section class="mb-6 flex items-center gap-6">
      <h1 class="flex items-center gap-2 font-bold text-black text-2xl">
        <ReceiptText :size="24" />
        Revisar Fechamento
      </h1>
    </section>

    <section class="rounded-md border border-zinc-200 bg-white p-4">
      <div v-if="isLoading" class="flex items-center justify-center py-10">
        <LoaderCircle class="animate-spin" :size="24" />
      </div>

      <div v-else-if="!invoice" class="py-10 text-center text-sm text-zinc-600">
        Fechamento nao encontrado.
      </div>

      <div v-else class="space-y-6">
        <div>
          <Label class="mb-2 block">Numero do fechamento</Label>
          <Input :model-value="invoice.number" disabled />
        </div>

        <div>
          <Label class="mb-2 block">Status</Label>
          <select
            v-model="selectedStatus"
            class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            <option
              v-for="option in invoiceStatusOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>

        <div>
          <Label class="mb-2 block">Observacoes</Label>
          <textarea
            v-model="observations"
            rows="4"
            class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            placeholder="Observacoes do fechamento"
          />
        </div>

        <div>
          <Label class="mb-2 block">Pontos de ajuste</Label>
          <textarea
            v-model="adjustmentComment"
            rows="4"
            class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            placeholder="Descreva ajustes solicitados (quando status for Em ajuste)"
          />
        </div>

        <div class="space-y-2">
          <Label class="block">Anexar NF</Label>
          <input
            ref="nfFileInput"
            type="file"
            class="hidden"
            accept=".pdf,image/*"
            @change="handleNfFileSelected"
          />
          <Button
            type="button"
            class="bg-zinc-900 hover:bg-zinc-700 text-white"
            :disabled="isUploadingNf || isRemovingNf || !!currentNfDocument?.url"
            @click="openNfFilePicker"
          >
            <LoaderCircle v-if="isUploadingNf" class="mr-2 h-4 w-4 animate-spin" />
            <Paperclip v-else class="mr-2 h-4 w-4" />
            {{ isUploadingNf ? 'Enviando arquivo, aguarde...' : 'Selecionar NF' }}
          </Button>
          <p
            v-if="currentNfDocument?.url"
            class="flex items-center gap-1 text-xs text-green-700"
          >
            <CheckCircle2 class="h-4 w-4" />
            NF anexada com sucesso.
          </p>
          <div v-if="currentNfDocument?.url" class="flex items-center gap-2">
            <a
              :href="currentNfDocument.url"
              target="_blank"
              class="text-xs text-blue-600 underline"
            >
              Ver NF ({{ currentNfDocument.name }})
            </a>
            <Button
              type="button"
              variant="ghost"
              class="h-7 px-2 text-red-600"
              :disabled="isRemovingNf"
              @click="removeCurrentNf"
            >
              <LoaderCircle v-if="isRemovingNf" class="mr-1 h-4 w-4 animate-spin" />
              <Trash v-else class="mr-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
    <section class="py-6">
      <div class="flex items-center gap-2">
        <Button type="button" :disabled="isUpdating" @click="saveInvoice">
          <LoaderCircle v-if="isUpdating" class="mr-2 animate-spin" :size="16" />
          Salvar alteracoes
        </Button>
        <Button type="button" variant="outline" @click="navigateTo(routeBasePath)">
          Cancelar
        </Button>
      </div>
    </section>
  </main>
</template>
