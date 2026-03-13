import type { Order } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface OrderCardProps {
  order: Order;
  onClick: () => void;
}

export function OrderCard({ order, onClick }: OrderCardProps) {
  const totalMinutes = order.positions.reduce(
    (sum, p) => sum + (p.calculation?.estimatedMinutes ?? 0),
    0
  );

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{order.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{order.positions.length} Positionen</span>
        {totalMinutes > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{totalMinutes} Min.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
