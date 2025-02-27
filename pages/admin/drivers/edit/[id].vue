<script setup lang="ts">
definePageMeta({
  layout: "admin",
  title: "Editar Motorista | Urban Mobi"
});

import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import { ArrowLeft, LoaderCircle } from "lucide-vue-next";
import { dateFormat } from "~/lib/utils";
import { userDriverStore } from "~/stores/admin/drivers.store";
import { storeToRefs } from "pinia";

const driverStore = userDriverStore();
const { loadingData } = storeToRefs(driverStore);
const { getDriverByIdAction } = driverStore;

const route = useRoute();

const fetchDriverData = async () => {
  return await getDriverByIdAction(route.params.id as string);
};

const driverData = ref();
driverData.value = await fetchDriverData();

const createFormSchema = () => {
  const driverSchema = toTypedSchema(
    z.object({
      name: z.string().min(2).max(50),
      email: z.string().min(2).max(50),
      phone: z.string().min(2).max(50),
      document: z.string().min(2).max(16),
      driverLicense: z.string().min(2).max(50),
      status: z.string().min(2).max(50),
    })
  );
  return driverSchema;
};

const driversForm = useForm({
  validationSchema: createFormSchema(),
  initialValues: driverData.value
});

const onSubmit = driversForm.handleSubmit(async (values) => { })
</script>

<template>
  <main class="p-6">
    <header>
      <div class="mb-8 flex items-center">
        <NuxtLink to="/admin/drivers" class="flex hover:font-bold">
          <ArrowLeft class="mr-2" />
          Voltar
        </NuxtLink>
      </div>
    </header>
    <section v-if="loadingData" class="p-10 h-40 flex items-center justify-center bg-zinc-200 rounded-md">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else class="mb-4 py-4">
      <pre>{{ driverData }}</pre>
      <Card class="bg-zinc-200">
        <CardHeader>
          <CardTitle class="text-md">Editando dados do motorista:
            <br />
            <span class="font-normal text-3xl">{{ driverData.name }}</span>
            <div class="my-4">
              <div class="mb-4 flex flex-col">
                <small class="text-zinc-500">Cadastrado em:</small>
                <p class="font-bold">
                  {{ dateFormat(driverData.createdAt) }}
                </p>
              </div>
              <div class="mb-2 flex flex-col">
                <small class="text-zinc-500">Modificado em:</small>
                <p class="font-bold">
                  {{ dateFormat(driverData.updatedAt) }}
                </p>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="">
            <h2 class="mt-4 mb-6 text-lg font-bold">Dados Pessoais</h2>
            <div class="mb-4 w-full grid grid-cols-3 gap-8">
              <FormField v-slot="{ componentField }" name="name">
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="ex.: João Silva" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="email">
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="joao_silva@email.com.br" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="phone">
                <FormItem>
                  <FormLabel>Celular</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="ex.: (11) 99876-5432" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>
            <div class="mb-4 w-full grid grid-cols-4 gap-8">
              <FormField v-slot="{ componentField }" name="document">
                <FormItem class="col-span-1">
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="222.333.444-56" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="driverLicense">
                <FormItem class="col-span-1">
                  <FormLabel>Número CNH</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="ex. 23456789019" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>
            <div class="mb-4 w-full grid grid-cols-3 gap-8"></div>
            <section class="my-10">
              <h2 class="mb-4 text-lg font-bold">Editar Veículo(s)</h2>
              <Separator class="mb-4" />
              <pre>{{ driverData.driverCars }}</pre>
              <div class="grid grid-cols-3 gap-8">
                <AddCarsForm v-model="driverData.driverCars" class="col-span-3" />
              </div>
            </section>
            <section class="mt-6 mb-8">
              <h2 class="mb-4 text-lg font-bold">Editar arquivos</h2>
              <div class="grid grid-cols-3 gap-6">
                <FormField v-slot="{ componentField }" name="picture">
                  <FormItem class="col-span-1">
                    <FormLabel>Foto Pessoal</FormLabel>
                    <FormDescription>*enviar foto de rosto com fundo claro e sem
                      adereços</FormDescription>

                    <FormControl>
                      <Input type="file" placeholder="Selecione uma foto" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="cnhCopy">
                  <FormItem class="col-span-1">
                    <FormLabel>Cópia CNH</FormLabel>
                    <FormDescription>*enviar frente e verso</FormDescription>
                    <FormControl>
                      <Input type="file" placeholder="Selecione uma foto" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="carDocumentCopy">
                  <FormItem class="col-span-1">
                    <FormLabel>Cópia CRV-L</FormLabel>
                    <FormDescription>*enviar frente e verso</FormDescription>

                    <FormControl>
                      <Input type="file" placeholder="Selecione uma foto" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>
            </section>
            <section class="pt-8">
              <Button type="submit">
                <LoaderCircle v-if="true" class="w-10 h-10 animate-spin" />
                Cadastrar
              </Button>
              <Button variant="ghost" class="ml-4" @click.prevent="navigateTo('/admin/drivers')">
                Cancelar
              </Button>
            </section>
          </form>
        </CardContent>
      </Card>
    </section>
  </main>
</template>

<style scoped></style>
