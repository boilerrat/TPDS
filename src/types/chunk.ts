import type { SourceRef } from "./common";

export type TableChunkType = "summary" | "row" | "row-group" | "notes";

export type TableChunk = {
  chunkId: string;
  tableId: string;
  chunkType: TableChunkType;
  text: string;
  rowIndexes: number[];
  pages: number[];
  sectionPath?: string[];
  title?: string;
  caption?: string;
  tokenEstimate: number;
  sourceRefs: SourceRef[];
  metadata?: Record<string, unknown>;
};

export type BuildRowChunksOptions = {
  includeRepeatedHeaders?: boolean;
};

export type BuildTableChunksOptions = BuildRowChunksOptions & {
  rowGroupSize?: number;
  includeSummaryChunk?: boolean;
  includeRowChunks?: boolean;
  includeRowGroupChunks?: boolean;
  includeNotesChunk?: boolean;
};

export type MarkdownWarning = "markdown-lossy-fallback";

export type MarkdownExportResult = {
  markdown: string;
  fidelity: "lossless" | "lossy";
  warnings: MarkdownWarning[];
};
