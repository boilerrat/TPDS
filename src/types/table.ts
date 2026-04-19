import type {
  BoundingBox,
  JsonRecord,
  Provenance,
  RowType,
  SourceRef,
  ValueType
} from "./common";

export type TableColumn = {
  colIndex: number;
  label?: string;
  inferredLabelPath?: string[];
  units?: string;
  metadata?: JsonRecord;
};

export type HeaderGroup = {
  groupId: string;
  label: string;
  level: number;
  colStart: number;
  colEnd: number;
};

export type TableCell = {
  cellId: string;
  rowIndex: number;
  colIndex: number;
  textRaw: string;
  textNormalized: string;
  isHeader?: boolean;
  headerLevel?: number;
  rowSpan?: number;
  colSpan?: number;
  inferredHeaders?: string[];
  units?: string;
  valueType?: ValueType;
  bbox?: BoundingBox;
  page?: number;
  sourceRefs?: SourceRef[];
  metadata?: JsonRecord;
};

export type TableRow = {
  rowIndex: number;
  rowType?: RowType;
  cellIds: string[];
  page?: number;
  repeatedHeaderRow?: boolean;
};

export type PageSpan = {
  page: number;
  bbox?: BoundingBox;
};

export type TableContinuity = {
  isMultiPage: boolean;
  continuedFromPreviousPage?: boolean;
  continuesOnNextPage?: boolean;
  logicalTableGroupId?: string;
};

export type FidelityWarning =
  | "merged-cells-present"
  | "headers-inferred"
  | "markdown-lossy"
  | "repeated-headers-detected"
  | "ocr-noise-suspected"
  | "multi-page-merged";

export type DocumentTable = {
  standardVersion: string;
  tableId: string;
  sourceDocumentId?: string;
  sourceFileName?: string;
  title?: string;
  caption?: string;
  sectionPath?: string[];
  notes?: string[];
  footnotes?: string[];
  pages: number[];
  pageSpans?: PageSpan[];
  columns: TableColumn[];
  rows: TableRow[];
  cells: TableCell[];
  headerGroups?: HeaderGroup[];
  metadata?: JsonRecord;
  continuity?: TableContinuity;
  provenance?: Provenance[];
  fidelityWarnings?: FidelityWarning[];
};
