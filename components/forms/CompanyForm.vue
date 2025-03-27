<script setup lang="ts">
import { useToast } from '@/components/ui/toast/use-toast';
import { findAddressByZipcode } from '@/server/services/FindAddress';
import { useContractsStore } from '@/stores/contracts.store';
import { toTypedSchema } from '@vee-validate/zod';
import { LoaderCircle, Search } from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { useForm } from 'vee-validate';
import { ref } from 'vue';
import * as z from 'zod';

const { createContractAction } = useContractsStore();

definePageMeta({
  name: 'CompanyForm',
});
const { toast } = useToast();

const zipcode = ref('');
const isLoadingAddress = ref<boolean>(false);
const isLoadingSend = ref<boolean>(false);

const MAX_FILE_SIZE = 4000000;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(2).max(100),
    document: z.string().min(2).max(50),
    fantasyName: z.string().min(2).max(50),
    zipcode: z.string().min(1).max(9),
    streetName: z.string().min(2).max(50),
    streetNumber: z.string().min(2).max(50),
    complement: z.string().min(0).max(50),
    neighborhood: z.string().min(2).max(50),
    city: z.string().min(2).max(50),
    state: z.string().min(2).max(50),
    phone: z.string().min(2).max(16),
    website: z.string().min(2).max(50),
    logo: z
      .any()
      .refine((file) => file?.size <= MAX_FILE_SIZE, `Tamanho máximo é de 4Mb.`)
      .refine(
        (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
        'Apenas arquivos nos formatos .jpg, .jpeg ou .png são aceitos ',
      )
      .optional(),
  }),
);

const form = useForm({
  validationSchema: formSchema,
});

const findAddress = async () => {
  const { zipcode } = form.values;

  if (zipcode?.length !== 9) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `CEP inválido. Digite novamente.`,
    });
  } else {
    try {
      isLoadingAddress.value = true;
      const address: any = await findAddressByZipcode(zipcode as string);
      if (address.erro) {
        toast({
          title: 'CEP Inválido',
          class: 'bg-red-500 border-0 text-white text-2xl',
          description: `Confira o CEP e tente novamente.`,
        });
        //@ts-ignore
        document.querySelector("input[name='zipcode']").focus();
        document
          .querySelector("input[name='zipcode']")
          ?.classList.add(
            'bg-red-300',
            'focus:ring-0',
            'focus-visible:ring-0',
            'focus-visible:outline-3',
            'focus-visible:outline-offset-2',
            'focus-visible:outline-red-500',
          );
      } else {
        document
          .querySelector("input[name='zipcode']")
          ?.classList.remove(
            'bg-red-300',
            'focus-visible:ring-0',
            'focus-visible:outline-3',
            'focus-visible:outline-offset-2',
            'focus-visible:outline-red-500',
          );
        form.setValues({
          zipcode: address?.cep.replace('-', ''),
          streetName: address?.logradouro,
          city: address?.localidade,
          neighborhood: address?.bairro,
          state: address?.estado,
        });
      }
    } catch (error) {
      toast({
        title: 'Opss!',
        class: 'bg-red-500 border-0 text-white text-2xl',
        description: `Ocorreu um erro ao buscar o endereço. Tente novamente.`,
      });
      console.log('Erro ao buscar endereço -> ', error);
    } finally {
      isLoadingAddress.value = false;
    }
  }
};

const { startUpload } = useUploadThing('customerLogo', {
  //@ts-ignore
  onClientUploadComplete(res) {
    return res;
  },
});

