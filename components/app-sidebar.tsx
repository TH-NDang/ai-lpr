"use client";
import {
  type LucideIcon,
  History,
  ImageIcon,
} from "lucide-react";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
};

const mainNavItems: NavItem[] = [
  {
    title: "Nhận Dạng Biển Số",
    url: "/license-plate",
    icon: ImageIcon,
  },
  {
    title: "Lịch Sử Nhận Dạng",
    url: "/history",
    icon: History,
  },
];

export function AppSidebar() {
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuButton className="w-fit px-1.5">
            <div className="flex aspect-square size-5 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <ImageIcon className="size-3" />
            </div>
            <span className="truncate font-semibold">AI LPR</span>
          </SidebarMenuButton>
        </SidebarMenu>
        <NavMain items={mainNavItems} />
      </SidebarHeader>
      <SidebarContent />
      <SidebarFooter>
        <SidebarUserNav />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
