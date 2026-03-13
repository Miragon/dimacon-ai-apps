import type { Order } from "@/types";
import { OrderCard } from "./OrderCard";

interface OrderListProps {
  orders: Order[];
  onSelect: (id: string) => void;
}

export function OrderList({ orders, onSelect }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <p className="text-muted-foreground">Noch keine Aufträge vorhanden</p>
        <p className="text-sm text-muted-foreground">
          Erstelle einen neuen Auftrag, um loszulegen.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} onClick={() => onSelect(order.id)} />
      ))}
    </div>
  );
}
