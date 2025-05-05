<script setup lang="ts">
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
} from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { type DateValue, getLocalTimeZone, today } from '@internationalized/date';
import { useVModel } from '@vueuse/core';
import {
  CalendarRoot,
  type CalendarRootEmits,
  type CalendarRootProps,
  useDateFormatter,
  useForwardPropsEmits,
} from 'reka-ui';
import { createDecade, createYear, toDate } from 'reka-ui/date';
import { type HTMLAttributes, type Ref, computed } from 'vue';

const props = withDefaults(
  defineProps<CalendarRootProps & { class?: HTMLAttributes['class'] }>(),
  {
    modelValue: undefined,
    placeholder() {
      return today(getLocalTimeZone());
    },
    weekdayFormat: 'short',
  },
);
const emits = defineEmits<CalendarRootEmits>();

const delegatedProps = computed(() => {
  const { class: _, placeholder: __, ...delegated } = props;

  return delegated;
});

const placeholder = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: today(getLocalTimeZone()),
}) as Ref<DateValue>;

const forwarded = useForwardPropsEmits(delegatedProps, emits);

const formatter = useDateFormatter('pt');
</script>

<template>
  <Popover>
    <PopoverTrigger class="ml-3"> {{ placeholder }} </PopoverTrigger>
    <PopoverContent class="md:left-[90px] md:top-[10px] relative">
      <CalendarRoot
        v-slot="{ date, grid, weekDays }"
        v-model:placeholder="placeholder"
        v-bind="forwarded"
        :class="cn(props.class)"
      >
        <CalendarHeader>
          <CalendarHeading class="flex w-full items-center justify-between gap-2">
            <Select
              :default-value="placeholder.month.toString()"
              @update:model-value="
                (v: any) => {
                  if (!v || !placeholder) return;
                  if (Number(v) === placeholder?.month) return;
                  placeholder = placeholder.set({
                    month: Number(v),
                  });
                }
              "
            >
              <SelectTrigger aria-label="Mês" class="w-[60%]">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent class="max-h-[200px]">
                <SelectItem
                  v-for="month in createYear({ dateObj: date })"
                  :key="month.toString()"
                  :value="month.month.toString()"
                  class="capitalize"
                >
                  {{ formatter.custom(toDate(month), { month: 'long' }) }}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              :default-value="placeholder.year.toString()"
              @update:model-value="
                (v: any) => {
                  if (!v || !placeholder) return;
                  if (Number(v) === placeholder?.year) return;
                  placeholder = placeholder.set({
                    year: Number(v),
                  });
                }
              "
            >
              <SelectTrigger aria-label="Ano" class="w-[40%]">
                <SelectValue placeholder="Selecione o ano" />
              </SelectTrigger>
              <SelectContent class="max-h-[200px]">
                <SelectItem
                  v-for="yearValue in createDecade({
                    dateObj: date,
                    startIndex: -10,
                    endIndex: 10,
                  })"
                  :key="yearValue.toString()"
                  :value="yearValue.year.toString()"
                >
                  {{ yearValue.year }}
                </SelectItem>
              </SelectContent>
            </Select>
          </CalendarHeading>
        </CalendarHeader>

        <div class="flex flex-col space-y-4 pt-4 sm:flex-row sm:gap-x-4 sm:gap-y-0">
          <CalendarGrid v-for="month in grid" :key="month.value.toString()">
            <CalendarGridHead>
              <CalendarGridRow>
                <CalendarHeadCell v-for="day in weekDays" :key="day">
                  {{ day }}
                </CalendarHeadCell>
              </CalendarGridRow>
            </CalendarGridHead>
            <CalendarGridBody class="grid">
              <CalendarGridRow
                v-for="(weekDates, index) in month.rows"
                :key="`weekDate-${index}`"
                class="mt-2 w-full"
              >
                <CalendarCell
                  v-for="weekDate in weekDates"
                  :key="weekDate.toString()"
                  :date="weekDate"
                >
                  <CalendarCellTrigger :day="weekDate" :month="month.value" />
                </CalendarCell>
              </CalendarGridRow>
            </CalendarGridBody>
          </CalendarGrid>
        </div>
      </CalendarRoot>
    </PopoverContent>
  </Popover>
</template>
