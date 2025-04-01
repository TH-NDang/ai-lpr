import type { NextRequest } from 'next/server'
import { searchParamsCache } from '@/lib/table/search-params'
import { getFacetsFromData, groupChartData } from './helpers'
import { addDays } from 'date-fns'
import type { InfiniteQueryMeta } from '@/lib/table/query-options'
import type { ColumnSchema, ColumnFilterSchema } from '@/lib/table/schema'
import { getLicensePlates } from '@/lib/db/queries'

export async function GET(req: NextRequest) {
  // Analyze query parameters from the request
  const _search: Map<string, string> = new Map()
  req.nextUrl.searchParams.forEach((value, key) => _search.set(key, value))

  const search = searchParamsCache.parse(Object.fromEntries(_search))

  // Prepare date range for filter
  const _date =
    search.date?.length === 1
      ? ([search.date[0], addDays(search.date[0], 1)] as [Date, Date])
      : (search.date as [Date, Date] | undefined)

  // Create a filter object for db query
  const dbFilter: ColumnFilterSchema = {
    date: _date,
    level: search.level || undefined,
    plateNumber: search.plateNumber || undefined,
    provinceCode: search.provinceCode || undefined,
    provinceName: search.provinceName || undefined,
    vehicleType: search.vehicleType || undefined,
    plateType: search.plateType || undefined,
    confidence: search.confidence || undefined,
    processingTime: search.processingTime || undefined,
  }

  // Get license plate data from the database
  const { data, totalCount, filteredCount } = await getLicensePlates({
    filter: dbFilter,
    sort: search.sort || undefined,
    start: search.start,
    size: search.size,
  })

  // Group data for chart visualization
  const chartData = groupChartData(data, _date)

  // Get facet data for filters
  const facets = getFacetsFromData(data)

  return Response.json({
    data,
    meta: {
      totalRowCount: totalCount,
      filterRowCount: filteredCount,
      chartData,
      facets,
      metadata: {}, // No additional metadata needed for license plate recognition
    },
  } satisfies {
    data: ColumnSchema[]
    meta: InfiniteQueryMeta
  })
}
