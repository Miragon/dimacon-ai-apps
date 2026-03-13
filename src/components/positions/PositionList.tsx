import type { Position } from "@/types";
import { PositionCard } from "./PositionCard";

interface PositionListProps {
  positions: Position[];
  orderId: string;
  onDelete: (positionId: string) => void;
  onSelect: (positionId: string) => void;
}

export function PositionList({ positions, onDelete, onSelect }: PositionListProps) {
  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
        <p className="text-muted-foreground">Noch keine Positionen</p>
        <p className="text-sm text-muted-foreground">
          Füge eine neue Position hinzu, um die Berechnung zu starten.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {positions
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((position) => (
          <PositionCard
            key={position.id}
            position={position}
            onDelete={() => onDelete(position.id)}
            onClick={() => onSelect(position.id)}
          />
        ))}
    </div>
  );
}
