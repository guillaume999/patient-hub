import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function PatientBilanIntermediaire() {
  const { id: patientId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const traitementId = searchParams.get("traitement");
  const position = parseInt(searchParams.get("position") || "0", 10);
  const bilanId = searchParams.get("bilan");

  const [patientName, setPatientName] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingBilanId, setExistingBilanId] = useState<string | null>(bilanId);

  useEffect(() => {
    if (patientId && user) {
      fetchData();
    }
  }, [patientId, user, bilanId]);

  const fetchData = async () => {
    try {
      // Fetch patient name
      const { data: patient } = await supabase
        .from("patients")
        .select("name")
        .eq("id", patientId)
        .single();

      if (patient) {
        setPatientName(patient.name);
      }

      // Fetch existing bilan if we have an id
      if (bilanId) {
        const { data: bilan } = await supabase
          .from("patient_bilans")
          .select("*")
          .eq("id", bilanId)
          .single();

        if (bilan) {
          setContent(bilan.content || "");
          setExistingBilanId(bilan.id);
        }
      } else if (traitementId && patientId) {
        // Check if there's already a bilan at this position
        const { data: existingBilan } = await supabase
          .from("patient_bilans")
          .select("*")
          .eq("patient_id", patientId)
          .eq("traitement_id", traitementId)
          .eq("position_after_seance", position)
          .maybeSingle();

        if (existingBilan) {
          setContent(existingBilan.content || "");
          setExistingBilanId(existingBilan.id);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !patientId) return;
    setIsSaving(true);

    try {
      if (existingBilanId) {
        // Update existing bilan
        const { error } = await supabase
          .from("patient_bilans")
          .update({ content })
          .eq("id", existingBilanId);

        if (error) throw error;
      } else {
        // Create new bilan
        const { data, error } = await supabase
          .from("patient_bilans")
          .insert({
            patient_id: patientId,
            traitement_id: traitementId,
            user_id: user.id,
            position_after_seance: position,
            content,
          })
          .select()
          .single();

        if (error) throw error;
        setExistingBilanId(data.id);
      }

      toast.success("Bilan enregistré");
      navigate(-1);
    } catch (error) {
      console.error("Error saving bilan:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-3xl py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Bilan intermédiaire</h1>
            <p className="text-muted-foreground">
              {patientName} • Après séance {position}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Observations et notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Contenu du bilan</Label>
              <Textarea
                placeholder="Notez vos observations sur l'évolution du patient, les progrès, les difficultés rencontrées, les ajustements à prévoir..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-1 min-h-[300px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
