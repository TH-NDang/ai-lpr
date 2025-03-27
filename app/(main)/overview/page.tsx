import * as React from 'react'
import { searchParamsCache } from '../../../lib/table/search-params'
import { dataOptions } from '../../../lib/table/query-options'
import { Client } from '@/components/data-table/client'
import { getQueryClient } from '@/lib/get-query-client'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const search = searchParamsCache.parse(await searchParams)
  const queryClient = getQueryClient()
  await queryClient.prefetchInfiniteQuery(dataOptions(search))

  return <Client />
}
