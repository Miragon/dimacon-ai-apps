import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrderActions } from "@/hooks/use-orders";
import type { Order } from "@/types";

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderForm({ open, onOpenChange }: OrderFormProps) {
  const navigate = useNavigate();
  const { addOrder } = useOrderActions();

  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const order: Order = {
      id: crypto.randomUUID(),
      name: name || "Neuer Auftrag",
      positions: [],
      notes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addOrder(order);
    onOpenChange(false);
    setName("");
    navigate(`/orders/${order.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Neuer Auftrag</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Bezeichnung</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Baustelle Hauptstraße"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit">Erstellen</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
