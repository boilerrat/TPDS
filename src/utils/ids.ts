export const createId = (prefix: string): string =>
  `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export const createCellId = (tableId: string, rowIndex: number, colIndex: number): string =>
  `${tableId}:r${rowIndex}c${colIndex}`;

export const createChunkId = (
  tableId: string,
  chunkType: string,
  suffix: string | number
): string => `${tableId}:${chunkType}:${suffix}`;
