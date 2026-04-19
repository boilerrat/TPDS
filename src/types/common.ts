export type CoordinateSpace = "pdf" | "image" | "normalized";

export type ValueType =
  | "text"
  | "number"
  | "currency"
  | "percent"
  | "date"
  | "boolean"
  | "mixed";

export type RowType = "header" | "body" | "footer" | "note";

export type JsonRecord = Record<string, unknown>;

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateSpace?: CoordinateSpace;
};

export type SourceRef = {
  page: number;
  extractor?: string;
  extractorVersion?: string;
  confidence?: number;
};

export type Provenance = {
  step: string;
  tool?: string;
  version?: string;
  timestamp?: string;
  notes?: string;
};
