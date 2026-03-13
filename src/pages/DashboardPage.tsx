import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderList } from "@/components/orders/OrderList";
import { OrderForm } from "@/components/orders/OrderForm";
import { useOrders } from "@/hooks/use-orders";

export function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const orders = useOrders();
  const [showNewOrder, setShowNewOrder] = useState(false);
  const handled = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("new") === "true" && !handled.current) {
      handled.current = true;
      setShowNewOrder(true);
      navigate("/", { replace: true });
    }
  }, [location.search, navigate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kalkulator</h1>
          <p className="text-muted-foreground">
            {orders.length} {orders.length === 1 ? "Auftrag" : "Aufträge"}
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
