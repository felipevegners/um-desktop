<script setup lang="ts">
import { Bell } from 'lucide-vue-next';

const hasNotifications = ref(true);
const notificationCount = 6;
</script>

<template>
  <div class="flex items-center gap-2 px-6">
    <div
      :class="hasNotifications ? 'badge' : ''"
      :data-notifications="notificationCount"
    >
      <Bell />
    </div>
  </div>
</template>

<style scoped>
.badge {
  position: relative;

  &:before {
    content: attr(data-notifications);
    position: absolute;
    top: -10px;
    right: -10px;
    padding: 4px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background-color: #dc2626;
    font-size: 11px;
    line-height: 15px;
    font-weight: bold;
    text-align: center;
    color: #ffffff;
    z-index: 49;
  }
}
</style>
