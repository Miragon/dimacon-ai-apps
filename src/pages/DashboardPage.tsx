import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderList } from "@/components/orders/OrderList";
import { OrderForm } from "@/components/orders/OrderForm";
import { useOrders } from "@/hooks/use-orders";

export function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const orders = useOrders();
  const [showNewOrder, setShowNewOrder] = useState(false);

  const hasNew = searchParams.get("new") === "true";

  useEffect(() => {
    if (hasNew) {
      setShowNewOrder(true);
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
  }, [hasNew]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Aufträge</h1>
          <p className="text-muted-foreground">
            {orders.length} {orders.length === 1 ? "Auftrag" : "Aufträge"} insgesamt
          </p>
        </div>
        <Button onClick={() => setShowNewOrder(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Auftrag
        </Button>
      </div>

      <OrderList orders={orders} onSelect={(id) => navigate(`/orders/${id}`)} />

      <OrderForm open={showNewOrder} onOpenChange={setShowNewOrder} />
    </div>
  );
}
