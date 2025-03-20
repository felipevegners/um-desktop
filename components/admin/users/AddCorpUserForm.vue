<script setup lang="ts">
import CheckBoxGroup from '@/components/shared/CheckBoxGroup.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { toTypedSchema } from '@vee-validate/zod';
import { LoaderCircle } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import { computed, h, onMounted, ref } from 'vue';
import * as z from 'zod';
import { useCustomerStore } from '~/stores/admin/customers.store';
import { usePassengerStore } from '~/stores/admin/passengers.store';

const { toast } = useToast();

const userStore = usePassengerStore();
const {
  createNewPassengerAction,
  updatePassengerAction,
  toggleIsEditing,
  getPassengersAction,
} = userStore;
const { loading, passenger, isEditing } = storeToRefs(userStore);

const customerStore = useCustomerStore();
const { getCustomersAction } = customerStore;
const { customers } = storeToRefs(customerStore);

const customerAreasList = ref<any>();
const customerName = ref<string>();

onMounted(async () => {
  await getCustomersAction();
});

const props = defineProps<{
  customerId?: string;
  customerName?: string;
  isNewUser?: boolean;
  ccAreas?: any;
}>();

const emit = defineEmits(['show-form', 'fetch-customer', 'regular-user']);

const showPassengerForm = () => {
  emit('show-form');
};

const corpPassengesFormSchema = toTypedSchema(
  z
    .object({
      name: z.string().min(2).max(50),
      email: z.string().min(2).max(50),
      phone: z.string().min(2).max(50),
      department: z.string().min(2).max(50),
      position: z.string().min(2).max(50),
      status: z.string().min(2).max(50),
      customerId: z.string().optional(),
      restrictions: z
        .array(z.string())
        .refine((value) => value.some((item) => item), {
          message: 'Selecione ao menos uma restrição!',
        }),
    })
    .refine((input) => {
      if (props.isNewUser && input.customerId === '') return false;
      return true;
    }),
);

const passengersForm = useForm({
  validationSchema: corpPassengesFormSchema,
  initialValues: isEditing.value
    ? passenger.value
    : {
        restrictions: ['week'],
      },
});

const onSubmitPassengers = passengersForm.handleSubmit(async (values) => {
  const newPassengerData = {
    id: passenger?.value.id,
    name: values.name,
    email: values.email,
    phone: values.phone,
    department: values.department,
    position: values.position,
    status: values.status,
    restrictions: values.restrictions,
    customerId: props.isNewUser ? values.customerId : props.customerId,
    customerName: props.isNewUser ? customerName.value : props.customerName,
    active: true,
    type: 'corp',
    history: [],
  };

  if (isEditing && passenger?.value.id) {
    try {
      await updatePassengerAction(newPassengerData);
    } catch (error) {
      toast({
        title: 'Oops!',
        class: 'bg-red-600 border-0 text-white text-2xl',
        description: `Ocorreu um erro ao adicionar o usuário. Erro ${error}`,
      });
      throw error;
    } finally {
      toast({
        title: 'Feito!',
        class: 'bg-green-600 border-0 text-white text-2xl',
        description: 'Usuário atualizado com sucesso!',
      });
      emit('show-form');
      emit('fetch-customer');
    }
  } else {
    try {
      await createNewPassengerAction(newPassengerData);
    } catch (error) {
      toast({
        title: 'Oops!',
        class: 'bg-red-600 border-0 text-white text-2xl',
        description: `Ocorreu um erro ao adicionar o usuário. Erro ${error}`,
      });
      throw error;
    } finally {
      toast({
        title: 'Feito!',
        class: 'bg-green-600 border-0 text-white text-2xl',
        description: 'Usuário adicionado com sucesso!',
      });
      await getPassengersAction();
      emit('show-form');
    }
  }
});

const onSelectCustomer = (value: any) => {
  const name = customers.value.filter((customer) => customer.id === value)[0]
    .fantasyName;
  customerName.value = name;

  const areas = customers.value.filter((customer) => customer.id === value)[0]
    .ccAreas;
  customerAreasList.value = areas.map((area: any) => ({
    label: `${area.areaCode} - ${area.areaName}`,
    value: area.areaCode,
  }));
};

