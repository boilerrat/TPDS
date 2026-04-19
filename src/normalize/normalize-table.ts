import { documentTableSchema } from "../schema/zod";
import type { BoundingBox, JsonRecord, Provenance, RowType, SourceRef, ValueType } from "../types/common";
import type {
  DocumentTable,
  HeaderGroup,
  PageSpan,
  TableCell,
  TableColumn,
  TableContinuity,
  TableRow
} from "../types/table";
import { createCellId, createId } from "../utils/ids";
import { asBoolean, asNumber, asRecordArray, asString, asStringArray, isRecord } from "../utils/guards";
import { normalizeText } from "../utils/text";
import { sortCells, sortPages, sortRows } from "../utils/table";
import { inferHeaders } from "./infer-headers";

export type NormalizeTableOptions = {
  standardVersion?: string;
  inferHeaders?: boolean;
  preserveExistingCellIds?: boolean;
};

const valueTypes = new Set<ValueType>([
  "text",
  "number",
  "currency",
  "percent",
  "date",
  "boolean",
  "mixed"
]);

const rowTypes = new Set<RowType>(["header", "body", "footer", "note"]);

const readBoundingBox = (value: unknown): BoundingBox | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const x = asNumber(value.x);
  const y = asNumber(value.y);
  const width = asNumber(value.width);
  const height = asNumber(value.height);

  if (x === undefined || y === undefined || width === undefined || height === undefined) {
    return undefined;
  }

  const coordinateSpace =
    value.coordinateSpace === "pdf" || value.coordinateSpace === "image" || value.coordinateSpace === "normalized"
      ? value.coordinateSpace
      : undefined;

  return {
    x,
    y,
    width,
    height,
    coordinateSpace
  };
};

const readSourceRefs = (value: unknown): SourceRef[] | undefined => {
  const refs = asRecordArray(value)?.flatMap((entry) => {
    const page = asNumber(entry.page);
    if (page === undefined) {
      return [];
    }

    return [
      {
        page,
        extractor: asString(entry.extractor),
        extractorVersion: asString(entry.extractorVersion),
        confidence: asNumber(entry.confidence)
      }
    ];
  });

  return refs && refs.length > 0 ? refs : undefined;
};

const readProvenance = (value: unknown): Provenance[] | undefined => {
  const provenance = asRecordArray(value)?.flatMap((entry) => {
    const step = asString(entry.step);
    if (!step) {
      return [];
    }

    return [
      {
        step,
        tool: asString(entry.tool),
        version: asString(entry.version),
        timestamp: asString(entry.timestamp),
        notes: asString(entry.notes)
      }
    ];
  });

  return provenance && provenance.length > 0 ? provenance : undefined;
};

const readPageSpans = (value: unknown): PageSpan[] | undefined => {
  const spans = asRecordArray(value)?.flatMap((entry) => {
    const page = asNumber(entry.page);
    if (page === undefined) {
      return [];
    }

    return [{ page, bbox: readBoundingBox(entry.bbox) }];
  });

  return spans && spans.length > 0 ? spans : undefined;
};

const readColumns = (value: unknown): TableColumn[] => {
  const columns = asRecordArray(value)?.flatMap((entry) => {
    const colIndex = asNumber(entry.colIndex);
    if (colIndex === undefined) {
      return [];
    }

    return [
      {
        colIndex,
        label: asString(entry.label),
        inferredLabelPath: asStringArray(entry.inferredLabelPath),
        units: asString(entry.units),
        metadata: isRecord(entry.metadata) ? (entry.metadata as JsonRecord) : undefined
      }
    ];
  });

  return columns ?? [];
};

const readHeaderGroups = (value: unknown): HeaderGroup[] | undefined => {
  const groups = asRecordArray(value)?.flatMap((entry) => {
    const level = asNumber(entry.level);
    const colStart = asNumber(entry.colStart);
    const colEnd = asNumber(entry.colEnd);
    const groupId = asString(entry.groupId);
    const label = asString(entry.label);

    if (groupId === undefined || label === undefined || level === undefined || colStart === undefined || colEnd === undefined) {
      return [];
    }

    return [{ groupId, label, level, colStart, colEnd }];
  });

  return groups && groups.length > 0 ? groups : undefined;
};

const readCells = (
  value: unknown,
  tableId: string,
  preserveExistingCellIds: boolean
): TableCell[] => {
  const rows = asRecordArray(value) ?? [];

  return rows.flatMap((entry) => {
    const rowIndex = asNumber(entry.rowIndex);
    const colIndex = asNumber(entry.colIndex);
    const textRaw = asString(entry.textRaw) ?? asString(entry.textNormalized) ?? "";

    if (rowIndex === undefined || colIndex === undefined) {
      return [];
    }

    const textNormalized = normalizeText(asString(entry.textNormalized) ?? textRaw);
    const candidateCellId = asString(entry.cellId);
    const valueType = asString(entry.valueType);

    return [
      {
        cellId: preserveExistingCellIds && candidateCellId ? candidateCellId : createCellId(tableId, rowIndex, colIndex),
        rowIndex,
        colIndex,
        textRaw,
        textNormalized,
        isHeader: asBoolean(entry.isHeader),
        headerLevel: asNumber(entry.headerLevel),
        rowSpan: asNumber(entry.rowSpan) ?? 1,
        colSpan: asNumber(entry.colSpan) ?? 1,
        inferredHeaders: asStringArray(entry.inferredHeaders),
        units: asString(entry.units),
        valueType: valueType && valueTypes.has(valueType as ValueType) ? (valueType as ValueType) : undefined,
        bbox: readBoundingBox(entry.bbox),
        page: asNumber(entry.page),
        sourceRefs: readSourceRefs(entry.sourceRefs),
        metadata: isRecord(entry.metadata) ? (entry.metadata as JsonRecord) : undefined
      }
    ];
  });
};

