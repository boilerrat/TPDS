# Schema Notes

Primary entities:

- `DocumentTable`
- `TableColumn`
- `TableRow`
- `TableCell`
- `HeaderGroup`
- `BoundingBox`
- `SourceRef`
- `Provenance`

The runtime validator is implemented in `src/schema/zod.ts` and exported as `documentTableSchema`.
