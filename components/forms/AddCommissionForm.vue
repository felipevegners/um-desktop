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

const props = withDefaults(
  defineProps<{
    commission?: any | null;
  }>(),
  {
    commission: null,
  },
);

const emit = defineEmits(['cancel', 'finish']);

const store = useCommissionsStore();
const { createCommistionAction, updateCommissionAction } = store;
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

const isEditMode = computed(() => Boolean(props.commission?.id));
const isPaidCommission = computed(() => props.commission?.status === 'paid');

const formSchema = toTypedSchema(
  z.object({
    type: z.string().optional(),
    ammount: z.string().min(1, 'Informe o valor'),
    status: z.string().optional(),
    discounts: z.string().optional().default('0'),
    discountType: z.string().optional().default('-'),
    availableAt: z.union([z.number(), z.string()]).optional(),
    driver: z.string().optional(),
    ride: z.string().optional(),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    type: '',
    ammount: '',
    status: 'created',
    discounts: '0',
    discountType: '-',
    availableAt: '',
    driver: '',
    ride: '',
  },
});

watch(
  () => props.commission,
  (commission) => {
    if (commission?.id) {
      form.setValues({
        type: commission.type || '',
        ammount: commission.ammount || '',
        status: commission.status || 'created',
        discounts: commission.discounts || '0',
        discountType: commission.discountType || '-',
        availableAt: commission.availableAt || '',
        driver: commission?.driver?.id || commission?.driver?._id || '',
        ride: commission?.ride?.id || commission?.ride?._id || '',
      });
      return;
    }

    form.resetForm({
      values: {
        type: '',
        ammount: '',
        status: 'created',
        discounts: '0',
        discountType: '-',
        availableAt: '',
        driver: '',
        ride: '',
      },
    });
  },
  { immediate: true },
);

const onSubmit = form.handleSubmit(async (values) => {
  if (isEditMode.value) {
    if (isPaidCommission.value) {
      toast({
        title: 'Atenção',
        variant: 'destructive',
        description: 'Comissões pagas não podem ser editadas.',
      });
      return;
    }

    const payload = {
      id: props.commission.id,
      ammount: values.ammount,
      discounts: values.discounts || '0',
      discountType: values.discountType || '-',
      availableAt:
        values.availableAt !== undefined && values.availableAt !== null
          ? values.availableAt.toString()
          : '',
    };

    try {
      await updateCommissionAction(payload);
      toast({
        title: 'Tudo pronto!',
        class: 'bg-green-600 border-0 text-white text-2xl',
        description: 'Pagamento atualizado com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Opss!',
        variant: 'destructive',
        description: 'Ocorreu um erro ao atualizar o pagamento. Tente novamente.',
      });
    } finally {
      emit('finish');
      emit('cancel');
    }

    return;
  }

  if (!values.driver || !values.ride || !values.type || !values.status) {
    toast({
      title: 'Atenção',
      variant: 'destructive',
      description: 'Preencha os campos obrigatórios para criar o pagamento.',
    });
    return;
  }

  const driverData = drivers?.value.find((driver) => driver.id === values.driver);
  const rideData = rides?.value.find((ride: any) => ride.id === values.ride);
  const payload = {
    ...values,
    availableAt:
      values.availableAt !== undefined && values.availableAt !== null
        ? values.availableAt.toString()
        : '',
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
  form.resetForm();
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
                :disabled="isEditMode"
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
                :disabled="isEditMode"
              />
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="type">
          <FormItem class="col-span-1">
            <FormLabel>Tipo de Pagamento</FormLabel>
            <FormControl>
              <FormSelect
                v-bind="componentField"
                :items="types"
                :label="'Selecione'"
                :disabled="isEditMode"
              />
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="status">
          <FormItem class="col-span-1">
            <FormLabel>Situação</FormLabel>
            <FormControl>
              <FormSelect
                v-bind="componentField"
                :items="status"
                :label="'Selecione'"
                :disabled="isEditMode"
              />
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
        <Button type="submit" form="form" :disabled="isUpdating || isPaidCommission">
          <LoaderCircle v-if="isUpdating" class="animate-spin" />
          <Save v-else />
          {{ isEditMode ? 'Salvar Alterações' : 'Salvar' }}
        </Button>
        <Button type="button" variant="ghost" @click="onCancel"> Cancelar </Button>
      </div>
    </form>
  </Card>
</template>

<style scoped></style>
