<template>
  <div class="flex items-center gap-2 px-6">
    <div :class="hasNotifications ? 'badge' : ''">
      <Bell />
    </div>
    <h4 class="text-sm">Notificações</h4>
  </div>
</template>

<script setup lang="ts">
import { Bell } from "lucide-vue-next";
const hasNotifications = true;
</script>

<style scoped>
.badge {
  position: relative;

  &:before {
    content: " ";
    position: absolute;
    top: -3px;
    right: 0;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #dc2626;
    z-index: 9999;
  }
}
</style>