const readRows = (value: unknown, cells: TableCell[]): TableRow[] => {
  const rows = asRecordArray(value)?.flatMap((entry) => {
    const rowIndex = asNumber(entry.rowIndex);
    if (rowIndex === undefined) {
      return [];
    }

    const rowTypeValue = asString(entry.rowType);
    const rowCells = cells.filter((cell) => cell.rowIndex === rowIndex);

    return [
      {
        rowIndex,
        rowType: rowTypeValue && rowTypes.has(rowTypeValue as RowType) ? (rowTypeValue as RowType) : undefined,
        cellIds:
          asStringArray(entry.cellIds)?.filter((cellId) => rowCells.some((cell) => cell.cellId === cellId)) ??
          rowCells.map((cell) => cell.cellId),
        page: asNumber(entry.page),
        repeatedHeaderRow: asBoolean(entry.repeatedHeaderRow)
      }
    ];
  });

  if (rows && rows.length > 0) {
    return rows;
  }

  const grouped = new Map<number, TableCell[]>();
  for (const cell of cells) {
    const group = grouped.get(cell.rowIndex) ?? [];
    group.push(cell);
    grouped.set(cell.rowIndex, group);
  }

  return [...grouped.entries()].map(([rowIndex, rowCells]) => ({
    rowIndex,
    cellIds: rowCells.sort((left, right) => left.colIndex - right.colIndex).map((cell) => cell.cellId),
    rowType: rowCells.every((cell) => cell.isHeader) ? "header" : "body",
    page: rowCells[0]?.page
  }));
};

const inferColumnsFromCells = (cells: TableCell[]): TableColumn[] => {
  const columnIndexes = [...new Set(cells.map((cell) => cell.colIndex))].sort((left, right) => left - right);
  return columnIndexes.map((colIndex) => ({ colIndex }));
};

const derivePages = (record: Record<string, unknown>, rows: TableRow[], cells: TableCell[], pageSpans?: PageSpan[]): number[] => {
  const explicitPages = Array.isArray(record.pages)
    ? record.pages.filter((page): page is number => typeof page === "number" && Number.isFinite(page))
    : [];
  const rowPages = rows.map((row) => row.page).filter((page): page is number => page !== undefined);
  const cellPages = cells.map((cell) => cell.page).filter((page): page is number => page !== undefined);
  const spanPages = pageSpans?.map((pageSpan) => pageSpan.page) ?? [];
  return sortPages([...explicitPages, ...rowPages, ...cellPages, ...spanPages]);
};

const markRepeatedHeaders = (rows: TableRow[], cells: TableCell[]): TableRow[] => {
  const headerSignatures = new Set<string>();

  return sortRows(rows).map((row) => {
    const rowCells = cells
      .filter((cell) => cell.rowIndex === row.rowIndex)
      .sort((left, right) => left.colIndex - right.colIndex);
    const signature = rowCells.map((cell) => cell.textNormalized).join("|");
    const isHeaderRow = row.rowType === "header" || rowCells.every((cell) => cell.isHeader);

    if (!isHeaderRow) {
      return row;
    }

    if (headerSignatures.has(signature)) {
      return {
        ...row,
        rowType: "header",
        repeatedHeaderRow: true
      };
    }

    headerSignatures.add(signature);
    return {
      ...row,
      rowType: "header"
    };
  });
};

const normalizeContinuity = (record: Record<string, unknown>, pages: number[]): TableContinuity | undefined => {
  if (!isRecord(record.continuity)) {
    return pages.length > 1 ? { isMultiPage: true } : undefined;
  }

  return {
    isMultiPage: asBoolean(record.continuity.isMultiPage) ?? pages.length > 1,
    continuedFromPreviousPage: asBoolean(record.continuity.continuedFromPreviousPage),
    continuesOnNextPage: asBoolean(record.continuity.continuesOnNextPage),
    logicalTableGroupId: asString(record.continuity.logicalTableGroupId)
  };
};

export const normalizeTable = (
  input: unknown,
  options: NormalizeTableOptions = {}
): DocumentTable => {
  if (!isRecord(input)) {
    throw new TypeError("normalizeTable expects an object input.");
  }

  const standardVersion = options.standardVersion ?? asString(input.standardVersion) ?? "1.0.0";
  const tableId = asString(input.tableId) ?? createId("table");
  const cells = sortCells(readCells(input.cells, tableId, options.preserveExistingCellIds ?? false));
  const rows = markRepeatedHeaders(sortRows(readRows(input.rows, cells)), cells);
  const columns = readColumns(input.columns);
  const pageSpans = readPageSpans(input.pageSpans);
  const pages = derivePages(input, rows, cells, pageSpans);

  const normalized: DocumentTable = {
    standardVersion,
    tableId,
    sourceDocumentId: asString(input.sourceDocumentId),
    sourceFileName: asString(input.sourceFileName),
    title: asString(input.title),
    caption: asString(input.caption),
    sectionPath: asStringArray(input.sectionPath),
    notes: asStringArray(input.notes),
    footnotes: asStringArray(input.footnotes),
    pages,
    pageSpans,
    columns: columns.length > 0 ? columns : inferColumnsFromCells(cells),
    rows,
    cells,
    headerGroups: readHeaderGroups(input.headerGroups),
    metadata: isRecord(input.metadata) ? (input.metadata as JsonRecord) : undefined,
    continuity: normalizeContinuity(input, pages),
    provenance: readProvenance(input.provenance)
  };

  const withHeaders = options.inferHeaders === false ? normalized : inferHeaders(normalized);
  return documentTableSchema.parse(withHeaders);
};
