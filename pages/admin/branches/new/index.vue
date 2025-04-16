<script setup lang="ts">
import BranchForm from '@/components/forms/BranchForm.vue';
import CompanyForm from '@/components/forms/CompanyForm.vue';
import BackLink from '@/components/shared/BackLink.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { Building2, Check, LoaderCircle } from 'lucide-vue-next';

definePageMeta({
  layout: 'admin',
});
useHead({
  title: 'Backoffice - Adicionar Nova Filial | Urban Mobi',
});

const { toast } = useToast();

const findAddress = async (code: string) => {
  if (code?.length !== 9) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `CEP inválido. Digite novamente.`,
    });
  } else {
    try {
      isLoadingAddress.value = true;
      const response: any = await findAddressByZipcode(code);
      form.setValues({
        streetName: response.logradouro,
        neighborhood: response.bairro,
        city: response.localidade,
        state: response.estado,
        complement: response.complemento ? response.complemento : '-',
      });
      if (response.erro) {
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
</script>

<template>
  <main class="p-6">
    <header>
      <BackLink />
    </header>
    <section class="mb-10 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <Building2 class="w-6 h-6" />
        Cadastrar Nova Filial
      </h1>
    </section>
    <section class="py-6 bg-zinc-200 rounded-md">
      <form @submit="">
        <div class="flex flex-col gap-10">
          <BranchForm :isEditing="false" :findAddress="findAddress" />
          <div class="mt-6 px-6 flex">
            <Button type="submit">
              <LoaderCircle v-if="true" class="w-5 h-5 animate-spin" />
              Cadastrar
            </Button>
            <Button type="button" variant="ghost"> Cancelar </Button>
          </div>
        </div>
      </form>
    </section>
  </main>
</template>

<style scoped></style>
