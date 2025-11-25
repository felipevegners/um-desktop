<script setup lang="ts">
import BackLink from '@/components/shared/BackLink.vue';
import CurrencyInput from '@/components/shared/CurrencyInput.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import { useToast } from '@/components/ui/toast';
import { productTypes } from '@/config/products';
import { getProductsService, updtateProductService } from '@/server/services/products';
import { useFilesStore } from '@/stores/files.store';
import { toTypedSchema } from '@vee-validate/zod';
import { Box, LoaderCircle, Trash, X } from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import * as z from 'zod';

const filesStore = useFilesStore();
const { deleteFileAction } = filesStore;

const { toast } = useToast();

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

defineOptions({
  name: 'Products',
});

useHead({
  title: 'Backoffice - Editar Produto | Urban Mobi',
});

const isLoading = ref<boolean>(false);
const isLoadingSend = ref<boolean>(false);
const loadingFileData = ref<boolean>(false);
const productSituation = ref<boolean>(true);
const productType = ref<string>('');
const product = ref<any>();
const productImage = ref<any>();

const route = useRoute();

const fetchData = async () => {
  try {
    isLoading.value = true;
    return await getProductsService(route.params.id as string);
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao carregar os produtos. Tente novamente.`,
    });
    throw error;
  } finally {
    isLoading.value = false;
  }
};

product.value = await fetchData();
productType.value = product?.value.type;
productSituation.value = product?.value.enabled;
productImage.value = product.value.image;

const dynamicSchema = computed(() => {
  let baseSchema = z.object({
    code: z
      .string({ message: '*Obrigatório' })
      .min(1, 'Insira pelo menos 1 caracter')
      .max(10, 'Máximo 10 caracteres'),
    name: z
      .string({ message: '*Obrigatório' })
      .min(2, 'Insira um nome com mais de 2 caracteres')
      .max(50, 'O nome deve conter no máximo 50 caracteres'),
    description: z.string().optional(),
    type: z.string({ message: '*Obrigatório' }),
    basePrice: z.string({ message: '*Obrigatório' }).min(1),
    includedHours: z.string({ message: '*Obrigatório' }).min(1),
    includedKms: z.any().optional(),
    category: z.any().optional(),
    capacity: z.number({ message: '*Obrigatório' }).min(1),
    kmPrice: z.string({ message: '*Obrigatório' }).min(1),
    minutePrice: z.string({ message: '*Obrigatório' }).min(1),
  });

  if (product.value.type === 'addon') {
    //@ts-expect-error
    baseSchema = baseSchema.extend({
      capacity: z.any().optional(),
      kmPrice: z.any().optional(),
      minutePrice: z.any().optional(),
      includedHours: z.any().optional(),
      includedKms: z.any().optional(),
    });
  }

  return toTypedSchema(baseSchema);
});

const form = useForm({
  validationSchema: dynamicSchema,
  initialValues: {
    ...product.value,
    basePrice: product?.value.basePrice.replace('.', ','),
    kmPrice: product?.value.kmPrice?.replace('.', ',') || null,
    minutePrice: product?.value.minutePrice?.replace('.', ',') || null,
    includedHours: product?.value.includedHours || null,
    includedKms: product?.value.includedKms || null,
    category: product?.value.category || null,
    capacity: product?.value.capacity || null,
  },
});

const onSubmit = form.handleSubmit(async (values) => {
  isLoadingSend.value = true;
  const updatedProductData = {
    ...product.value,
    image: {
      name: productImage?.value.name,
      url: productImage?.value.url,
    },
    id: product.value.id,
    code: values.code,
    name: values.name,
    capacity: values.capacity,
    category: values.category,
    description: values.description,
    basePrice: values.basePrice?.replace('.', '').replace(',', '.'),
    includedHours: values.includedHours || '0',
    includedKms: values.includedKms || 0,
    kmPrice: values.kmPrice.replace(',', '.'),
    minutePrice: values.minutePrice.replace(',', '.'),
    enabled: productSituation.value,
  };
  try {
    await updtateProductService(updatedProductData);
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Produto alterado com sucesso!`,
    });
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao alterar dados do produto. Tente novamente.`,
    });
  } finally {
    isLoadingSend.value = false;
    navigateTo('/admin/configurations/products');
  }
});

const deleteFile = async (url: string) => {
  loadingFileData.value = true;
  try {
    await deleteFileAction(url);
  } catch (error) {
    toast({
      title: 'Oops!',
      description: `A imagem não pode ser removida. Tente novamente.`,
      variant: 'destructive',
    });
  } finally {
    toast({
      title: 'Feito!',
      class: 'bg-green-500 border-0 text-white text-2xl',
      description: `A imagem foi removida com sucesso!`,
    });
    productImage.value.name = '';
    productImage.value.url = '';
    loadingFileData.value = false;
  }
};
</script>
<template>
  <main class="p-6">
    <header>
      <BackLink />
    </header>
    <section class="mb-6 flex items-center justify-between">
      <h1 class="flex items-center gap-4 text-3xl font-bold">
        <Box :size="32" />
        Editar Produto
      </h1>
      <div class="flex gap-10 items-center">
        <div>
          <Label class="text-md font-bold"> Desativar Produto </Label>
          <div class="mt-2 flex items-center gap-3">
            <Label class="text-sm text-zinc-500"> Inativo </Label>
            <Switch
              v-model:checked="productSituation"
              class="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
            />
            <Label class="text-sm text-zinc-500"> Ativo </Label>
          </div>
        </div>
        <Button variant="destructive" @click="">
          <Trash class="w-4 h-4" /> Excluir Produto
        </Button>
      </div>
    </section>
    <section class="mb-4 py-4">
      <Card
        v-if="isLoading"
        class="bg-zinc-200 p-10 h-[300px] flex items-center justify-center"
      >
        <LoaderCircle class="w-10 h-10 animate-spin" />
      </Card>
      <Card v-else class="bg-zinc-200">
        <CardHeader>
          <CardTitle>
            <h3 class="text-sm text-zinc-500">Editando produto</h3>
            <span class="uppercase">{{ product?.code }} - {{ product?.name }}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
            <div
              v-if="product?.type !== 'addon'"
              class="mb-6 flex flex-col gap-4 items-start justify-start"
            >
              <div class="relative">
                <p class="mb-2 font-bold">Imagem</p>
                <NuxtImg
                  :src="productImage?.url"
                  loading="lazy"
                  placeholder="/images/no-image.png"
                  class="w-[200px] h-[240px] rounded-md object-contain bg-white"
                  v-slot="{ src, isLoaded, imgAttrs }"
                  preload
                  :custom="true"
                >
                  <img v-if="isLoaded" v-bind="imgAttrs" :src="src" />
                  <div v-else class="rounded-md flex items-center justify-center">
                    <img v-bind="imgAttrs" src="/images/no-image.png" />
                  </div>
                </NuxtImg>
              </div>
              <div class="flex flex-col items-center border w-[200px]">
                <div class="flex" v-if="!productImage?.name">
                  <UploadButton
                    class="relative ut-button:bg-zinc-900 ut-button:hover:bg-zinc-700 ut-button:ut-uploading:after:bg-green-500 ut-button:ut-uploading:cursor-not-allowed ut-button:ut-readying:bg-red-500"
                    :config="{
                      appearance: {
                        container: '!items-start',
                        allowedContent: '!absolute !top-10',
                      },
                      content: {
                        allowedContent({ ready, fileTypes, isUploading }) {
                          if (ready) return '';
                          if (isUploading) return 'Enviando seu arquivo, aguarde...';
                        },
                      },
                      endpoint: 'productImage',
                      onClientUploadComplete: (file) => {
                        productImage.name = file[0]?.name;
                        productImage.url = file[0]?.ufsUrl;
                      },
                      onUploadError: (error) => {
                        toast({
                          title: 'Ooops!',
                          class: 'bg-red-500 border-0 text-white text-2xl',
                          description: `Erro ao enviar o arquivo. Tente novamente. ${error.cause}`,
                        });
                      },
                    }"
                  />
                </div>
                <div>
                  <Button
                    type="button"
                    variant="ghost"
                    @click.prevent="deleteFile(productImage?.url)"
                  >
                    <X />
                    Remover Imagem
                  </Button>
                </div>
              </div>
            </div>
            <Separator class="my-6 border-b border-b-zinc-300" />
            <div class="mb-4 md:grid md:grid-cols-3 md:gap-6">
              <FormField v-slot="{ componentField }" name="type">
                <FormItem>
                  <FormLabel>Tipo de Cobrança</FormLabel>
                  <FormControl>
                    <FormSelect
                      :items="productTypes"
                      v-model="productType"
                      label="Selecione o tipo"
                      v-bind="componentField"
                      :disabled="true"
                    />
                    <FormMessage />
                  </FormControl>
                </FormItem>
              </FormField>
            </div>
            <div class="mb-4 md:grid md:grid-cols-3 md:gap-6">
              <FormField v-slot="{ componentField }" name="code">
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input type="text" v-bind="componentField" />
                    <FormMessage />
                  </FormControl>
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="name">
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input type="text" v-bind="componentField" />
                    <FormMessage />
                  </FormControl>
                </FormItem>
              </FormField>
              <FormField
                v-if="product?.type !== 'addon'"
                v-slot="{ componentField }"
                name="capacity"
              >
                <FormItem>
                  <FormLabel>Capacidade</FormLabel>
                  <FormControl>
                    <Input type="number" v-bind="componentField" />
                    <FormMessage />
                  </FormControl>
                </FormItem>
              </FormField>
              <FormField
                v-if="product?.type !== 'addon'"
                v-slot="{ componentField }"
                name="category"
              >
                <FormItem>
                  <FormLabel> Categoria </FormLabel>
                  <FormControl>
                    <Input type="text" v-bind="componentField" />
                    <FormMessage />
                  </FormControl>
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="description">
                <FormItem>
                  <FormLabel>
                    Descrição
                    <small class="text-muted-foreground">*opcional</small>
                  </FormLabel>
                  <FormControl>
                    <Input type="text" v-bind="componentField" />
                    <FormMessage />
                  </FormControl>
                </FormItem>
              </FormField>
            </div>
            <div
              class="p-6 border-2 border-zinc-700 rounded-md"
              v-if="productType === 'contract'"
            >
              <h3 class="mb-4 font-bold text-lg">Editar Valores</h3>
              <div class="md:grid md:grid-cols-4 gap-4">
                <FormField v-slot="{ componentField }" name="basePrice">
                  <CurrencyInput :componentField="componentField" label="Valor Base" />
                </FormField>
                <FormField v-slot="{ componentField }" name="includedHours">
                  <FormItem>
                    <FormLabel>Franquia Horas</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                      <FormMessage />
                    </FormControl>
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="includedKms">
                  <FormItem>
                    <FormLabel>Franquia KMs</FormLabel>
                    <FormControl>
                      <Input type="number" v-bind="componentField" />
                      <FormMessage />
                    </FormControl>
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="kmPrice">
                  <CurrencyInput
                    :componentField="componentField"
                    label="Valor KM Adicional"
                  />
                </FormField>
                <FormField v-slot="{ componentField }" name="minutePrice">
                  <CurrencyInput
                    :componentField="componentField"
                    label="Valor Minuto Adicional"
                  />
                </FormField>
                <div v-if="product?.type !== 'addon'"></div>
              </div>
            </div>
            <div
              v-if="
                productType === 'free' ||
                productType === 'free-km' ||
                productType === 'addon'
              "
              class="p-6 border-2 border-zinc-700 rounded-md"
            >
              <h3 class="mb-4 font-bold text-lg">Editar Valores</h3>

              <div class="md:grid md:grid-cols-4 gap-4">
                <FormField v-slot="{ componentField }" name="basePrice">
                  <CurrencyInput :componentField="componentField" label="Valor Base" />
                </FormField>

                <FormField
                  v-if="productType !== 'addon'"
                  v-slot="{ componentField }"
                  name="kmPrice"
                >
                  <CurrencyInput :componentField="componentField" label="Valor KM" />
                </FormField>
                <FormField
                  v-if="productType !== 'addon'"
                  v-slot="{ componentField }"
                  name="minutePrice"
                >
                  <CurrencyInput :componentField="componentField" label="Valor Minuto" />
                </FormField>
              </div>
            </div>
            <div class="mt-6">
              <Button type="submit">
                <LoaderCircle v-if="isLoadingSend" class="w-10 h-10 animate-spin" />
                Salvar Alterações
              </Button>
              <Button
                variant="ghost"
                class="ml-4"
                @click.prevent="navigateTo('/admin/configurations/products')"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  </main>
</template>

<style scoped></style>
