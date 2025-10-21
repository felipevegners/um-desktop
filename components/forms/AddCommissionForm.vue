<script setup lang="ts">
import { FormField } from '#components';
import { useCommissionsStore } from '#imports';
import { useToast } from '@/components/ui/toast/use-toast';
import { toTypedSchema } from '@vee-validate/zod';
import { LoaderCircle, Save } from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { useForm } from 'vee-validate';
import * as z from 'zod';

import FormSelect from '../shared/FormSelect.vue';

const { toast } = useToast();

const emit = defineEmits(['cancel', 'finish']);

const store = useCommissionsStore();
const { createCommistionAction } = store;
const { isUpdating } = storeToRefs(store);

const driversStore = useDriverStore();
const { getDriversAction } = driversStore;
const { drivers } = storeToRefs(driversStore);

const ridesStore = useRidesStore();
const { getRidesAction } = ridesStore;
const { rides } = storeToRefs(ridesStore);

onMounted(async () => {
  await getDriversAction();
  await getRidesAction();
});

const sanitizeRides = computed(() => {
  const availableRides = rides?.value.filter((ride: any) => ride.status !== 'cancelled');
  return availableRides.map((ride: any) => {
    return {
      label: ride.code,
      value: ride.id,
    };
  });
});

const sanitizeDrivers = computed(() => {
  const enabledDrivers = drivers?.value.filter((driver: any) => driver.enabled !== false);
  return enabledDrivers?.map((driver) => {
    return {
      label: driver.name,
      value: driver.id,
    };
  });
});

const types = [
  {
    label: 'Atendimento Passageiro',
    value: 'ride-commission',
  },
  {
    label: 'Bônus de Atendimento',
    value: 'ride-bonus',
  },
  {
    label: 'Gorjeta Passageiro',
    value: 'ride-tip',
  },
];

const status = [
  {
    label: 'Lançado',
    value: 'created',
  },
  {
    label: 'Pago',
    value: 'paid',
  },
  {
    label: 'Cancelado',
    value: 'cancelled',
  },
  {
    label: 'Recusado',
    value: 'refused',
  },
  {
    label: 'Estornado',
    value: 'reversed',
  },
];

const discountTypes = [
  {
    label: 'Estorno',
    value: 'reverse',
  },
  {
    label: 'Taxas',
    value: 'fees',
  },
  {
    label: 'Adiantamento',
    value: 'antecipation',
  },
  {
    label: 'Diferença Atendimento',
    value: 'difference',
  },
  {
    label: 'Erro de Lançamento',
    value: 'error',
  },
];

const formSchema = toTypedSchema(
  z.object({
    type: z.string().min(2).max(50),
    ammount: z.string(),
    status: z.string(),
    discounts: z.string().optional().default('0'),
    discountType: z.string().optional().default('-'),
    availableAt: z.number().optional(),
    driver: z.string(),
    ride: z.string(),
  }),
);

const form = useForm({
  validationSchema: formSchema,
});

const onSubmit = form.handleSubmit(async (values) => {
  const driverData = drivers?.value.find((driver) => driver.id === values.driver);
  const rideData = rides?.value.find((ride: any) => ride.id === values.ride);
  const payload = {
    ...values,
    availableAt: values.availableAt?.toString(),
    driver: {
      id: values.driver,
      name: driverData?.name,
    },
    ride: {
      id: values.ride,
      code: rideData?.code,
      date: new Date(rideData?.travel.date).toISOString(),
    },
  };

  try {
    await createCommistionAction(payload);
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Pagamento criado com sucesso!`,
    });
  } catch (error) {
    toast({
      title: 'Opss!',
      variant: 'destructive',
      description: `Ocorreu um erro ao criar o Pagamento. Tente novamente.`,
    });
  } finally {
    emit('finish');
    emit('cancel');
  }
});

const onCancel = () => {
  form.values = {};
  emit('cancel');
};
</script>
<template>
  <Card class="p-6 bg-zinc-200">
    <form @submit="onSubmit" @keydown.enter.prevent="true" id="form">
      <div class="grid grid-cols-4 gap-6 items-center">
        <FormField v-slot="{ componentField }" name="driver">
          <FormItem class="col-span-1">
            <FormLabel>Motorista</FormLabel>
            <FormControl>
              <FormSelect
                v-bind="componentField"
                :items="sanitizeDrivers"
                :label="'Selecione'"
              />
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="ride">
          <FormItem class="col-span-1">
            <FormLabel>Atendimento</FormLabel>
            <FormControl>
              <FormSelect
                v-bind="componentField"
                :items="sanitizeRides"
                :label="'Selecione'"
              />
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="type">
          <FormItem class="col-span-1">
            <FormLabel>Tipo de Pagamento</FormLabel>
            <FormControl>
              <FormSelect v-bind="componentField" :items="types" :label="'Selecione'" />
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="status">
          <FormItem class="col-span-1">
            <FormLabel>Situação</FormLabel>
            <FormControl>
              <FormSelect v-bind="componentField" :items="status" :label="'Selecione'" />
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="ammount">
          <FormItem class="col-span-1">
            <FormLabel>Valor (R$)</FormLabel>
            <FormControl>
              <div class="flex gap-2">
                <!-- <Input type="text" v-bind="componentField" /> -->
                <Input
                  type="text"
                  v-bind="componentField"
                  v-maska="'R$ 9#.99#,##'"
                  data-maska-tokens="9:[0-9]:repeated"
                  data-maska-reversed
                />
              </div>
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="availableAt">
          <FormItem class="col-span-1">
            <FormLabel>Prazo (Dias)</FormLabel>
            <FormControl>
              <div class="flex gap-2">
                <Input type="number" v-bind="componentField" />
              </div>
            </FormControl>
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="discounts">
          <FormItem class="col-span-1">
            <FormLabel>Descontos (R$)</FormLabel>
            <FormControl>
              <div class="flex gap-2">
                <Input
                  type="text"
                  v-bind="componentField"
                  v-maska="'R$ 9#.99#,##'"
                  data-maska-tokens="9:[0-9]:repeated"
                  data-maska-reversed
                />
              </div>
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="discountType">
          <FormItem class="col-span-1">
            <FormLabel>Tipo de desconto</FormLabel>
            <FormControl>
              <FormSelect
                v-bind="componentField"
                :items="discountTypes"
                :label="'Selecione'"
              />
            </FormControl>
          </FormItem>
        </FormField>
      </div>
      <div class="mt-6 flex items-center gap-2">
        <Button type="submit" form="form">
          <LoaderCircle v-if="isUpdating" class="animate-spin" />
          <Save v-else />
          Salvar
        </Button>
        <Button type="button" variant="ghost" @click="onCancel"> Cancelar </Button>
      </div>
    </form>
  </Card>
</template>

<style scoped></style>
