<script setup lang="ts">
definePageMeta({
  layout: "admin",
  title: "Editar Usuário | Urban Mobi"
});

import { ref, computed } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import { ArrowLeft, LoaderCircle } from "lucide-vue-next";
import { usePassengerStore } from "~/stores/admin/passengers.store";
import FormSelect from "@/components/shared/FormSelect.vue";
import CheckBoxGroup from "@/components/shared/CheckBoxGroup.vue";

import { useToast } from "@/components/ui/toast/use-toast";
import { storeToRefs } from "pinia";
import { dateFormat } from "~/lib/utils";
import { useCustomerStore } from "~/stores/admin/customers.store";

const { toast } = useToast();

const userStore = usePassengerStore();
const customerStore = useCustomerStore();
const { getPassengerByIdAction, updatePassengerAction, toggleIsEditing } =
  userStore;
const { getCustomerByIdAction } = customerStore;
const { loading } = storeToRefs(userStore);

const route = useRoute();

const fetchUserData = async () => {
  return await getPassengerByIdAction(route.params.id as string);
};
const fetchCustomerData = async (customerId: string) => {
  return await getCustomerByIdAction(customerId);
};

const userData = ref<any>();
const customerData = ref<any>();
const isLoading = ref(false);

userData.value = await fetchUserData();
if (userData.value.customerId !== null) {
  customerData.value = await fetchCustomerData(userData.value.customerId);
}

const regularUser = computed(() => {
  return userData?.value.type === "regular";
});

const createFormSchema = () => {
  if (userData.value.type === "regular") {
    const regularUserSchema = toTypedSchema(
      z.object({
        name: z.string().min(2).max(50),
        email: z.string().min(2).max(50),
        phone: z.string().min(2).max(50),
        document: z.string().min(2).max(16),
        status: z.string().min(2).max(50),
        active: z.boolean(),
      })
    );
    return regularUserSchema;
  }

  const corpUserSchema = toTypedSchema(
    z.object({
      name: z.string().min(2).max(50),
      email: z.string().min(2).max(50),
      phone: z.string().min(2).max(50),
      department: z.string().min(2).max(50),
      position: z.string().min(2).max(50),
      status: z.string().min(2).max(50),
      active: z.boolean(),
      restrictions: z
        .array(z.string())
        .refine((value) => value.some((item) => item), {
          message: "Selecione ao menos uma restrição!"
        })
    })
  );

  return corpUserSchema;
};
const passengersForm = useForm({
  validationSchema: createFormSchema(),
  initialValues: userData.value
});

const onSubmitUser = passengersForm.handleSubmit(async (values) => {
  isLoading.value = true;
  try {
    await updatePassengerAction({
      id: route.params.id,
      ...values
    });
  } catch (error) {
    toast({
      title: "Algo deu errado!",
      class: "bg-red-600 border-0 text-white text-2xl",
      description: `Erro ${error} ao atualizar dados do usuário ${userData.value.name}`
    });
  } finally {
    setTimeout(() => {
      isLoading.value = false;
      toast({
        title: "Sucesso!",
        class: "bg-green-600 border-0 text-white text-2xl",
        description: `O usuário ${values.name} foi atualizado com sucesso!`
      });
      navigateTo("/admin/users");
    }, 1500);
  }
});

const sanitizedCCAreas = computed(() => {
  if (userData.value.type === "corp") {
    return customerData.value.ccAreas.map((area: any) => ({
      label: `${area.areaCode} - ${area.areaName}`,
      value: area.areaCode
    }));
  } else return;
});
</script>

