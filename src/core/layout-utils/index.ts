import { ModuleConfig } from '@/core/registry';

export const LOGICAL_COLUMNS = 4;
export const COLUMN_WIDTH = 2;
export const GRID_COLUMNS = LOGICAL_COLUMNS * COLUMN_WIDTH;
export const MIN_GRID_ROWS = 8;
export const CELL_SIZE = 160;
export const GRID_GAP = 20;
export const MIN_WIDGET_HEIGHT = 1;
export const MAX_WIDGET_HEIGHT = 4;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function widthFromLogicalColumns(logicalColumns: number) {
  return clamp(Math.round(logicalColumns), 1, LOGICAL_COLUMNS) * COLUMN_WIDTH;
}

export function logicalColumnsFromWidth(width: number | undefined) {
  return clamp(Math.round((width ?? COLUMN_WIDTH) / COLUMN_WIDTH), 1, LOGICAL_COLUMNS);
}

export function normalizeWidgetSize(item: ModuleConfig) {
  return {
    ...item,
    w: widthFromLogicalColumns(logicalColumnsFromWidth(item.w)),
    h: clamp(Math.round(item.h ?? MIN_WIDGET_HEIGHT), MIN_WIDGET_HEIGHT, MAX_WIDGET_HEIGHT),
  };
}

export function getItemColumn(item: ModuleConfig) {
  const x = item.x ?? 0;
  return clamp(Math.round(x / COLUMN_WIDTH), 0, LOGICAL_COLUMNS - 1);
}

export function collides(a: ModuleConfig, b: ModuleConfig) {
  const ax = a.x ?? 0;
  const ay = a.y ?? 0;
  const bx = b.x ?? 0;
  const by = b.y ?? 0;
  const aw = a.w ?? COLUMN_WIDTH;
  const ah = a.h ?? MIN_WIDGET_HEIGHT;
  const bw = b.w ?? COLUMN_WIDTH;
  const bh = b.h ?? MIN_WIDGET_HEIGHT;

  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function isValidColumnTarget(item: ModuleConfig, column: number, y: number) {
  const normalized = normalizeWidgetSize(item);
  const x = column * COLUMN_WIDTH;
  const width = normalized.w ?? COLUMN_WIDTH;

  return (
    Number.isInteger(column) &&
    Number.isInteger(y) &&
    column >= 0 &&
    column < LOGICAL_COLUMNS &&
    y >= 0 &&
    x + width <= GRID_COLUMNS
  );
}

function isValidGridPosition(item: ModuleConfig) {
  const x = item.x ?? -1;
  const y = item.y ?? -1;
  const width = item.w ?? COLUMN_WIDTH;

  return (
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    y >= 0 &&
    x % COLUMN_WIDTH === 0 &&
    x + width <= GRID_COLUMNS
  );
}

function findFreePosition(item: ModuleConfig, placed: ModuleConfig[]) {
  const normalized = normalizeWidgetSize(item);
  const width = normalized.w ?? COLUMN_WIDTH;

  for (let y = 0; y < 120; y += 1) {
    for (let column = 0; column < LOGICAL_COLUMNS; column += 1) {
      const x = column * COLUMN_WIDTH;

      if (x + width > GRID_COLUMNS) {
        continue;
      }

      const candidate = { ...normalized, x, y };
      if (!placed.some((placedItem) => collides(candidate, placedItem))) {
        return { x, y };
      }
    }
  }

  return { x: 0, y: placed.length };
}

export function normalizeLayout(layout: ModuleConfig[]) {
  const placed: ModuleConfig[] = [];
  let changed = false;

  const normalizedLayout = layout.map((item) => {
    const sizedItem = normalizeWidgetSize(item);

    if (
      sizedItem.w !== item.w ||
      sizedItem.h !== item.h ||
      sizedItem.hidden !== item.hidden
    ) {
      changed = true;
    }

    if (sizedItem.hidden) {
      return sizedItem;
    }

    const needsPosition =
      !isValidGridPosition(sizedItem) ||
      placed.some((placedItem) => collides(sizedItem, placedItem));

    if (needsPosition) {
      const position = findFreePosition(sizedItem, placed);
      const positionedItem = { ...sizedItem, ...position };
      placed.push(positionedItem);
      changed = true;
      return positionedItem;
    }

    const positionedItem = {
      ...sizedItem,
      x: sizedItem.x ?? 0,
      y: sizedItem.y ?? 0,
    };
    placed.push(positionedItem);
    return positionedItem;
  });

  return { layout: normalizedLayout, changed };
}

export function moveItemToGridTarget(
  layout: ModuleConfig[],
  activeId: string,
  column: number,
  y: number
) {
  const activeItem = layout.find((item) => item.id === activeId);

  if (!activeItem || !isValidColumnTarget(activeItem, column, y)) {
    return layout;
  }

  const x = column * COLUMN_WIDTH;
  const movedItem = normalizeWidgetSize({ ...activeItem, x, y });
  const remainingItems = layout.filter((item) => item.id !== activeId);
  const beforeTarget = remainingItems.filter((item) => {
    const itemY = item.y ?? 0;
    const itemX = item.x ?? 0;

    return itemY < y || (itemY === y && itemX < x);
  });
  const afterTarget = remainingItems.filter((item) => !beforeTarget.includes(item));

  return normalizeLayout([...beforeTarget, movedItem, ...afterTarget]).layout;
}
