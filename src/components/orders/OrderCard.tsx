import type { Order } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/types";
import { MapPin, Clock } from "lucide-react";

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
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{order.orderNumber || "Ohne Nr."}</CardTitle>
          <Badge variant={order.status === "exported" ? "default" : "outline"} className="text-xs">
            {STATUS_LABELS[order.status]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{order.customerName}</p>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">
            {order.constructionSite.street}, {order.constructionSite.city}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>{order.positions.length} Positionen</span>
          {totalMinutes > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{totalMinutes} Min.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
