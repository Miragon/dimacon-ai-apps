import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useOrder, useOrderActions } from "@/hooks/use-orders";
import { STATUS_LABELS } from "@/types";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {order.orderNumber || "Ohne Nummer"}
            </h1>
            <Badge variant={order.status === "exported" ? "default" : "outline"}>
              {STATUS_LABELS[order.status]}
            </Badge>
          </div>
          <p className="text-muted-foreground">{order.customerName}</p>
        </div>
        <Button variant="outline" onClick={() => setShowExport(true)}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button variant="destructive" size="icon" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Baustelle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{order.constructionSite.name}</p>
            <p>{order.constructionSite.street}</p>
            <p>
              {order.constructionSite.zipCode} {order.constructionSite.city}
            </p>
            <Separator className="!my-3" />
            <p>
              <span className="text-muted-foreground">Kontakt:</span>{" "}
              {order.constructionSite.contactPerson}
            </p>
            <p>
              <span className="text-muted-foreground">Telefon:</span>{" "}
              {order.constructionSite.phone}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Übersicht</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Positionen</span>
              <span className="font-medium">{order.positions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Laufmeter gesamt</span>
              <span className="font-medium">
                {order.positions
                  .reduce((sum, p) => sum + (p.calculation?.totalLinearMeters ?? 0), 0)
                  .toFixed(2)}{" "}
                m
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Geschätzte Zeit</span>
              <span className="font-medium">
                {order.positions.reduce(
                  (sum, p) => sum + (p.calculation?.estimatedMinutes ?? 0),
                  0
                )}{" "}
                Min.
              </span>
            </div>
            {order.notes && (
              <>
                <Separator />
                <p className="text-muted-foreground">{order.notes}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

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