const onSubmit = form.handleSubmit(async (values) => {
  const files = [values?.logo];
  isLoadingSend.value = true;

  try {
    if (!files) {
      console.log('Sem logo');
    }
    // const filesResponse = await startUpload(files);
    const {
      name,
      document,
      fantasyName,
      streetName,
      streetNumber,
      complement,
      neighborhood,
      city,
      state,
      zipcode,
      phone,
      website,
    } = values;

    const companyData = {
      name,
      document,
      fantasyName,
      address: {
        zipcode,
        streetName,
        streetNumber,
        complement,
        neighborhood,
        city,
        state,
      },
      phone,
      website,
      // logo: {
      //   //@ts-ignore
      //   name: filesResponse[0]?.name || '',
      //   //@ts-ignore
      //   url: filesResponse[0]?.ufsUrl || '',
      // },
      status: 'active',
      enabled: false,
    };

    await createContractAction(companyData as any);
  } catch (error) {
    console.log('Error -> ', error);
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao cadastrar o cliente. Tente novamente.`,
    });
  } finally {
    isLoadingSend.value = false;
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Empresa cadastrada com sucesso!`,
    });
  }
});
</script>
<template>
  <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
    <section class="px-6">
      <div class="mb-4 w-full grid grid-cols-3 gap-6">
        <FormField v-slot="{ componentField }" name="document">
          <FormItem>
            <FormLabel>CNPJ</FormLabel>
            <FormControl>
              <Input
                type="text"
                v-bind="componentField"
                v-maska="'##.###.###/####-##'"
              />
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel>Razão Social</FormLabel>
            <FormControl>
              <Input type="text" v-bind="componentField" />
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="fantasyName">
          <FormItem>
            <FormLabel>Nome Fantasia</FormLabel>
            <FormControl>
              <Input type="text" v-bind="componentField" />
            </FormControl>
          </FormItem>
        </FormField>
      </div>
      <div class="mb-4 w-full grid grid-cols-4 gap-6">
        <FormField v-slot="{ componentField }" name="zipcode">
          <FormItem class="col-span-1">
            <FormLabel>CEP</FormLabel>
            <FormControl>
              <div class="flex gap-2">
                <Input
                  type="text"
                  v-bind="componentField"
                  v-model="zipcode"
                  maxlength="9"
                  v-maska="'#####-###'"
                />
                <Button
                  @click.prevent="findAddress"
                  :disabled="zipcode.length !== 9"
                  type="button"
                >
                  <Search v-if="!isLoadingAddress" class="w-10 h-10" />
                  <LoaderCircle
                    v-if="isLoadingAddress"
                    class="w-10 h-10 animate-spin"
                  />
                </Button>
              </div>
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="streetName">
          <FormItem class="col-span-2">
            <FormLabel>Endereço</FormLabel>
            <FormControl>
              <Input type="text" v-bind="componentField" />
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="streetNumber">
          <FormItem class="col-span-1">
            <FormLabel>Número</FormLabel>
            <FormControl>
              <Input type="text" v-bind="componentField" />
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="complement">
          <FormItem class="col-span-1">
            <FormLabel>Complemento</FormLabel>
            <FormControl>
              <Input type="text" v-bind="componentField" />
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="neighborhood">
          <FormItem class="col-span-1">
            <FormLabel>Bairro</FormLabel>
            <FormControl>
              <Input type="text" v-bind="componentField" />
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="city">
          <FormItem class="col-span-1">
            <FormLabel>Cidade</FormLabel>
            <FormControl>
              <Input type="text" v-bind="componentField" />
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="state">
          <FormItem class="col-span-1">
            <FormLabel>Estado</FormLabel>
            <FormControl>
              <Input type="text" v-bind="componentField" />
            </FormControl>
          </FormItem>
        </FormField>
      </div>
      <div class="mb-4 w-full grid grid-cols-3 gap-6">
        <FormField v-slot="{ componentField }" name="phone">
          <FormItem>
            <FormLabel>Telefone</FormLabel>
            <FormControl>
              <Input
                type="text"
                v-bind="componentField"
                v-maska="'(##) # ####-####'"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="website">
          <FormItem>
            <FormLabel>Site</FormLabel>
            <FormControl>
              <Input type="text" v-bind="componentField" />
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="logo">
          <FormItem>
            <FormLabel>Logo da Empresa</FormLabel>
            <FormControl>
              <Input type="file" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </div>
    </section>
    <section class="px-6">
      <Button type="submit">
        <LoaderCircle v-if="isLoadingSend" class="w-10 h-10 animate-spin" />
        Salvar
      </Button>
      <Button
        variant="ghost"
        class="ml-4"
        @click.prevent="
          () => {
            form.resetForm();
            zipcode = '';
          }
        "
      >
        Cancelar
      </Button>
    </section>
  </form>
</template>

<style scoped></style>