<template>
  <main class="p-6">
    <header>
      <div class="mb-8 flex items-center">
        <NuxtLink to="/admin/users" class="flex hover:font-bold">
          <ArrowLeft class="mr-2" />
          Voltar
        </NuxtLink>
      </div>
    </header>
    <section v-if="loading" class="p-10 h-40 flex items-center justify-center bg-zinc-200 rounded-md">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else class="mb-6">
      <Card class="bg-zinc-200 rounded-md">
        <form @submit.prevent="onSubmitUser">
          <CardHeader>
            <div class="flex items-center justify-between">
              <CardTitle class="text-md">Editando dados do usuário:
                <br />
                <span class="font-normal text-3xl">{{ userData.name }}</span>
                <div class="my-4">
                  <div class="mb-4 flex flex-col">
                    <small class="text-zinc-500">Cadastrado em:</small>
                    <p class="font-bold">
                      {{ dateFormat(userData.createdAt) }}
                    </p>
                  </div>
                  <div class="mb-2 flex flex-col">
                    <small class="text-zinc-500">Modificado em:</small>
                    <p class="font-bold">
                      {{ dateFormat(userData.updatedAt) }}
                    </p>
                  </div>
                </div>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-4 gap-4 items-center">
              <FormField v-slot="{ componentField }" name="name">
                <FormItem class="relative">
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="ex.: João Silva" v-bind="componentField" />
                  </FormControl>
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="email">
                <FormItem class="relative">
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="ex.: joao_silva@email.com.br" v-bind="componentField" />
                  </FormControl>
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="phone">
                <FormItem>
                  <FormLabel>Celular</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="ex.: 11-9987605432" v-bind="componentField" />
                  </FormControl>
                </FormItem>
              </FormField>

              <FormField v-if="regularUser" v-slot="{ componentField }" name="document">
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="ex.: 123.345.567-89 " v-bind="componentField" />
                  </FormControl>
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="status">
                <FormItem>
                  <FormLabel>Situação do Usuário</FormLabel>
                  <FormControl>
                    <FormSelect v-bind="componentField" :items="[
                      { label: 'Ativo', value: 'active' },
                      { label: 'Inativo', value: 'inactive' }
                    ]" :label="'Selecione o Status'" />
                  </FormControl>
                </FormItem>
              </FormField>

              <!-- <FormField v-slot="{ componentField }" name="active">
                <FormItem>
                  <FormLabel>Acesso ao sistema</FormLabel>
                  <FormControl>
                    <FormSelect v-bind="componentField" :items="[
                      { label: 'Permitido', value: true },
                      { label: 'Negado', value: false }
                    ]" :label="'Selecione o Status'" />
                  </FormControl>
                </FormItem>
              </FormField> -->

              <div v-if="!regularUser" class="p-6 col-span-4 border-2 border-zinc-600 rounded-md">
                <h4 class="mb-8 font-bold">Dados Corporativos</h4>
                <h2 class="mb-6 text-xl">
                  <strong>Cliente: </strong>{{ customerData.name }}
                </h2>
                <div class="grid grid-cols-3 gap-4 items-center">
                  <!-- <FormField
                    v-if="regularUser"
                    v-slot="{ componentField }"
                    name="customer"
                  >
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <FormControl>
                        <FormSelect
                          v-bind="componentField"
                          :items="[
                            { label: 'Empresa A', value: 'empresa-a' },
                            { label: 'Empresa B', value: 'empresa-b' }
                          ]"
                          :label="'Selecione a empresa'"
                        />
                      </FormControl>
                    </FormItem>
                  </FormField> -->
                  <FormField v-slot="{ componentField }" name="department">
                    <FormItem>
                      <FormLabel>CC / Depto.</FormLabel>
                      <FormControl>
                        <FormSelect v-bind="componentField" :items="sanitizedCCAreas" :label="'Selecione'" />
                      </FormControl>
                      <!-- <FormMessage class="absolute" /> -->
                    </FormItem>
                  </FormField>
                  <FormField v-slot="{ componentField }" name="position">
                    <FormItem>
                      <FormLabel>Cargo</FormLabel>
                      <FormControl>
                        <FormSelect v-bind="componentField" :items="[
                          { label: 'Presidente', value: 'presidente' },
                          { label: 'Diretor', value: 'diretor' },
                          { label: 'Gerente', value: 'gerente' },
                          { label: 'Coordenador', value: 'coordenador' },
                          { label: 'Visitante', value: 'visitante' },
                          { label: 'Outro', value: 'outros' }
                        ]" :label="'Selecione um cargo'" />
                      </FormControl>
                    </FormItem>
                  </FormField>
                  <FormField v-slot="{ componentField }" name="status">
                    <FormItem>
                      <FormLabel>Situação</FormLabel>
                      <FormControl>
                        <FormSelect v-bind="componentField" :items="[
                          { label: 'Ativo', value: 'active' },
                          { label: 'Inativo', value: 'inactive' },
                          { label: 'Férias', value: 'vacation' },
                          { label: 'Desligado', value: 'disabled' }
                        ]" :label="'Selecione a situação'" />
                      </FormControl>
                    </FormItem>
                  </FormField>
                  <FormField v-slot="{ componentField }" name="restrictions">
                    <CheckBoxGroup v-bind="componentField" />
                  </FormField>
                </div>
              </div>
            </div>
            <h2 class="my-6 font-bold text-xl">Histórico de Atendimentos</h2>
            <section class="mb-6 p-6 flex items-center justify-center rounded-md bg-white">
              <p class="text-zinc-400">Nenhuma histórico encontrado</p>
            </section>
            <section class="p-6 flex gap-8 rounded-md border-4 border-red-500 bg-white">
              <h2 class="font-bold">Acesso ao sistema</h2>
              <FormField v-slot="{ value, handleChange }" name="active">
                <FormItem>
                  <div class="flex items-center space-x-3">
                    <Label for="enabled" class="text-md flex gap-2 items-center">
                      <LockKeyhole />
                      <small>Negado</small>
                    </Label>
                    <FormControl>
                      <Switch :checked="value" aria-readonly @update:checked="handleChange" />
                    </FormControl>
                    <Label for="enabled" class="text-md flex gap-2 items-center">
                      <LockKeyholeOpen />
                      <small>Permitido</small>
                    </Label>
                  </div>
                </FormItem>
              </FormField>
            </section>
          </CardContent>
          <CardFooter>
            <div class="mt-8 flex items-center">
              <Button type="submit">
                <LoaderCircle v-if="loading" class="w-10 h-10 animate-spin" />
                Salvar alterações
              </Button>
              <Button variant="ghost" class="ml-4" @click.prevent="
                () => {
                  navigateTo('/admin/users');
                  toggleIsEditing();
                }
              ">
                Cancelar
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </section>
  </main>
</template>

<style scoped></style>
