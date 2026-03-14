import { Outlet } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShell() {
  return (
    <TooltipProvider>
      <Outlet />
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border bg-background/80 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
        <a href="https://dimacon.io/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
          <img src="/favicon.png" alt="Dimacon" className="h-4 w-4" />
          Powered by Dimacon
        </a>
        <span className="text-border">|</span>
        <a href="https://dimacon.io/impressum" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Impressum</a>
        <a href="https://dimacon.io/datenschutz" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Datenschutz</a>
      </div>
    </TooltipProvider>
  );
}
