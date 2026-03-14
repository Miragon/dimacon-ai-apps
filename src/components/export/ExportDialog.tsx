import { useState } from "react";
import type { Position } from "@/types";
import { positionToUrlPos, encodeState } from "@/lib/url-state";
import type { UrlState } from "@/lib/url-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { POSITION_TYPE_LABELS } from "@/types";
import { Download, Copy, Check, Link } from "lucide-react";

interface ExportDialogProps {
  name: string;
  positions: Position[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ name, positions, open, onOpenChange }: ExportDialogProps) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const urlState: UrlState = {
    n: name,
    p: positions.map(positionToUrlPos),
  };
  const json = JSON.stringify(urlState, null, 2);
  const encoded = encodeState(urlState);
  const shareUrl = `${window.location.origin}${window.location.pathname}#${encoded}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name || "auftrag"}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalLm = positions.reduce(
    (sum, p) => sum + (p.calculation?.totalLinearMeters ?? 0),
    0
  );
  const totalMinutes = positions.reduce(
    (sum, p) => sum + (p.calculation?.estimatedMinutes ?? 0),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export: {name || "Auftrag"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-medium">Zusammenfassung</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Positionen</p>
                <p className="font-medium">{positions.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Laufmeter</p>
                <p className="font-medium">{totalLm.toFixed(2)} m</p>
              </div>
              <div>
                <p className="text-muted-foreground">Geschätzte Zeit</p>
                <p className="font-medium">{totalMinutes} Min.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {positions.map((p, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {p.label} ({POSITION_TYPE_LABELS[p.type]})
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">JSON</h3>
            <Textarea value={json} readOnly rows={12} className="font-mono text-xs" />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCopyLink}>
            {linkCopied ? <Check className="mr-2 h-4 w-4" /> : <Link className="mr-2 h-4 w-4" />}
            {linkCopied ? "Kopiert!" : "Link kopieren"}
          </Button>
          <Button variant="outline" onClick={handleCopy}>
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Kopiert!" : "JSON kopieren"}
          </Button>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Herunterladen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
