<script setup lang="ts" generic="TData, TValue">
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  ColumnDef,
  ColumnFiltersState,
  ExpandedState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table';
import {
  FlexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table';
import { ChevronDown, Settings2 } from 'lucide-vue-next';
import { ref, watch } from 'vue';
import { cn, valueUpdater } from '~/lib/utils';

const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const globalFilter = ref<string>('');
const columnVisibility = ref<VisibilityState>({});
const rowSelection = ref({});
const expanded = ref<ExpandedState>({});
const columnSizing = ref<Record<string, number>>({});
const columnSizingInfo = ref<{ isResizingColumn: string | false }>({
  isResizingColumn: false,
});

// Build an initializer function to populate `columnSizing` from the passed
// column definitions. We don't call it until `props` exists (below).
const initSizingFromColumns = (cols: ColumnDef<TData, TValue>[]) => {
  const sizing: Record<string, number> = {};
  (cols || []).forEach((col: any) => {
    const id = col.id ?? col.accessorKey ?? (col.accessor && (col.accessor as any).name);
    const metaWidth =
      (col.meta && (col.meta.width ?? col.meta.size)) ?? col.size ?? col.width;
    if (id && metaWidth != null) {
      const parsed = typeof metaWidth === 'string' ? parseInt(metaWidth, 10) : metaWidth;
      if (!Number.isNaN(parsed)) sizing[id] = parsed;
    }
  });
  columnSizing.value = sizing;
};

// Global filter function that searches across user.name and code
const globalFilterFn = (row: any, columnId: string, filterValue: string): boolean => {
  if (!filterValue) return true;
  const original = row.original;
  const searchTerm = filterValue.toLowerCase();
  const userName = original?.user?.name?.toLowerCase() ?? '';
  const rideCode = original?.code?.toLowerCase() ?? '';
  // add more filters if necessary
  return userName.includes(searchTerm) || rideCode.includes(searchTerm);
};

const emit = defineEmits<{
  'update:selectedRows': [rows: TData[]];
}>();

interface TableProps {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  sortby?: string;
  columnPin?: string[];
  filterBy?: string;
  showFilter?: boolean;
  showPagination?: boolean;
  showColumnSelect?: boolean;
}

const props = withDefaults(defineProps<TableProps>(), {
  showColumnSelect: true,
  showFilter: true,
  showPagination: true,
});

// Initialize sizing from the provided column definitions (if any)
initSizingFromColumns(props.columns as ColumnDef<TData, TValue>[]);

const table = useVueTable({
  defaultColumn: {
    size: 90, // Default width for all columns
  },
  get data() {
    return props.data;
  },
  get columns() {
    return props.columns;
  },
  getCoreRowModel: getCoreRowModel(),
  //@ts-ignore
  getPaginationRowModel: props.showPagination ? getPaginationRowModel() : null,
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  globalFilterFn,
  onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: (updaterOrValue) => valueUpdater(updaterOrValue, rowSelection),
  onExpandedChange: (updaterOrValue) => valueUpdater(updaterOrValue, expanded),
  onColumnSizingChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnSizing),
  onColumnSizingInfoChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnSizingInfo),
  enableColumnResizing: true,
  columnResizeMode: 'onChange',
  state: {
    get sorting() {
      return sorting.value;
    },
    get columnFilters() {
      return columnFilters.value;
    },
    get globalFilter() {
      return globalFilter.value;
    },
    get columnVisibility() {
      return columnVisibility.value;
    },
    get rowSelection() {
      return rowSelection.value;
    },
    get expanded() {
      return expanded.value;
    },
    columnPinning: {
      left: props.columnPin,
    },
    columnSizing: columnSizing.value,
  },
});

// Watch for changes in row selection and emit selected rows
watch(
  () => rowSelection.value,
  () => {
    const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
    emit('update:selectedRows', selectedRows);
  },
  { deep: true },
);

// Watch global filter changes
watch(
  () => globalFilter.value,
  (newValue) => {
    table.setGlobalFilter(newValue);
  },
);
</script>

