import { Outlet } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShell() {
  return (
    <TooltipProvider>
      <Outlet />
    </TooltipProvider>
  );
}
