import type { PositionType } from "@/types";
import { POSITION_TYPE_LABELS } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { RectangleHorizontal, Circle, Drill, Minus, Square } from "lucide-react";

interface PositionTypeSelectorProps {
  onSelect: (type: PositionType) => void;
}

const TYPE_ICONS: Record<PositionType, React.ReactNode> = {
  wanddurchbruch: <RectangleHorizontal className="h-8 w-8" />,
  deckendurchbruch: <Square className="h-8 w-8" />,
  kernbohrung: <Circle className="h-8 w-8" />,
  fugenschnitt: <Minus className="h-8 w-8" />,
  bodensaegen: <Drill className="h-8 w-8" />,
};

const TYPE_DESCRIPTIONS: Record<PositionType, string> = {
  wanddurchbruch: "Rechteckiger oder runder Durchbruch in einer Wand",
  deckendurchbruch: "Durchbruch in einer Betondecke",
  kernbohrung: "Einzelne Kernbohrung mit definiertem Durchmesser",
  fugenschnitt: "Linearer Schnitt in Wand oder Boden (Fuge)",
  bodensaegen: "Linearer Schnitt im Boden mit Bodensäge",
};

const TYPES: PositionType[] = [
  "wanddurchbruch",
  "deckendurchbruch",
  "kernbohrung",
  "fugenschnitt",
  "bodensaegen",
];

export function PositionTypeSelector({ onSelect }: PositionTypeSelectorProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {TYPES.map((type) => (
        <Card
          key={type}
          className="cursor-pointer transition-colors hover:bg-accent/50"
          onClick={() => onSelect(type)}
        >
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="text-muted-foreground">{TYPE_ICONS[type]}</div>
            <div>
              <h3 className="font-medium">{POSITION_TYPE_LABELS[type]}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {TYPE_DESCRIPTIONS[type]}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
