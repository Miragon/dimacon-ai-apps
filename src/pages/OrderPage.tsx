import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrder, useOrderActions } from "@/hooks/use-orders";
import { PositionList } from "@/components/positions/PositionList";
import { ExportDialog } from "@/components/export/ExportDialog";
import { useState } from "react";

export function OrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const order = useOrder(orderId);
  const { deleteOrder, deletePosition } = useOrderActions();
  const [showExport, setShowExport] = useState(false);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Auftrag nicht gefunden</p>
        <Button variant="link" onClick={() => navigate("/")}>
          Zurück zum Dashboard
        </Button>
      </div>
    );
  }

  const handleDelete = () => {
    deleteOrder(order.id);
    navigate("/");
  };

  const totalLm = order.positions.reduce(
    (sum, p) => sum + (p.calculation?.totalLinearMeters ?? 0),
    0
  );
  const totalMinutes = order.positions.reduce(
    (sum, p) => sum + (p.calculation?.estimatedMinutes ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{order.name}</h1>
        </div>
        <Button variant="outline" onClick={() => setShowExport(true)}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button variant="destructive" size="icon" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Übersicht</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Positionen</p>
            <p className="text-lg font-semibold">{order.positions.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Laufmeter gesamt</p>
            <p className="text-lg font-semibold">{totalLm.toFixed(2)} m</p>
          </div>
          <div>
            <p className="text-muted-foreground">Geschätzte Zeit</p>
            <p className="text-lg font-semibold">{totalMinutes} Min.</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Positionen</h2>
          <Button onClick={() => navigate(`/orders/${order.id}/positions/new`)}>
            <Plus className="mr-2 h-4 w-4" />
            Position hinzufügen
          </Button>
        </div>

        <PositionList
          positions={order.positions}
          orderId={order.id}
          onDelete={(posId) => deletePosition(order.id, posId)}
          onSelect={(posId) => navigate(`/orders/${order.id}/positions/${posId}`)}
        />
      </div>

      <ExportDialog order={order} open={showExport} onOpenChange={setShowExport} />
    </div>
  );
}
