import type { Position } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { POSITION_TYPE_LABELS, MATERIAL_LABELS } from "@/types";
import { formatMinutes } from "@/lib/utils";
import { Trash2, Ruler, Clock, Scissors } from "lucide-react";

interface PositionCardProps {
  position: Position;
  onDelete: () => void;
  onClick: () => void;
}

export function PositionCard({ position, onDelete, onClick }: PositionCardProps) {
  const calc = position.calculation;

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50"
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium truncate">{position.label}</span>
            <Badge variant="secondary" className="text-xs shrink-0">
              {POSITION_TYPE_LABELS[position.type]}
            </Badge>
            <Badge variant="outline" className="text-xs shrink-0">
              {MATERIAL_LABELS[position.material]}
            </Badge>
          </div>
          {calc && (
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Scissors className="h-3 w-3" />
                {calc.totalCuts} Schnitte
              </span>
              <span className="flex items-center gap-1">
                <Ruler className="h-3 w-3" />
                {calc.totalLinearMeters} m
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatMinutes(calc.estimatedMinutes)}
              </span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
