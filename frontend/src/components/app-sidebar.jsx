import * as React from "react";
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  LayoutDashboard,
  ListOrdered,
  Utensils,
  Users2,
  CreditCard,
  PackageIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
};

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/admin",
  },
  {
    label: "User Management",
    icon: Users2,
    path: "/admin/user-management",
  },
  {
    label: "Orders",
    icon: PackageIcon,
    path: "/admin/orders",
  },
  {
    label: "Menu",
    icon: Utensils,
    path: "/admin/menu",
  },
  {
    label: "Payment",
    icon: CreditCard,
    path: "/admin/payment",
  },
];

export function AppSidebar({ ...props }) {
  const authUser = useAuthStore((state) => state.authUser);

  const avatarUrl =
    typeof authUser?.avatar === "string"
      ? authUser.avatar
      : authUser?.avatar?.url || "";


  const user = {
    name: authUser?.name || "Guest User",
    email: authUser?.email || "guest@example.com",
    avatar: avatarUrl,
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={routes} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