const sanitizedCustomers = computed(() => {
  if (props.isNewUser && customers.value.length) {
    return customers.value.map((customer) => ({
      label: customer.name,
      value: customer.id,
    }));
  }
});

const sanitezedCCAreas = computed(() => {
  if (!props.isNewUser && props.ccAreas.length) {
    return props.ccAreas.map((area: any) => ({
      label: `${area.areaCode} - ${area.areaName}`,
      value: area.areaCode,
    }));
  } else return [];
});

customerAreasList.value = sanitezedCCAreas;
</script>
<template>
  <div v-if="!Object.keys(passenger)">
    <LoaderCircle class="w-10 h-10 animate-spin" />
  </div>
  <div v-else>
    <form @submit.prevent="onSubmitPassengers" @keydown.enter.prevent="true">
      <div class="mb-8 p-8 gap-4 bg-zinc-300 rounded-md">
        <div class="grid grid-cols-4 gap-4 items-center">
          <FormField v-slot="{ componentField }" name="name">
            <FormItem class="relative">
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="ex.: João Silva"
                  v-bind="componentField"
                />
              </FormControl>
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="email">
            <FormItem class="relative">
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="ex.: joao_silva@email.com.br"
                  v-bind="componentField"
                />
              </FormControl>
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="phone">
            <FormItem>
              <FormLabel>Celular</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="ex.: 11-9987605432"
                  v-bind="componentField"
                />
              </FormControl>
            </FormItem>
          </FormField>
          <div class="p-6 col-span-4 border-2 border-zinc-600 rounded-md">
            <h4 class="mb-8 font-bold">Dados Corporativos</h4>
            <div class="grid grid-cols-3 gap-4 items-center">
              <div v-if="isNewUser">
                <FormField v-slot="{ componentField }" name="customerId">
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <FormControl>
                      <FormSelect
                        v-bind="componentField"
                        :items="sanitizedCustomers"
                        :label="'Selecione a empresa'"
                        @on-select="onSelectCustomer"
                      />
                    </FormControl>
                  </FormItem>
                </FormField>
              </div>
              <FormField v-slot="{ componentField }" name="department">
                <FormItem>
                  <FormLabel>CC / Depto.</FormLabel>
                  <FormControl>
                    <FormSelect
                      v-if="!isNewUser"
                      v-bind="componentField"
                      :items="sanitezedCCAreas"
                      :label="'Selecione'"
                    />
                    <FormSelect
                      v-else
                      :disabled="!customerAreasList.length"
                      v-bind="componentField"
                      :items="customerAreasList"
                      :label="'Selecione'"
                    />
                  </FormControl>
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="position">
                <FormItem>
                  <FormLabel>Cargo</FormLabel>
                  <FormControl>
                    <FormSelect
                      v-bind="componentField"
                      :items="[
                        { label: 'Presidente', value: 'presidente' },
                        { label: 'Diretor', value: 'diretor' },
                        { label: 'Gerente', value: 'gerente' },
                        { label: 'Coordenador', value: 'coordenador' },
                        { label: 'Visitante', value: 'visitante' },
                        { label: 'Outro', value: 'outros' },
                      ]"
                      :label="'Selecione um cargo'"
                    />
                  </FormControl>
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="status">
                <FormItem>
                  <FormLabel>Situação do Cadastro</FormLabel>
                  <FormControl>
                    <FormSelect
                      v-bind="componentField"
                      :items="[
                        { label: 'Ativo', value: 'active' },
                        { label: 'Inativo', value: 'inactive' },
                        { label: 'Férias', value: 'vacation' },
                        { label: 'Desligado', value: 'disabled' },
                      ]"
                      :label="'Selecione a situação'"
                    />
                  </FormControl>
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="restrictions">
                <CheckBoxGroup v-bind="componentField" />
              </FormField>
            </div>
          </div>
        </div>
        <div class="mt-4 py-4 flex gap-4">
          <Button type="submit">
            <LoaderCircle v-if="loading" class="w-10 h-10 animate-spin" />
            Salvar
          </Button>
          <Button
            variant="ghost"
            @click="
              () => {
                showPassengerForm();
                toggleIsEditing();
                emit('regular-user');
              }
            "
            >Cancelar</Button
          >
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped></style>
