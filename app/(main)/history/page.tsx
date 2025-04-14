"use client";

import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  SortModelItem,
  ModuleRegistry,
  FilterChangedEvent,
  SortChangedEvent,
  ValueFormatterParams,
} from "ag-grid-community";
import { CheckCircle2, AlertCircle } from "lucide-react"; // Import icons for boolean display
import { parseAsString, useQueryState } from "nuqs";
import { getHistoryAction } from "../actions"; // Use the new action
// Remove transformDbRecordToColumnSchema import as it's not used here anymore

// Define the type for grid rows based on HistoryGridRow in actions.ts
interface HistoryGridRow {
  id: number;
  plateNumber: string;
  confidence: number;
  date: Date | null;
  provinceName: string | null;
  vehicleType: string | null;
  imageUrl: string | null;
  isValidFormat?: boolean | null;
  ocrEngine?: string | null;
  detectionId?: number;
  isVerified?: boolean | null;
}

// Helper function for boolean cell rendering
const booleanCellRenderer = (params: { value: boolean | null | undefined }) => {
  if (params.value === true) {
    return <CheckCircle2 className="text-green-500" size={16} />;
  } else if (params.value === false) {
    return <AlertCircle className="text-red-500" size={16} />;
  }
  return null; // Handle null or undefined
};

// Helper function for boolean value formatting (for filter/tooltip)
const booleanFormatter = (params: ValueFormatterParams): string => {
  if (params.value === true) return "Yes";
  if (params.value === false) return "No";
  return "";
};

// Define column definitions for AG Grid based on HistoryGridRow
const columnDefs: ColDef<HistoryGridRow>[] = [
  {
    field: "plateNumber",
    headerName: "Biển số",
    filter: "agTextColumnFilter",
    sortable: true,
  },
  {
    field: "confidence",
    headerName: "Độ tin cậy (%)",
    filter: "agNumberColumnFilter",
    sortable: true,
    valueFormatter: (params) => (params.value ? `${params.value}%` : ""),
  },
  {
    field: "date",
    headerName: "Thời gian",
    filter: "agDateColumnFilter",
    sortable: true,
    valueFormatter: (params) =>
      params.value ? new Date(params.value).toLocaleString("vi-VN") : "", // Format date/time
    filterParams: {
      // Provide comparator for date filtering
      comparator: function (filterLocalDateAtMidnight: Date, cellValue: string) {
        const dateAsString = cellValue;
        if (dateAsString == null) return -1;
        const cellDate = new Date(dateAsString);
        if (filterLocalDateAtMidnight.getTime() == cellDate.getTime()) {
          return 0;
        }
        if (cellDate < filterLocalDateAtMidnight) {
          return -1;
        }
        if (cellDate > filterLocalDateAtMidnight) {
          return 1;
        }
        return 0;
      },
    },
  },
  {
    field: "provinceName",
    headerName: "Tỉnh/TP",
    filter: "agTextColumnFilter",
    sortable: true,
  },
  {
    field: "vehicleType",
    headerName: "Loại phương tiện",
    filter: "agTextColumnFilter",
    sortable: true,
  },
  {
    field: "isValidFormat",
    headerName: "Định dạng hợp lệ",
    filter: "agSetColumnFilter", // Use Set Filter for boolean
    sortable: true,
    cellRenderer: booleanCellRenderer, // Use icon renderer
    valueFormatter: booleanFormatter, // Text for filter/tooltip
    filterParams: {
      values: [true, false], // Provide values for Set Filter
      valueFormatter: booleanFormatter, // Format values in filter
    },
    width: 150,
    cellStyle: { textAlign: "center" },
  },
  {
    field: "ocrEngine",
    headerName: "OCR Engine",
    filter: "agTextColumnFilter",
    sortable: true,
  },
  {
    field: "isVerified",
    headerName: "Đã xác thực",
    filter: "agSetColumnFilter", // Use Set Filter for boolean
    sortable: true,
    cellRenderer: booleanCellRenderer, // Use icon renderer
    valueFormatter: booleanFormatter, // Text for filter/tooltip
    filterParams: {
      values: [true, false],
      valueFormatter: booleanFormatter,
    },
    width: 130,
    cellStyle: { textAlign: "center" },
  },
  {
    field: "imageUrl",
    headerName: "Ảnh gốc",
    cellRenderer: (params: { value?: string }) =>
      params.value ? (
        <img
          src={params.value}
          alt="Biển số đã xử lý"
          style={{ height: "30px", objectFit: "contain" }}
          loading="lazy"
        />
      ) : null,
    sortable: false,
    filter: false,
    width: 100,
  },
  // Add more columns as needed (e.g., detectionId if useful)
];

