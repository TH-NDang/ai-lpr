import "@tanstack/react-table";

declare module "@tanstack/table-core" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?:
      | "text"
      | "range"
      | "selectBoolean"
      | "selectString"
      | "dateRange";
    selectOptions?: string[];
  }
}
