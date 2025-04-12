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
} from "ag-grid-community";
import { parseAsString, useQueryState } from "nuqs"
import { getLicensePlatesAction } from "../actions";
import { transformDbRecordToColumnSchema } from "@/lib/db/utils";

type LicensePlateRow = ReturnType<typeof transformDbRecordToColumnSchema>;

// Define column definitions for AG Grid
const columnDefs: ColDef<LicensePlateRow>[] = [
  {
    field: "plateNumber",
    headerName: "Plate Number",
    filter: "agTextColumnFilter",
    sortable: true,
  },
  {
    field: "confidence",
    headerName: "Confidence",
    filter: "agNumberColumnFilter",
    sortable: true,
  },
  {
    field: "date",
    headerName: "Date",
    filter: "agDateColumnFilter",
    sortable: true,
    valueFormatter: (params) =>
      params.value ? new Date(params.value).toLocaleString() : "",
  },
  {
    field: "provinceName",
    headerName: "Province",
    filter: "agTextColumnFilter",
    sortable: true,
  },
  {
    field: "vehicleType",
    headerName: "Vehicle Type",
    filter: "agTextColumnFilter",
    sortable: true,
  },
  {
    field: "imageUrl",
    headerName: "Image",
    cellRenderer: (params: { value?: string }) =>
      params.value ? (
        <img src={params.value} alt="License Plate" style={{ height: "30px" }} />
      ) : null,
    sortable: false,
    filter: false,
  },
  // Add more columns as needed
];

const HistoryPage: React.FC = () => {
  const gridRef = useRef<AgGridReact<LicensePlateRow>>(null);
  const [rowData, setRowData] = useState<LicensePlateRow[]>([]); // State for grid data
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

  // Fetch data using the server action when the component mounts
  // or when filter/sort models change (though we manage updates differently now)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Parse initial models from nuqs for the first fetch
        const initialSortModel = JSON.parse(sortModelNuqs);
        const initialFilterModel = JSON.parse(filterModelNuqs);

        const result = await getLicensePlatesAction({
          sortModel: initialSortModel,
          filterModel: initialFilterModel,
        });

        if (result.success) {
          setRowData(result.rows);
        } else {
          console.error("Failed to fetch data:", result.error);
          setRowData([]); // Clear data on error
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setRowData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    // Re-fetch if nuqs values change (e.g., back/forward navigation)
    // Note: This simple dependency might cause re-fetches when the grid updates nuqs itself.
    // Consider more sophisticated state management if needed.
  }, [sortModelNuqs, filterModelNuqs]);

  // Restore grid state from URL when grid is ready
  const onGridReady = useCallback(
    (params: GridReadyEvent) => {
      try {
        const initialSortModel = JSON.parse(sortModelNuqs);
        const initialFilterModel = JSON.parse(filterModelNuqs);
        // Apply initial sort state using applyColumnState
        if (initialSortModel && initialSortModel.length > 0) {
          const columnState = initialSortModel.map((s: SortModelItem) => ({
            colId: s.colId,
            sort: s.sort,
          }));
          params.api.applyColumnState({
            state: columnState,
            defaultState: { sort: null },
          });
        }
        // Apply initial filter state using setFilterModel
        if (initialFilterModel && Object.keys(initialFilterModel).length > 0) {
          params.api.setFilterModel(initialFilterModel);
        }
      } catch (e) {
        console.error("Failed to parse or apply initial state from URL", e);
      }
    },
    [sortModelNuqs, filterModelNuqs] // Dependencies for initial state restoration
  );

  // Update nuqs state when user interacts with the grid
  const onSortChanged = useCallback(
    (event: SortChangedEvent) => {
      // Get sort state directly using getColumnState
      const currentSortModel = event.api
        .getColumnState()
        .filter((s) => s.sort != null)
        .map((s) => ({ colId: s.colId, sort: s.sort })); // Map to SortModelItem structure
      setSortModelNuqs(JSON.stringify(currentSortModel));
    },
    [setSortModelNuqs]
  );

  const onFilterChanged = useCallback(
    (event: FilterChangedEvent) => {
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
      // Ensure filters are enabled for community version
      filter: true,
    };
  }, []);

  return (
    // Apply the Quartz theme
    <div className="ag-theme-quartz" style={{ height: "80vh", width: "100%" }}>
      <AgGridReact<LicensePlateRow>
        ref={gridRef}
        rowData={rowData} // Pass client-side data
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        // rowModelType defaults to clientSide
        pagination={true}
        paginationPageSize={100}
        // No cacheBlockSize needed for clientSide
        onGridReady={onGridReady}
        onSortChanged={onSortChanged}
        onFilterChanged={onFilterChanged}
        // Show loading overlay
        loadingOverlayComponent={isLoading ? undefined : () => "No Rows To Show"} // Basic overlay
        suppressLoadingOverlay={!isLoading}
        suppressNoRowsOverlay={isLoading}
      />
    </div>
  );
};

export default HistoryPage;