const HistoryPage: React.FC = () => {
  const gridRef = useRef<AgGridReact<HistoryGridRow>>(null);
  const [rowData, setRowData] = useState<HistoryGridRow[]>([]); // Use new row type
  const [isLoading, setIsLoading] = useState(true); // Loading state

  // Use nuqs to read/write state from/to URL
  const [sortModelNuqs, setSortModelNuqs] = useQueryState(
    "sortModel",
    parseAsString.withOptions({ shallow: false }).withDefault("[]")
  );
  const [filterModelNuqs, setFilterModelNuqs] = useQueryState(
    "filterModel",
    parseAsString.withOptions({ shallow: false }).withDefault("{}")
  );

  // Fetch data using the new server action
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Parse initial models from nuqs for the first fetch
        const initialSortModel = JSON.parse(sortModelNuqs);
        const initialFilterModel = JSON.parse(filterModelNuqs);

        // Call the new action
        const result = await getHistoryAction({
          sortModel: initialSortModel,
          filterModel: initialFilterModel,
        });

        if (result.success) {
          setRowData(result.rows); // Set data with the correct type
        } else {
          console.error("Failed to fetch history data:", result.error);
          setRowData([]); // Clear data on error
          // Consider showing an error message to the user
        }
      } catch (error) {
        console.error("Error fetching history data:", error);
        setRowData([]);
        // Consider showing an error message to the user
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    // Dependencies remain the same for now
  }, [sortModelNuqs, filterModelNuqs]);

  // Restore grid state from URL when grid is ready
  const onGridReady = useCallback(
    (params: GridReadyEvent<HistoryGridRow>) => {
      // Specify grid type
      try {
        const initialSortModel = JSON.parse(sortModelNuqs);
        const initialFilterModel = JSON.parse(filterModelNuqs);

        // Apply initial sort state
        if (initialSortModel && initialSortModel.length > 0) {
          // Map colId to ensure they exist in the new columnDefs
          const validSortState = initialSortModel
            .filter((s: SortModelItem) =>
              columnDefs.some((col) => col.field === s.colId)
            )
            .map((s: SortModelItem) => ({ colId: s.colId, sort: s.sort }));

          if (validSortState.length > 0) {
            params.api.applyColumnState({
              state: validSortState,
              defaultState: { sort: null },
            });
          }
        }
        // Apply initial filter state
        if (initialFilterModel && Object.keys(initialFilterModel).length > 0) {
          // Filter the model to include only keys present in columnDefs
          const validFilterModel: { [key: string]: any } = {};
          for (const key in initialFilterModel) {
            if (columnDefs.some((col) => col.field === key)) {
              validFilterModel[key] = initialFilterModel[key];
            }
          }
          if (Object.keys(validFilterModel).length > 0) {
            params.api.setFilterModel(validFilterModel);
          }
        }
      } catch (e) {
        console.error("Failed to parse or apply initial state from URL", e);
      }
    },
    [sortModelNuqs, filterModelNuqs] // Dependencies for initial state restoration
  );

  // Update nuqs state when user interacts with the grid
  const onSortChanged = useCallback(
    (event: SortChangedEvent<HistoryGridRow>) => {
      // Specify grid type
      // Get sort state directly using getColumnState
      const currentSortModel = event.api
        .getColumnState()
        .filter((s) => s.sort != null)
        .map((s) => ({ colId: s.colId!, sort: s.sort })); // Map to SortModelItem structure, ensure colId is string
      setSortModelNuqs(JSON.stringify(currentSortModel));
    },
    [setSortModelNuqs]
  );

  const onFilterChanged = useCallback(
    (event: FilterChangedEvent<HistoryGridRow>) => {
      // Specify grid type
      const currentFilterModel = event.api.getFilterModel();
      setFilterModelNuqs(JSON.stringify(currentFilterModel));
    },
    [setFilterModelNuqs]
  );

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      resizable: true,
      floatingFilter: true,
      sortable: true,
      filter: true,
      minWidth: 100, // Set a default minimum width
    };
  }, []);

  return (
    <div className="ag-theme-quartz" style={{ height: "80vh", width: "100%" }}>
      <AgGridReact<HistoryGridRow> // Use new row type
        ref={gridRef}
        rowData={rowData} // Pass client-side data
        columnDefs={columnDefs} // Use updated column definitions
        defaultColDef={defaultColDef}
        pagination={true}
        paginationPageSize={100} // Adjust as needed
        paginationPageSizeSelector={[10, 50, 100, 500]} // Add page size selector
        onGridReady={onGridReady}
        onSortChanged={onSortChanged}
        onFilterChanged={onFilterChanged}
        // Show loading overlay
        loadingOverlayComponent={
          isLoading ? undefined : () => "Không có dữ liệu"
        } // Basic overlay
        suppressLoadingOverlay={!isLoading}
        suppressNoRowsOverlay={isLoading}
      />
    </div>
  );
};

export default HistoryPage;
