import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrder, useOrderActions } from "@/hooks/use-orders";
import { CalculationResults } from "@/components/positions/CalculationResults";
import { CutPreview } from "@/components/preview/CutPreview";
import { PositionSummary } from "@/components/positions/PositionSummary";

export function PositionDetailPage() {
  const { orderId, positionId } = useParams<{ orderId: string; positionId: string }>();
  const navigate = useNavigate();
  const order = useOrder(orderId);
  const { deletePosition } = useOrderActions();
  const position = order?.positions.find((p) => p.id === positionId);

  if (!order || !position) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Position nicht gefunden</p>
        <Button variant="link" onClick={() => navigate(`/orders/${orderId}`)}>
          Zurück zum Auftrag
        </Button>
      </div>
    );
  }

  const handleDelete = () => {
    deletePosition(order.id, position.id);
    navigate(`/orders/${order.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/orders/${order.id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{position.label}</h1>
          <p className="text-muted-foreground">Position #{position.sortOrder + 1}</p>
        </div>
        <Button variant="destructive" size="icon" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <PositionSummary position={position} />

      {position.calculation && (
        <div className="grid gap-6 lg:grid-cols-2">
          <CalculationResults calculation={position.calculation} material={position.material} />
          <CutPreview
            calculation={position.calculation}
            dimensions={position.dimensions}
            positionType={position.type}
            shape={position.shape}
          />
        </div>
      )}
    </div>
  );
}
