let idCounter = 0;

export const createId = (prefix: string): string => {
  idCounter += 1;
  return `${prefix}-${idCounter.toString(36)}`;
};

export const createCellId = (tableId: string, rowIndex: number, colIndex: number): string =>
  `${tableId}:r${rowIndex}c${colIndex}`;

export const createChunkId = (
  tableId: string,
  chunkType: string,
  suffix: string | number
): string => `${tableId}:${chunkType}:${suffix}`;
