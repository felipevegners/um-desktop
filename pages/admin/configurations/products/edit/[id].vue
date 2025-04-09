<script setup lang="ts">
import BackLink from '@/components/shared/BackLink.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import { useToast } from '@/components/ui/toast';
import { getProductsService } from '@/server/services/services';
import { useFilesStore } from '@/stores/admin/files.store';
import { toTypedSchema } from '@vee-validate/zod';
import { Box, CircleX, LoaderCircle, Paperclip, Trash } from 'lucide-vue-next';
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
productImage.value = product.value.image || { name: '', url: '' };

const formSchema = toTypedSchema(
  z.object({
    code: z
      .string({ message: '*Obrigatório' })
      .min(1, 'Insira pelo menos 1 caracter')
      .max(10, 'Máximo 10 caracteres'),
    name: z
      .string({ message: '*Obrigatório' })
      .min(2, 'Insira um nome com mais de 2 caracteres')
      .max(50, 'O nome deve conter no máximo 50 caracteres'),
    capacity: z.number({ message: '*Obrigatório' }).min(0),
    type: z.string({ message: '*Obrigatório' }),
    basePrice: z.string({ message: '*Obrigatório' }).min(0),
    includedHours: z.string({ message: '*Obrigatório' }).min(0).optional(),
    includedKms: z.number({ message: '*Obrigatório' }).min(0).optional(),
    kmPrice: z.string({ message: '*Obrigatório' }).min(0),
    minutePrice: z.string({ message: '*Obrigatório' }).min(0),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    ...product.value,
    basePrice: product?.value.basePrice.replace('.', ','),
    kmPrice: product?.value.kmPrice.replace('.', ','),
    minutePrice: product?.value.minutePrice.replace('.', ','),
    includedHours: product?.value.includedHours || '0',
    includedKms: product?.value.includedKms || 0,
  },
});

const onSubmit = form.handleSubmit(async (values) => {
  isLoadingSend.value = true;
  try {
    await $fetch('/api/admin/products', {
      method: 'PUT',
      body: {
        image: {
          name: productImage?.value.name || '',
          url: productImage?.value.url || '',
        },
        id: product.value.id,
        code: values.code,
        name: values.name,
        capacity: values.capacity,
        type: values.type,
        basePrice: values.basePrice?.replace(',', '.'),
        includedHours: values.includedHours || '0',
        includedKms: values.includedKms || 0,
        kmPrice: values.kmPrice.replace(',', '.'),
        minutePrice: values.minutePrice.replace(',', '.'),
        enabled: productSituation.value,
      },
    });
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao alterar dados do produto. Tente novamente.`,
    });
  } finally {
    isLoadingSend.value = false;
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Produto alterado com sucesso!`,
    });
    navigateTo('/admin/configurations/products');
  }
});

const deleteFile = async (url: string) => {
  try {
    await deleteFileAction(url);
  } catch (error) {
    toast({
      title: 'Oops!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Arquivo do logotipo não pode ser removido. Tente novamente.`,
    });
  } finally {
    toast({
      title: 'Feito!',
      class: 'bg-green-500 border-0 text-white text-2xl',
      description: `Arquivo do logotipo foi removido com sucesso!`,
    });
  }
};
</script>
<template>
  <main class="p-6">
    <header>
      <BackLink />
    </header>
    <section class="mb-6 flex items-center justify-between">
      <h1 class="flex items-center gap-4 text-2xl font-bold">
        <Box />
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
            {{ product?.code }} - {{ product?.name }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
            <div class="mb-6 flex flex-col gap-4 items-start justify-start">
              <div class="relative">
                <p class="mb-2 font-bold">Imagem</p>
                <div
                  class="peer p-2 w-[200px] h-[200px] rounded-md bg-white bg-contain bg-no-repeat bg-center relative flex items-center justify-center"
                  :style="{ backgroundImage: `url(${productImage?.url})` }"
                >
                  <LoaderCircle
                    v-if="productImage?.url === ''"
                    class="w-10 h-10 animate-spin"
                  />
                </div>
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
                          if (isUploading)
                            return 'Enviando seu arquivo, aguarde...';
                        },
                      },
                      endpoint: 'productImage',
                      onClientUploadComplete: (file) => {
                        productImage.name = file[0].name;
                        productImage.url = file[0].ufsUrl;
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
                <small
                  v-if="productImage?.name !== ''"
                  class="mb-2 text-muted-foreground"
                  >Alterar Imagem</small
                >
                <div
                  v-if="productImage?.name !== ''"
                  class="flex items-center gap-2"
                >
                  <Paperclip class="w-4 h-4 text-green-600" />
                  <div
                    class="px-4 py-2 border border-dashed border-zinc-500 rounded-md bg-white"
                  >
                    <a
                      class="underline"
                      :href="productImage?.url"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {{ productImage?.name || 'Nenhum arquivo anexo' }}
                    </a>
                  </div>
                  <LoaderCircle
                    v-if="loadingFileData"
                    class="w-4 h-4 animate-spin"
                  />
                  <CircleX
                    v-else
                    class="w-4 h-4 text-zinc-500 hover:text-red-500 cursor-pointer"
                    @click.prevent="deleteFile(productImage?.url)"
                  />
                </div>
              </div>
            </div>
            <Separator class="my-6 border-b border-b-zinc-300" />
            <div class="mb-4 md:grid md:grid-cols-4 md:gap-6">
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
              <FormField v-slot="{ componentField }" name="capacity">
                <FormItem>
                  <FormLabel>Capacidade</FormLabel>
                  <FormControl>
                    <Input type="number" v-bind="componentField" />
                    <FormMessage />
                  </FormControl>
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="type">
                <FormItem>
                  <FormLabel>Tipo de Cobrança</FormLabel>
                  <FormControl>
                    <FormSelect
                      disabled
                      :items="[
                        { label: 'Valor Fechado', value: 'contract' },
                        { label: 'Km e Minuto', value: 'free' },
                        { label: 'Km', value: 'free-km' },
                      ]"
                      v-model="productType"
                      label="Selecione o tipo"
                      v-bind="componentField"
                    />
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
                  <FormItem>
                    <FormLabel>Valor do Base (R$)</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                      <FormMessage />
                    </FormControl>
                  </FormItem>
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
                  <FormItem>
                    <FormLabel>Valor KM Adicional (R$)</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                      <FormMessage />
                    </FormControl>
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="minutePrice">
                  <FormItem>
                    <FormLabel>Valor Minuto Adicional (R$)</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                      <FormMessage />
                    </FormControl>
                  </FormItem>
                </FormField>
              </div>
            </div>
            <div
              v-if="productType === 'free' || productType === 'free-km'"
              class="p-6 border-2 border-zinc-700 rounded-md"
            >
              <h3 class="mb-4 font-bold text-lg">Editar Valores</h3>

              <div class="md:grid md:grid-cols-4 gap-4">
                <FormField v-slot="{ componentField }" name="basePrice">
                  <FormItem>
                    <FormLabel>Valor Base (R$)</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                      <FormMessage />
                    </FormControl>
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="kmPrice">
                  <FormItem>
                    <FormLabel>Valor KM (R$)</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                      <FormMessage />
                    </FormControl>
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="minutePrice">
                  <FormItem>
                    <FormLabel>Valor Minuto (R$)</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                      <FormMessage />
                    </FormControl>
                  </FormItem>
                </FormField>
              </div>
            </div>
            <div class="mt-6">
              <Button type="submit">
                <LoaderCircle
                  v-if="isLoadingSend"
                  class="w-10 h-10 animate-spin"
                />
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
