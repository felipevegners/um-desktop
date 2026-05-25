<script setup lang="ts">
import { cn } from '@/lib/utils';

import type { SidebarProps } from '.';
import { useSidebar } from './utils';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<SidebarProps>(), {
  side: 'left',
  variant: 'sidebar',
  collapsible: 'offcanvas',
});

const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
</script>

<template>
  <div
    v-if="collapsible === 'none'"
    :class="
      cn(
        'flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground',
        props.class,
      )
    "
    v-bind="$attrs"
  >
    <slot />
  </div>

  <template v-else-if="isMobile">
    <Teleport to="body">
      <div
        v-if="openMobile"
        class="!fixed !inset-0 z-[80] bg-black/75"
        @click="setOpenMobile(false)"
      />
      <aside
        v-if="openMobile"
        data-sidebar="sidebar"
        data-mobile="true"
        class="!fixed !top-0 !bottom-0 !left-0 !right-auto z-[90] h-[100dvh] w-[min(18rem,88vw)] border-r border-zinc-800 bg-zinc-950 p-0 text-white shadow-2xl"
      >
        <div class="relative p-2 flex justify-end">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Fechar menu"
            class="z-[95] bg-zinc-900 text-white rounded-md"
            @click="setOpenMobile(false)"
          >
            X
          </Button>
        </div>
        <div
          class="flex h-[100dvh] w-full flex-col overflow-y-auto bg-zinc-950 text-white"
        >
          <slot />
        </div>
      </aside>
    </Teleport>
  </template>

  <div
    v-else
    class="group peer hidden lg:block"
    :data-state="state"
    :data-collapsible="state === 'collapsed' ? collapsible : ''"
    :data-variant="variant"
    :data-side="side"
  >
    <!-- This is what handles the sidebar gap on desktop  -->
    <div
      :class="
        cn(
          'duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-linear',
          'group-data-[collapsible=offcanvas]:w-0',
          'group-data-[side=right]:rotate-180',
          variant === 'floating' || variant === 'inset'
            ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]'
            : 'group-data-[collapsible=icon]:w-[--sidebar-width-icon]',
        )
      "
    />
    <div
      :class="
        cn(
          'duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear lg:flex',
          side === 'left'
            ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
            : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
          // Adjust the padding for floating and inset variants.
          variant === 'floating' || variant === 'inset'
            ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]'
            : 'group-data-[collapsible=icon]:w-[--sidebar-width-icon]  group-data-[side=right]:border-l',
          props.class,
        )
      "
      v-bind="$attrs"
    >
      <div
        data-sidebar="sidebar"
        class="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
