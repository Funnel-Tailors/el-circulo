import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  Smartphone,
  Compass,
  Zap,
  Wrench,
  LogOut,
  Palette,
  Sparkles,
  Image,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const navItems = [
  {
    title: "Resumen",
    url: "/admin",
    icon: LayoutDashboard,
    description: "KPIs globales y overview",
  },
  {
    title: "Quiz Funnel",
    url: "/admin/quiz",
    icon: Target,
    description: "VSL, embudo, preguntas",
  },
  {
    title: "Meta Pixel",
    url: "/admin/meta",
    icon: Smartphone,
    description: "Events, health, sessions",
  },
  {
    title: "La Senda",
    url: "/admin/senda",
    icon: Compass,
    description: "Journey + leads Senda",
  },
  {
    title: "La Brecha",
    url: "/admin/brecha",
    icon: Zap,
    description: "Journey + leads Brecha",
  },
  {
    title: "Dev Tools",
    url: "/admin/dev",
    icon: Wrench,
    description: "Testing components",
  },
  {
    title: "Design System",
    url: "/admin/showcase",
    icon: Palette,
    description: "Tokens y componentes",
  },
  {
    title: "Premium Effects",
    url: "/admin/premium",
    icon: Sparkles,
    description: "Efectos Linear/Raycast",
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <SidebarTrigger />
          {!isCollapsed && (
            <span className="font-semibold text-sidebar-foreground">
              Admin Panel
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = 
                  item.url === "/admin" 
                    ? location.pathname === "/admin"
                    : location.pathname.startsWith(item.url);
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
              <span>Salir</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
