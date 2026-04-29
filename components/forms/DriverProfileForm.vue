<script setup lang="ts">
import AddCarsForm from '@/components/forms/AddCarsForm.vue';
import AddressForm from '@/components/forms/AddressForm.vue';
import FormButtons from '@/components/forms/FormButtons.vue';
import AvatarEdit from '@/components/shared/AvatarEdit.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { driverOffersList } from '@/config/drivers';
import { toTypedSchema } from '@vee-validate/zod';
import { Car, Check, Eye, EyeOff, File, LoaderCircle, Upload, X } from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import * as z from 'zod';
import { dateFormat } from '~/lib/utils';
import { useAccountStore } from '~/stores/account.store';
import { useDriverStore } from '~/stores/drivers.store';

interface Props {
  driverId: string;
  isAdminEditing?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isAdminEditing: false,
});

const { toast } = useToast();

const driverStore = useDriverStore();
const { getDriverByIdAction, updateDriverAction } = driverStore;
const { loadingData, loadingSend, driver } = storeToRefs(driverStore);

const accountStore = useAccountStore();
const { getUsersAccountsByIdAction, updateUserAccountAction } = accountStore;
const { account } = storeToRefs(accountStore);

await getDriverByIdAction(props.driverId);
await getUsersAccountsByIdAction(props.driverId);