<template>
  <div v-if="showFilter && showColumnSelect" class="flex gap-2 items-center py-4">
    <Input
      v-if="showFilter"
      class="max-w-sm"
      :placeholder="`Filtrar por ${filterBy}`"
      :model-value="globalFilter"
      @update:model-value="globalFilter = String($event)"
    />
    <DropdownMenu v-if="showColumnSelect">
      <DropdownMenuTrigger as-child>
        <Button variant="outline" class="ml-auto">
          <Settings2 />
          Colunas <ChevronDown class="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuCheckboxItem
          v-for="column in table.getAllColumns().filter((column) => column.getCanHide())"
          :key="column.id"
          class=""
          :checked="column.getIsVisible()"
          @update:checked="
            (value) => {
              column.toggleVisibility(!!value);
            }
          "
        >
          {{ (column.columnDef?.meta as any)?.label || column.id }}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
  <div class="rounded-md border overflow-x-auto">
    <Table class="w-full table-fixed">
      <TableHeader>
        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <TableHead
            v-for="header in headerGroup.headers"
            :key="header.id"
            :data-pinned="header.column.getIsPinned()"
            :style="{
              width:
                typeof header.getSize() === 'number'
                  ? header.getSize() + 'px'
                  : header.getSize(),
              position: 'relative',
            }"
            :class="
              cn(
                {
                  'sticky bg-background/95': header.column.getIsPinned(),
                },
                header.column.getIsPinned() === 'left' ? 'left-0' : 'right-0',
              )
            "
          >
            <div class="flex items-center justify-between h-full">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
              <div
                v-if="header.column.columnDef.enableResizing !== false"
                @mousedown="header.getResizeHandler()($event)"
                @touchstart="header.getResizeHandler()($event)"
                :style="{
                  cursor: 'col-resize',
                  userSelect: 'none',
                  touchAction: 'none',
                  width: '8px',
                  height: '24px',
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor:
                    columnSizingInfo.isResizingColumn === header.id
                      ? '#3b82f6'
                      : 'transparent',
                  transition: 'background-color 0.2s',
                }"
                class="hover:bg-blue-400 cursor-col-resize"
              />
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="table.getRowModel().rows?.length">
          <template v-for="row in table.getRowModel().rows" :key="row.id">
            <TableRow :data-state="row.getIsSelected() && 'selected'">
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                :data-pinned="cell.column.getIsPinned()"
                :style="{
                  width:
                    typeof cell.column.getSize() === 'number'
                      ? cell.column.getSize() + 'px'
                      : cell.column.getSize(),
                  overflow: 'hidden',
                }"
                :class="
                  cn(
                    {
                      'sticky bg-background/95': cell.column.getIsPinned(),
                    },
                    cell.column.getIsPinned() === 'left' ? 'left-0' : 'right-0',
                  )
                "
              >
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </TableCell>
            </TableRow>
            <TableRow v-if="row.getIsExpanded()">
              <TableCell :colspan="row.getAllCells().length">
                {{ row.original }}
              </TableCell>
            </TableRow>
          </template>
        </template>

        <TableRow v-else>
          <TableCell :colspan="columns.length" class="h-24 text-center">
            Nenhum resultado encontrado.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>

  <div class="flex items-center justify-end space-x-2 py-4">
    <div
      v-if="table.getSelectedRowModel().rows.length > 0"
      class="flex-1 text-sm text-muted-foreground"
    >
      {{ table.getSelectedRowModel().rows.length }} de
      {{ table.getFilteredRowModel().rows.length }} resultado(s) selecionados
    </div>
    <div v-if="showPagination" class="space-x-2">
      <Button
        variant="outline"
        size="sm"
        :disabled="!table.getCanPreviousPage()"
        @click="table.previousPage()"
      >
        Anterior
      </Button>
      <Button
        variant="outline"
        size="sm"
        :disabled="!table.getCanNextPage()"
        @click="table.nextPage()"
      >
        Próxima
      </Button>
    </div>
  </div>
</template>
