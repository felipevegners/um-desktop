<script setup lang="ts">
import { Bell } from "lucide-vue-next";
const hasNotifications = ref(true);
const notificationCount = 10;
</script>

<template>
  <div class="flex items-center gap-2 px-6">
    <div
      :class="hasNotifications ? 'badge' : ''"
      :data-notifications="notificationCount"
    >
      <Bell />
    </div>
    <!-- <h4 class="text-sm">Notificações</h4> -->
  </div>
</template>

<style scoped>
.badge {
  position: relative;

  &:before {
    content: attr(data-notifications);
    position: absolute;
    top: -12px;
    right: -12px;
    padding: 2px;
    width: 24px;
    height: 20px;
    border-radius: 6px;
    background-color: #dc2626;
    font-size: 12px;
    font-weight: bold;
    text-align: center;
    color: #ffffff;
    z-index: 49;
  }
}
</style>
