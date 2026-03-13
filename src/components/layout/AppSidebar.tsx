import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Plus, FileText } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/hooks/use-orders";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/types";

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const orders = useOrders();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            D
          </div>
          <div>
            <h2 className="text-sm font-semibold">Dimacon</h2>
            <p className="text-xs text-muted-foreground">Planungsassistent</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate("/")}
                  isActive={location.pathname === "/"}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Aufträge</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => navigate("/?new=true")}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {orders.map((order) => (
                <SidebarMenuItem key={order.id}>
                  <SidebarMenuButton
                    onClick={() => navigate(`/orders/${order.id}`)}
                    isActive={location.pathname.startsWith(`/orders/${order.id}`)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="truncate">{order.orderNumber || "Ohne Nr."}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {STATUS_LABELS[order.status]}
                    </Badge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {orders.length === 0 && (
                <p className="px-4 py-2 text-xs text-muted-foreground">
                  Noch keine Aufträge
                </p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <p className="text-xs text-muted-foreground">
          Dimacon Planung v0.1
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
