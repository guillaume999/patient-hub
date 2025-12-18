import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Target, Plus, FileDown, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CarePlanData {
  motif_consultation: string;
  bilan_kine: string;
  objectifs_prise_en_charge: string;
}

interface PatientCareObjectivesCardProps {
  carePlan: CarePlanData;
  onChange: (field: keyof CarePlanData, value: string) => void;
  onImportTraitement: () => void;
  onCreateTraitement: () => void;
  activeTraitementName?: string | null;
}

export function PatientCareObjectivesCard({
  carePlan,
  onChange,
  onImportTraitement,
  onCreateTraitement,
  activeTraitementName,
}: PatientCareObjectivesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5" />
          Objectifs soins
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Motif de consultation</Label>
          <Textarea
            placeholder="Décrivez le motif de consultation..."
            value={carePlan.motif_consultation}
            onChange={(e) => onChange("motif_consultation", e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label>Bilan kiné</Label>
          <Textarea
            placeholder="Décrivez le bilan kinésithérapique..."
            value={carePlan.bilan_kine}
            onChange={(e) => onChange("bilan_kine", e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label>Objectifs de prise en charge</Label>
          <Textarea
            placeholder="Décrivez les objectifs de prise en charge..."
            value={carePlan.objectifs_prise_en_charge}
            onChange={(e) => onChange("objectifs_prise_en_charge", e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base font-semibold">Plan de traitement</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onImportTraitement}>
                <FileDown className="w-4 h-4 mr-2" />
                Importer
              </Button>
              <Button variant="outline" size="sm" onClick={onCreateTraitement}>
                <Plus className="w-4 h-4 mr-2" />
                Créer
              </Button>
            </div>
          </div>
          {activeTraitementName ? (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="font-medium">{activeTraitementName}</span>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Aucun plan de traitement actif. Importez-en un ou créez-en un nouveau.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