onMounted(() => {
  const cnhCopyName = driver.value?.driverFiles?.cnhCopy?.name ?? '';
  const driverStatus = driver.value?.status;

  if (cnhCopyName === '' || driverStatus === 'pending') {
    const targetElement = document.getElementById('files');
    if (targetElement) {
      setTimeout(() => {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }
});

const editDriverCnhCopy = ref(false);
const editDriverAddressCopy = ref(false);
const editDriverBankCopy = ref(false);
const viewPassword = ref<boolean>(true);
const driverSituation = ref<boolean>(false);
const driverCars = ref<any>();
const driverFiles = ref<any>();
const pendingDeleteFiles = ref<Array<{ fileKey?: string; fileUrl?: string }>>([]);

type DriverFileField = 'cnhCopy' | 'addressCopy' | 'bankCopy';

const normalizeFileEntry = (entry?: any) => ({
  name: entry?.name || '',
  url: entry?.url || '',
  key: entry?.key || '',
});

const queueDeleteFile = (entry?: any) => {
  const fileKey = entry?.key || undefined;
  const fileUrl = entry?.url || undefined;
  if (!fileKey && !fileUrl) return;

  const compareValue = fileKey || fileUrl;
  const alreadyQueued = pendingDeleteFiles.value.some(
    (item) => (item.fileKey || item.fileUrl) === compareValue,
  );
  if (!alreadyQueued) {
    pendingDeleteFiles.value.push({ fileKey, fileUrl });
  }
};

const closeEditorForField = (field: DriverFileField) => {
  if (field === 'cnhCopy') editDriverCnhCopy.value = false;
  if (field === 'addressCopy') editDriverAddressCopy.value = false;
  if (field === 'bankCopy') editDriverBankCopy.value = false;
};

const finalizeDriverFileUpload = (field: DriverFileField, uploadedFile?: any) => {
  if (!uploadedFile) return;

  const previous = driverFiles.value?.[field];
  const nextUrl = uploadedFile.ufsUrl || uploadedFile.url || '';
  const nextKey = uploadedFile.key || uploadedFile.fileKey || '';

  if (previous?.url && previous.url !== nextUrl) {
    queueDeleteFile(previous);
  }

  driverFiles.value[field] = {
    name: uploadedFile.name || previous?.name || '',
    url: nextUrl,
    key: nextKey,
  };

  closeEditorForField(field);
};

const removeDriverFile = (field: DriverFileField) => {
  const previous = driverFiles.value?.[field];
  if (!previous?.name && !previous?.url && !previous?.key) return;

  queueDeleteFile(previous);
  driverFiles.value[field] = {
    name: '',
    url: '',
    key: '',
  };
  closeEditorForField(field);
};

const flushPendingDeletes = async () => {
  if (!pendingDeleteFiles?.value?.length) return false;

  const queue = [...pendingDeleteFiles.value];
  pendingDeleteFiles.value = [];
  const results = await Promise.allSettled(
    queue.map((payload) =>
      $fetch('/api/files', {
        method: 'DELETE',
        body: payload,
      }),
    ),
  );

  return results.some((result) => result.status === 'rejected');
};

driverCars.value = driver?.value?.driverCars?.length
  ? driver.value.driverCars
  : [
      {
        carModel: '',
        carColor: '',
        carPlate: '',
        carYear: '',
        carDocumentFile: {
          name: '',
          url: '',
        },
      },
    ];
driverFiles.value = {
  picture: normalizeFileEntry(driver?.value?.driverFiles?.picture),
  cnhCopy: normalizeFileEntry(driver?.value?.driverFiles?.cnhCopy),
  addressCopy: normalizeFileEntry(driver?.value?.driverFiles?.addressCopy),
  bankCopy: normalizeFileEntry(driver?.value?.driverFiles?.bankCopy),
};
const driverProfilePicture = ref({
  name: driver?.value?.driverFiles?.picture?.name || '',
  url: driver?.value?.driverFiles?.picture?.url || '',
  key: driver?.value?.driverFiles?.picture?.key || '',
});

driverSituation.value = driver?.value?.enabled ?? false;

const hasPendingActions = computed(() => {
  return (
    !driverFiles.value?.cnhCopy?.name ||
    !driverFiles.value?.addressCopy?.name ||
    !driverFiles.value?.bankCopy?.name
  );
});

const revealPassword = () => {
  viewPassword.value = !viewPassword.value;
};

const driverSchema = toTypedSchema(
  z.object({
    name: z.string().min(2).max(50),
    email: z.string().min(2).max(50),
    phone: z.string().min(2).max(50),
    pix_key: z.string().max(120).optional(),
    document: z.string().min(2).max(50),
    driverLicense: z.string().min(2).max(50),
    licenseExpiration: z.string({ message: 'Obrigatório' }).min(2).max(50),
    licenseCategory: z.string({ message: 'Obrigatório' }).min(1).max(50),
    zipcode: z.string().min(2).max(50),
    streetName: z.string().min(2).max(50),
    streetNumber: z.string().min(2).max(50),
    complement: z.string().min(0).max(50),
    neighborhood: z.string().min(2).max(50),
    city: z.string().min(2).max(50),
    state: z.string().min(2).max(50),
    oldPassword: z
      .string({ message: 'A senha deve conter de 6 a 8 caracteres' })
      .min(6, { message: 'Mínimo 6 caracteres' })
      .max(8, { message: 'Máximo 8 caracteres' })
      .optional(),
    newPassword: z
      .string({ message: 'A senha deve conter de 6 a 8 caracteres' })
      .min(6, { message: 'Mínimo 6 caracteres' })
      .max(8, { message: 'Máximo 8 caracteres' })
      .optional(),
    actuationArea: z.string().min(2).max(200),
    scheduleOpen: z.boolean(),
    outsideActuation: z.boolean(),
    driverOffers: z.array(z.string()).refine((value) => value.some((item) => item), {
      message: 'You have to select at least one item.',
    }),
  }),
);

const driversForm = useForm({
  validationSchema: driverSchema,
  initialValues: {
    ...driver?.value,
    pix_key: driver?.value?.pix_key || '',
    zipcode: driver?.value?.address?.zipcode,
    streetName: driver?.value?.address?.streetName,
    streetNumber: driver?.value?.address?.streetNumber,
    complement: driver?.value?.address?.complement,
    neighborhood: driver?.value?.address?.neighborhood,
    city: driver?.value?.address?.city,
    state: driver?.value?.address?.state,
    scheduleOpen: driver?.value?.scheduleOpen,
    outsideActuation: driver?.value?.outsideActuation,
    driverOffers: driver?.value?.offers,
  },
});

const onSubmit = driversForm.handleSubmit(async (values) => {
  if (values.newPassword && values.oldPassword === values.newPassword) {
    driversForm.setFieldError(
      'newPassword',
      'As senhas são iguais, verifique e tente novamente!',
    );
    toast({
      title: 'Oops!',
      description: 'A senha atual é igual à nova senha. Verifique e tente novamente!',
      variant: 'destructive',
    });
    return;
  }

  const newDriverData = {
    id: driver?.value?.id,
    name: values.name,
    email: values.email,
    phone: values.phone,
    pix_key: values.pix_key || '',
    document: values.document,
    driverLicense: values.driverLicense,
    licenseExpiration: values.licenseExpiration,
    licenseCategory: values.licenseCategory,
    driverCars: driverCars.value,
    offers: values.driverOffers,
    driverFiles: {
      ...driverFiles.value,
      picture: driverProfilePicture.value,
    },
    address: {
      zipcode: values.zipcode,
      streetName: values.streetName,
      streetNumber: values.streetNumber,
      complement: values.complement,
      neighborhood: values.neighborhood,
      city: values.city,
      state: values.state,
    },
    actuationArea: values.actuationArea,
    scheduleOpen: values.scheduleOpen,
    outsideActuation: values.outsideActuation,
    rating: ['1'],
    history: [],
    status: hasPendingActions ? 'validated' : 'pending',
    enabled: driverSituation.value,
  };

  try {
    const driverResult: any = await updateDriverAction(newDriverData);
    if (!driverResult?.success) {
      toast({
        title: 'Oops!',
        description: driverResult?.error || 'Erro ao atualizar dados do motorista.',
        variant: 'destructive',
      });
      return;
    }

    if (values.newPassword) {
      const currentAccount: any = account.value;
      if (!currentAccount?.id || !currentAccount?.username || !currentAccount?.email) {
        toast({
          title: 'Atenção',
          description: 'Dados do usuário não disponíveis para alterar a senha.',
          variant: 'destructive',
        });
        return;
      }

      await updateUserAccountAction({
        accountId: currentAccount.id,
        username: currentAccount.username,
        email: currentAccount.email,
        role: currentAccount.role,
        enabled: currentAccount.enabled,
        status: currentAccount.status,
        avatar: currentAccount.avatar,
        contract: currentAccount.contract,
        phone: currentAccount.phone,
        position: currentAccount.position,
        department: currentAccount.department,
        document: currentAccount.document,
        birthDate: currentAccount.birthDate,
        address: currentAccount.address,
        acceptTerms: currentAccount.acceptTerms,
        emailConfirmed: currentAccount.emailConfirmed,
        password: values.newPassword,
      });
    }

    const hasDeleteFailures = await flushPendingDeletes();

    if (hasDeleteFailures) {
      toast({
        title: 'Atenção',
        description:
          'Dados salvos, mas alguns arquivos antigos não puderam ser removidos.',
        variant: 'destructive',
      });
    }

    toast({
      title: 'Sucesso!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `O motorista ${values?.name} foi cadastrado com sucesso!`,
    });
    driversForm.values = newDriverData;
    navigateTo('/driver');
  } catch (error) {
    toast({
      title: 'Oops!',
      description: `Ocorreu um erro ${error} ao adicionar o motorista.`,
      variant: 'destructive',
    });
  }
});
</script>

<template>
  <div class="w-full">
    <section
      v-if="loadingData"
      class="p-10 h-40 flex items-center justify-center bg-zinc-200 rounded-md"
    >
      <LoaderCircle :size="48" class="animate-spin" />
    </section>
    <section v-else>
      <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
        <Card class="bg-zinc-200">
          <CardHeader>
            <div class="flex justify-between">
              <div class="flex gap-10 flex-1">
                <AvatarEdit v-model="driverProfilePicture" uploadUrl="driverFiles" />
                <div class="flex flex-col gap-6">
                  <h1 class="mb-2 text-2xl font-bold">
                    {{ driversForm?.values?.name }}
                  </h1>
                  <div class="flex flex-col items-start">
                    <div>
                      <small class="text-zinc-500">Cadastrado em:</small>
                      <p class="mb-2 font-bold">
                        {{ driver && dateFormat(driver.createdAt) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent class="space-y-20">
            <section>
              <h2 class="mb-6 text-lg font-bold">Dados Pessoais</h2>
              <div class="mb-4 w-full grid grid-cols-3 gap-8">
                <FormField v-slot="{ componentField }" name="name">
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="email">
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="phone">
                  <FormItem>
                    <FormLabel>Celular</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        v-bind="componentField"
                        v-maska="'(##) #####-####'"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="document">
                  <FormItem class="col-span-1">
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        v-bind="componentField"
                        v-maska="'###.###.###-##'"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="driverLicense">
                  <FormItem class="col-span-1">
                    <FormLabel>Número CNH</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="ex. 23456789019"
                        v-bind="componentField"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="licenseCategory">
                  <FormItem class="col-span-1">
                    <FormLabel>Categoria CNH</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="licenseExpiration">
                  <FormItem>
                    <FormLabel>Validade CNH</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" v-maska="'##/##/####'" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>
            </section>
            <section>
              <h2 class="mb-6 text-lg font-bold">Endereço e Área de Atuação</h2>
              <AddressForm :edit-mode="false" :form="driversForm" />
              <div class="mb-4 w-full md:grid md:grid-cols-4 gap-8">
                <FormField v-slot="{ componentField }" name="actuationArea">
                  <FormItem class="col-span-1">
                    <FormLabel>Área de atuação (KMs)</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>
            </section>
            <section>
              <h2 class="mb-6 text-lg font-bold">Dados Financeiros</h2>
              <div class="mb-4 w-full md:grid md:grid-cols-4 gap-8">
                <FormField v-slot="{ componentField }" name="pix_key">
                  <FormItem class="col-span-1 md:col-span-2">
                    <FormLabel>Chave Pix</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>
            </section>
            <section>
              <h2 class="mb-6 text-lg font-bold">Senha de Acesso</h2>
              <div class="mb-4 w-full grid grid-cols-2 gap-8">
                <FormField v-slot="{ componentField }" name="oldPassword">
                  <FormItem>
                    <FormLabel>Senha Atual</FormLabel>
                    <FormControl>
                      <div class="relative">
                        <Input
                          :type="viewPassword ? 'password' : 'text'"
                          v-bind="componentField"
                          class="pr-12"
                          placeholder="Insira sua senha atual"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          class="absolute right-1 top-1/2 -translate-y-1/2"
                          @click="revealPassword"
                        >
                          <Eye v-if="viewPassword" :size="20" />
                          <EyeOff v-else :size="20" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="newPassword">
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <div class="relative">
                        <Input
                          :type="viewPassword ? 'password' : 'text'"
                          v-bind="componentField"
                          class="pr-12"
                          placeholder="Insira uma nova senha"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          class="absolute right-1 top-1/2 -translate-y-1/2"
                          @click="revealPassword"
                        >
                          <Eye v-if="viewPassword" :size="20" />
                          <EyeOff v-else :size="20" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>
            </section>
            <section>
              <h2 class="mt-4 mb-6 text-lg font-bold">Atributos / Diferenciais</h2>
              <FormField name="driverOffers">
                <FormItem>
                  <FormField
                    v-for="item in driverOffersList"
                    v-slot="{ value, handleChange }"
                    :key="item.id"
                    type="checkbox"
                    :value="item.id"
                    :unchecked-value="false"
                    name="driverOffers"
                  >
                    <FormItem class="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          @update:checked="handleChange"
                          :checked="value.includes(item.id)"
                        />
                      </FormControl>
                      <FormLabel class="font-normal">
                        {{ item.label }}
                      </FormLabel>
                    </FormItem>
                  </FormField>
                  <FormMessage />
                </FormItem>
              </FormField>
            </section>
            <section class="my-10">
              <h2 class="mb-4 text-lg font-bold flex items-center gap-2">
                <Car :size="24" />
                Meus Veículos
              </h2>
              <Separator class="mb-4" />
              <div class="grid grid-cols-3 gap-8">
                <AddCarsForm v-model="driverCars" class="col-span-3" />
              </div>
            </section>
            <section
              id="files"
              class="my-10"
              :class="`${hasPendingActions ? 'p-6 rounded-md border-2 border-red-500 bg-white' : ''}`"
            >
              <h2 class="mb-4 text-lg font-bold flex items-center gap-2">
                <File />
                Meus Documentos Enviados
              </h2>
              <Separator class="mb-4" />
              <div class="grid grid-cols-3 gap-8">
                <div
                  class="border-2 border-dashed border-gray-300 p-4 rounded-lg flex flex-col gap-4"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="font-bold">CNH (Frente e Verso)</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      @click="editDriverCnhCopy = !editDriverCnhCopy"
                    >
                      <Upload :size="16" />
                    </Button>
                  </div>
                  <div
                    v-if="!editDriverCnhCopy && driverFiles?.cnhCopy?.name"
                    class="space-y-2"
                  >
                    <div class="flex items-center gap-2">
                      <Check class="text-green-500" :size="20" />
                      <span>{{ driverFiles?.cnhCopy?.name }}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      @click="removeDriverFile('cnhCopy')"
                    >
                      <X :size="16" />
                      Remover
                    </Button>
                  </div>
                  <div v-else-if="editDriverCnhCopy" class="space-y-2">
                    <UploadButton
                      class="relative ut-button:bg-zinc-900 ut-button:hover:bg-zinc-700 ut-button:ut-uploading:after:bg-green-500 ut-button:ut-uploading:cursor-not-allowed ut-button:ut-readying:bg-red-500 ut-button:text-sm"
                      :config="{
                        appearance: {
                          container: '!items-start',
                          allowedContent: '!absolute !top-10',
                        },
                        content: {
                          allowedContent({ ready, fileTypes, isUploading }: any) {
                            if (ready) return '';
                            if (isUploading) return 'Enviando seu arquivo, aguarde...';
                          },
                        },
                        endpoint: 'driverFiles',
                        onClientUploadComplete: (files: any) => {
                          finalizeDriverFileUpload('cnhCopy', files?.[0]);
                          toast({
                            title: 'Feito!',
                            class: 'bg-green-500 border-0 text-white text-2xl',
                            description: 'Arquivo enviado com sucesso!',
                          });
                        },
                        onUploadError: (error: any) => {
                          toast({
                            title: 'Oops!',
                            description: `Ocorreu um erro no upload. Tente novamente - ${error.cause}`,
                            variant: 'destructive',
                          });
                        },
                      }"
                    />
                  </div>
                </div>
                <div
                  class="border-2 border-dashed border-gray-300 p-4 rounded-lg flex flex-col gap-4"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="font-bold">Comprovante de Residência</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      @click="editDriverAddressCopy = !editDriverAddressCopy"
                    >
                      <Upload :size="16" />
                    </Button>
                  </div>
                  <div
                    v-if="!editDriverAddressCopy && driverFiles?.addressCopy?.name"
                    class="space-y-2"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <Check class="text-green-500" :size="20" />
                      <span>{{ driverFiles?.addressCopy?.name }}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      @click="removeDriverFile('addressCopy')"
                    >
                      <X :size="16" />
                      Remover
                    </Button>
                  </div>
                  <div v-else-if="editDriverAddressCopy" class="space-y-2">
                    <UploadButton
                      class="relative ut-button:bg-zinc-900 ut-button:hover:bg-zinc-700 ut-button:ut-uploading:after:bg-green-500 ut-button:ut-uploading:cursor-not-allowed ut-button:ut-readying:bg-red-500 ut-button:text-sm"
                      :config="{
                        appearance: {
                          container: '!items-start',
                          allowedContent: '!absolute !top-10',
                        },
                        content: {
                          allowedContent({ ready, fileTypes, isUploading }: any) {
                            if (ready) return '';
                            if (isUploading) return 'Enviando seu arquivo, aguarde...';
                          },
                        },
                        endpoint: 'driverFiles',
                        onClientUploadComplete: (files: any) => {
                          finalizeDriverFileUpload('addressCopy', files?.[0]);
                          toast({
                            title: 'Feito!',
                            class: 'bg-green-500 border-0 text-white text-2xl',
                            description: 'Arquivo enviado com sucesso!',
                          });
                        },
                        onUploadError: (error: any) => {
                          toast({
                            title: 'Oops!',
                            description: `Ocorreu um erro no upload. Tente novamente - ${error.cause}`,
                            variant: 'destructive',
                          });
                        },
                      }"
                    />
                  </div>
                </div>
                <div
                  class="border-2 border-dashed border-gray-300 p-4 rounded-lg flex flex-col gap-4"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="font-bold">Extrato Bancário</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      @click="editDriverBankCopy = !editDriverBankCopy"
                    >
                      <Upload :size="16" />
                    </Button>
                  </div>
                  <div
                    v-if="!editDriverBankCopy && driverFiles?.bankCopy?.name"
                    class="space-y-2"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <Check class="text-green-500" :size="20" />
                      <span>{{ driverFiles?.bankCopy?.name }}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      @click="removeDriverFile('bankCopy')"
                    >
                      <X :size="16" />
                      Remover
                    </Button>
                  </div>
                  <div v-else-if="editDriverBankCopy" class="space-y-2">
                    <UploadButton
                      class="relative ut-button:bg-zinc-900 ut-button:hover:bg-zinc-700 ut-button:ut-uploading:after:bg-green-500 ut-button:ut-uploading:cursor-not-allowed ut-button:ut-readying:bg-red-500 ut-button:text-sm"
                      :config="{
                        appearance: {
                          container: '!items-start',
                          allowedContent: '!absolute !top-10',
                        },
                        content: {
                          allowedContent({ ready, fileTypes, isUploading }: any) {
                            if (ready) return '';
                            if (isUploading) return 'Enviando seu arquivo, aguarde...';
                          },
                        },
                        endpoint: 'driverFiles',
                        onClientUploadComplete: (files: any) => {
                          finalizeDriverFileUpload('bankCopy', files?.[0]);
                          toast({
                            title: 'Feito!',
                            class: 'bg-green-500 border-0 text-white text-2xl',
                            description: 'Arquivo enviado com sucesso!',
                          });
                        },
                        onUploadError: (error: any) => {
                          toast({
                            title: 'Oops!',
                            description: `Ocorreu um erro no upload. Tente novamente - ${error.cause}`,
                            variant: 'destructive',
                          });
                        },
                      }"
                    />
                  </div>
                </div>
              </div>
            </section>
            <FormButtons
              cancel="/profile/me"
              :loading="loadingSend"
              sbm-label="Salvar Dados"
              cnc-label="Cancelar"
            />
          </CardContent>
        </Card>
      </form>
    </section>
  </div>
</template>
