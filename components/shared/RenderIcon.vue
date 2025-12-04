<template>
  <component :is="iconComponent" :size="size || 16" />
</template>

<script setup>
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  Building,
  CalendarCheck,
  CalendarDays,
  Compass,
  CreditCard,
  FileChartColumn,
  HandCoins,
  Home,
  SquareMinus as IconNuxt,
  LayoutDashboard,
  MapPin,
  MapPinCheckIcon,
  MapPlus,
  MessageCircleMore,
  MonitorCheck,
  PlaneTakeoff,
  Play,
  ScrollText,
  Settings,
  ShieldCheck,
  ShieldUser,
  Tickets,
  UserCheck,
  UserX,
} from 'lucide-vue-next';
import { computed, ref } from 'vue';

const props = defineProps({
  name: null,
  size: null,
});

const iconName = ref(props?.name || 'ArrowRight');

const iconComponent = computed(() => {
  const icons = {
    Home,
    Settings,
    ArrowRight,
    ArrowLeft,
    CalendarDays,
    HandCoins,
    LayoutDashboard,
    ScrollText,
    FileChartColumn,
    MapPlus,
    BriefcaseBusiness,
    PlaneTakeoff,
    Compass,
    Tickets,
    CalendarCheck,
    ShieldUser,
    ShieldCheck,
    MonitorCheck,
    IconNuxt,
    CreditCard,
    Building,
    Banknote,
    Play,
    MapPin,
    MapPinCheckIcon,
    UserCheck,
    UserX,
    Whatsapp: MessageCircleMore,
  };
  return icons[iconName.value] || null;
});
</script>
