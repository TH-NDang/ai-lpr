import React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { CheckCircle2, AlertCircle, ZoomIn as ZoomInIconTrigger, RotateCcw, XIcon, ZoomIn, ZoomOut } from "lucide-react";
import { format } from "date-fns";
import type { HistoryQueryResultItem } from "@/lib/db/queries";

interface FilterOptions {
  ocrEngines: string[];
  vehicleTypes: string[];
  sources: string[];
}

export const booleanCellRenderer = (value: boolean | null | undefined) => {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground text-xs">N/A</span>;
  }
  return value ? (
    <CheckCircle2 className="h-4 w-4 text-green-500 inline-block" />
  ) : (
    <AlertCircle className="h-4 w-4 text-destructive inline-block" />
  );
};

export const imageCellRenderer = (value?: string | null) => {
  if (!value) return <span className="text-muted-foreground text-xs">N/A</span>;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-transparent">
          <ZoomInIconTrigger className="h-4 w-4 text-muted-foreground hover:text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-[90vw] h-[85vh] flex items-center justify-center p-0 overflow-hidden">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={10}
          limitToBounds={true}
          doubleClick={{ mode: "reset" }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <React.Fragment>
              <div className="absolute top-2 right-2 z-10 flex flex-col items-end space-y-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-background/70 hover:bg-background/90"
                  onClick={() => zoomIn()}
                  aria-label="Phóng to"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-background/70 hover:bg-background/90"
                  onClick={() => zoomOut()}
                  aria-label="Thu nhỏ"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-background/70 hover:bg-background/90"
                  onClick={() => resetTransform()}
                  aria-label="Reset"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <TransformComponent
                wrapperStyle={{ width: "100%", height: "100%" }}
                contentStyle={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={value}
                  alt="Detection"
                  className="max-w-full max-h-full object-contain mx-auto cursor-grab active:cursor-grabbing"
                />
              </TransformComponent>
            </React.Fragment>
          )}
        </TransformWrapper>
      </DialogContent>
    </Dialog>
  );
};

export const dateFormatter = (value: Date | null): string => {
  if (!value) return "-";
  try {
    return format(new Date(value), "HH:mm:ss dd/MM/yyyy");
  } catch {
    return "Invalid Date";
  }
};

export const getColumns = (
  filterOptions?: FilterOptions
): ColumnDef<HistoryQueryResultItem>[] => [
    {
      accessorKey: "date",
      header: "Thời gian",
      accessorFn: (originalRow) => originalRow.detection?.detectionTime,
      meta: {
        filterVariant: "dateRange",
      },
      cell: ({ row }) =>
        dateFormatter(row.original.detection?.detectionTime ?? null),
    },
    {
      accessorKey: "plateNumber",
      header: "Biển số nhận dạng",
      meta: {
        filterVariant: "text",
      },
      cell: ({ row }) => row.original.plateNumber,
      enableHiding: false,
      size: 120,
    },
    {
      accessorKey: "provinceName",
      header: "Tỉnh/TP",
      meta: {
        filterVariant: "text",
      },
      cell: ({ row }) => row.original.provinceName ?? "-",
      size: 110,
    },
    {
      accessorKey: "isValidFormat",
      header: "Trạng thái nhận dạng",
      meta: {
        filterVariant: "selectBoolean",
      },
      cell: ({ row }) => booleanCellRenderer(row.original.isValidFormat),
      size: 90,
      enableResizing: true,
    },
    {
      accessorKey: "ocrEngine",
      header: "OCR được dùng",
      accessorFn: (originalRow) => originalRow.ocrEngineUsed,
      meta: {
        filterVariant: "selectString",
        selectOptions: filterOptions?.ocrEngines ?? [],
      },
      cell: ({ row }) => row.original.ocrEngineUsed ?? "-",
      enableResizing: true,
    },
    {
      accessorKey: "typeVehicle",
      header: "Loại xe",
      accessorFn: (originalRow) => originalRow.typeVehicle,
      meta: {
        filterVariant: "selectString",
        selectOptions: filterOptions?.vehicleTypes ?? [],
      },
      cell: ({ row }) => row.original.typeVehicle ?? "-",
      size: 90,
      enableHiding: true,
    },
    {
      accessorKey: "source",
      header: "Nguồn",
      accessorFn: (originalRow) => originalRow.detection?.source,
      meta: {
        filterVariant: "selectString",
        selectOptions: filterOptions?.sources ?? [],
      },
      cell: ({ row }) => row.original.detection?.source ?? "-",
      size: 80,
      enableHiding: true,
    },
    {
      accessorKey: "imageUrl",
      header: "Ảnh",
      accessorFn: (originalRow) => originalRow.detection?.processedImageUrl,
      cell: ({ row }) =>
        imageCellRenderer(row.original.detection?.processedImageUrl ?? null),
      enableSorting: false,
      enableColumnFilter: false,
      size: 80,
      enableResizing: false,
      enableHiding: false,
    },
  ];
