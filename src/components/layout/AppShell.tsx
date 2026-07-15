import { Outlet } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShell() {
  return (
    <TooltipProvider>
      <Outlet />
      <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center border-t bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
        <a href="https://dimacon.io/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
          <img src="/favicon.png" alt="Dimacon" className="h-3.5 w-3.5" />
          Powered by Dimacon
        </a>
      </div>
    </TooltipProvider>
  );
}
