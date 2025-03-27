'use client'

import type { User } from 'next-auth'
import { useRouter, usePathname } from 'next/navigation'
import {
  type LucideIcon,
  History,
  MessageSquare,
  ImageIcon,
} from 'lucide-react'

import { PlusIcon } from '@/components/icons'
import { SidebarHistory } from '@/components/sidebar-history'
import { SidebarUserNav } from '@/components/sidebar-user-nav'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { NavMain } from './nav-main'

type NavItem = {
  title: string
  url: string
  icon: LucideIcon
  isActive?: boolean
}

const mainNavItems: NavItem[] = [
  {
    title: 'Nhận Dạng Biển Số',
    url: '/license-plate',
    icon: ImageIcon,
  },
  {
    title: 'Lịch Sử Nhận Dạng',
    url: '/overview',
    icon: History,
  },
  {
    title: 'Trợ Lý AI',
    url: '/',
    icon: MessageSquare,
  },
]

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter()
  const { setOpenMobile } = useSidebar()
  const pathname = usePathname()

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false)
              }}
              className="flex flex-row gap-3 items-center"
            >
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                AI LPR
              </span>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit"
                  onClick={() => {
                    setOpenMobile(false)
                    router.push('/')
                    router.refresh()
                  }}
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end">New Chat</TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
        <NavMain items={mainNavItems} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
