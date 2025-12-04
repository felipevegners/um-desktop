<script setup lang="ts">
import RenderIcon from './RenderIcon.vue';

defineOptions({
  name: 'RideStepper',
});
const props = defineProps<{
  steps: any;
}>();

const mockedSteps = [
  {
    type: 'started',
    label: 'Iniciado',
    icon: 'Play',
    status: 'future',
  },
  {
    type: 'boarding-place',
    label: 'No Local de Embarque',
    icon: 'MapPin',
    status: 'future',
  },
  {
    type: 'boarded',
    label: 'Passageiro Embarcado',
    icon: 'UserCheck',
    status: 'future',
  },
  {
    type: 'disembarked',
    label: 'Passageiro Desembarcado',
    icon: 'UserX',
    status: 'future',
  },
  {
    type: 'finished',
    label: 'Finalizado',
    icon: 'MapPinCheckIcon',
    status: 'future',
  },
];

const sanitizedSteps = ref<any>([]);

const renderSanitizedSteps = () => {
  const sanitized =
    props?.steps?.map((item: any) => {
      return {
        type: item.step,
        label: mockedSteps.find((step) => step.type === item.step)?.label,
        icon: mockedSteps.find((step) => step.type === item.step)?.icon,
        status: item.status,
        timestamp: item.timestamp,
      };
    }) || mockedSteps;
  sanitizedSteps.value = sanitized;
};

onMounted(() => {
  renderSanitizedSteps();
});

watch(
  () => props.steps,
  (ready) => {
    if (ready) {
      renderSanitizedSteps();
    }
  },
);

const getIndicatorClasses = (step: any) => {
  const base = 'transition-colors';
  return {
    [base]: true,
    'bg-black text-white': step.status === 'past',
    'border-2 border-black bg-um-primary text-black animate-pulse':
      step.status === 'current',
    'bg-um-primary-foregroound text-um-primary-foreground/50 border-2 border-um-primary-foreground/50':
      step.status === 'future',
  };
};
</script>
<template>
  <div class="p-4 flex items-start justify-center gap-4 md:gap-10 bg-um-primary">
    <div
      v-for="(step, index) in sanitizedSteps"
      :key="step.type"
      class="flex flex-col items-center relative z-10"
    >
      <div class="w-12 h-12 rounded-full flex items-center justify-center bg-um-primary">
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center"
          :class="getIndicatorClasses(step)"
        >
          <RenderIcon :name="step.icon" />
        </div>
      </div>
      <small
        class="mt-2 text-xs text-black max-w-20 text-center leading-none"
        :class="step.status === 'future' && 'text-um-primary-foreground'"
      >
        {{ step.label }}
      </small>
      <small
        v-if="step.status !== 'future'"
        class="mt-1 text-um-primary-foreground text-[10px]"
      >
        {{ new Date(step.timestamp).toLocaleTimeString('pt-BR') }}
      </small>
      <div
        v-if="index < sanitizedSteps.length - 1"
        class="absolute left-[calc(50%+24px)] right-[calc(-50%+10px)] top-6 block h-0.5 shrink-0 rounded-full bg-um-primary-foreground/50 w-full md:w-[calc(100%+20px)]"
        :class="step.status === 'past' && 'bg-zinc-950/100'"
      />
    </div>
  </div>
</template>

<style scoped></style>
