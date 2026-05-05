<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { DateFormatter, parseDate } from '@internationalized/date';
import { CalendarIcon } from 'lucide-vue-next';
import { computed, watch } from 'vue';

const props = defineProps<{
  form?: any;
  disabled?: boolean;
  isRecurringRide?: boolean;
  recurrenceRange?: any;
}>();

const df = new DateFormatter('pt-BR', {
  dateStyle: 'short',
});

const { setFieldValue, values } = props.form;

const value = computed(() =>
  values.departDate ? parseDate(values.departDate) : undefined,
);

// Convert date object to ISO string
const toIsoDate = (dateValue: any): string | null => {
  if (!dateValue) return null;

  if (
    typeof dateValue === 'object' &&
    typeof dateValue.year === 'number' &&
    typeof dateValue.month === 'number' &&
    typeof dateValue.day === 'number'
  ) {
    const month = String(dateValue.month).padStart(2, '0');
    const day = String(dateValue.day).padStart(2, '0');
    return `${dateValue.year}-${month}-${day}`;
  }

  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
    return dateValue;
  }

  return null;
};

// Convert CalendarDate to JavaScript Date for formatting
const calendarDateToDate = (calendarDate: any): Date | null => {
  if (!calendarDate) return null;

  try {
    return new Date(calendarDate.year, calendarDate.month - 1, calendarDate.day);
  } catch {
    return null;
  }
};

// Watch for changes in recurrence range and update departDate with start date
watch(
  () => props.recurrenceRange,
  (newRange) => {
    if (props.isRecurringRide && newRange?.start) {
      const startDate = toIsoDate(newRange.start);
      if (startDate && startDate !== values.departDate) {
        setFieldValue('departDate', startDate);
      }
    }
  },
  { deep: true },
);
</script>

<template>
  <FormField v-slot="{ componentField }" name="departDate">
    <FormItem class="flex flex-col gap-2">
      <FormLabel>Data do Atendimento*</FormLabel>
      <Popover>
        <PopoverTrigger as-child>
          <FormControl>
            <Button
              variant="outline"
              :disabled="props.isRecurringRide"
              :class="
                cn(
                  'w-[240px] mt-2 py-3 ps-3 text-start font-normal h-10',
                  !value && 'text-muted-foreground',
                  props.isRecurringRide && 'opacity-50 cursor-not-allowed',
                )
              "
            >
              <span>{{
                value && calendarDateToDate(value)
                  ? df.format(calendarDateToDate(value)!)
                  : 'Selecione'
              }}</span>
              <CalendarIcon class="ms-auto h-4 w-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent v-if="!props.isRecurringRide" class="w-auto p-0">
          <!-- @ts-ignore -->
          <Calendar
            :model-value="value as any"
            calendar-label="Data do Atendimento"
            initial-focus
            @update:model-value="
              (v) => {
                if (v) {
                  setFieldValue('departDate', v.toString());
                } else {
                  setFieldValue('departDate', undefined);
                }
              }
            "
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  </FormField>
</template>
