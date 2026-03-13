import { LayoutDashboard, Plus, Copy } from "lucide-react";
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
import { TEMPLATES } from "@/lib/templates";
import { MATERIAL_LABELS } from "@/types";

interface AppSidebarProps {
  onNavigateHome: () => void;
  onAddFromTemplate: (templateIndex: number) => void;
  onAddEmpty: () => void;
  isEditing: boolean;
}

export function AppSidebar({
  onNavigateHome,
  onAddFromTemplate,
  onAddEmpty,
  isEditing,
}: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            D
          </div>
          <div>
            <h2 className="text-sm font-semibold">Dimacon</h2>
            <p className="text-xs text-muted-foreground">Kalkulator</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onNavigateHome} isActive={!isEditing}>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Übersicht</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onAddEmpty}>
                  <Plus className="h-4 w-4" />
                  <span>Neue Position</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Vorlagen</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {TEMPLATES.map((tpl, i) => (
                <SidebarMenuItem key={i}>
                  <SidebarMenuButton
                    onClick={() => onAddFromTemplate(i)}
                    className="h-auto py-1.5"
                  >
                    <Copy className="h-3.5 w-3.5 shrink-0" />
                    <div className="flex flex-col items-start min-w-0">
                      <span className="truncate text-sm">{tpl.label}</span>
                      <span className="truncate text-[11px] leading-tight text-muted-foreground">
                        {MATERIAL_LABELS[tpl.material]} · {tpl.dimensions.width}×{tpl.dimensions.height}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <p className="text-xs text-muted-foreground">Dimacon Kalkulator v0.1</p>
      </SidebarFooter>
    </Sidebar>
  );
}
