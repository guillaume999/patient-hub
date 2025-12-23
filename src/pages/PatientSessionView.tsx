import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, FileText, Clock, AlertCircle, CheckCircle } from "lucide-react";

interface SeanceType {
  id: string;
  pathologie: string;
  objectif_principal: string;
  pathologies?: string[];
  objectifs_principaux?: string[];
  objectifs_secondaires?: string[];
}

interface SeanceExercice {
  id: string;
  name: string | null;
  description: string | null;
  duration_seconds: number | null;
  repetitions: number | null;
  series: number | null;
  ordre: number;
  exercice_id: string | null;
  exercices?: {
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    video_url: string | null;
  } | null;
}

interface AccessData {
  id: string;
  seance_type_id: string;
  patient_id: string;
  expires_at: string;
  seance?: SeanceType;
  patient?: {
    name: string;
  };
}

export default function PatientSessionView() {
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get("code");

  const [accessCode, setAccessCode] = useState(codeFromUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessData, setAccessData] = useState<AccessData | null>(null);
  const [seanceExercices, setSeanceExercices] = useState<SeanceExercice[]>([]);
  const [completedExercices, setCompletedExercices] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (codeFromUrl) {
      handleValidateCode();
    }
  }, [codeFromUrl]);

  const handleValidateCode = async () => {
    if (!accessCode.trim()) {
      setError("Veuillez entrer un code d'accès");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate the access code
      const { data: accessResult, error: accessError } = await supabase
        .from("patient_session_access")
        .select(`
          id,
          seance_type_id,
          patient_id,
          expires_at
        `)
        .eq("access_code", accessCode.trim().toUpperCase())
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (accessError) throw accessError;

      if (!accessResult) {
        setError("Code d'accès invalide ou expiré");
        setLoading(false);
        return;
      }

      // Fetch seance details
      const { data: seanceData } = await supabase
        .from("seance_types")
        .select("id, pathologie, objectif_principal, pathologies, objectifs_principaux, objectifs_secondaires")
        .eq("id", accessResult.seance_type_id)
        .maybeSingle();

      // Fetch patient name
      const { data: patientData } = await supabase
        .from("patients")
        .select("name")
        .eq("id", accessResult.patient_id)
        .maybeSingle();

      setAccessData({
        ...accessResult,
        seance: seanceData || undefined,
        patient: patientData || undefined,
      });

      // Fetch exercices for this seance
      const { data: exercicesData } = await supabase
        .from("seance_exercices")
        .select(`
          id,
          name,
          description,
          duration_seconds,
          repetitions,
          series,
          ordre,
          exercice_id,
          exercices(id, title, description, thumbnail_url, video_url)
        `)
        .eq("seance_type_id", accessResult.seance_type_id)
        .order("ordre", { ascending: true });

      setSeanceExercices(exercicesData || []);

    } catch (err) {
      console.error("Error validating code:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const toggleExerciceComplete = (exerciceId: string) => {
    setCompletedExercices(prev => {
      const next = new Set(prev);
      if (next.has(exerciceId)) {
        next.delete(exerciceId);
      } else {
        next.add(exerciceId);
      }
      return next;
    });
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const getTimeRemaining = () => {
    if (!accessData?.expires_at) return null;
    const expires = new Date(accessData.expires_at);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    if (diff <= 0) return "Expiré";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m restantes`;
  };

  const getSeanceDisplay = () => {
    if (!accessData?.seance) return "Séance";
    const pathologies = accessData.seance.pathologies?.length 
      ? accessData.seance.pathologies 
      : [accessData.seance.pathologie];
    return pathologies.join(", ");
  };

  // Login form
  if (!accessData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Accès Patient</CardTitle>
            <p className="text-muted-foreground mt-2">
              Entrez votre code d'accès temporaire pour voir votre séance
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                placeholder="Code d'accès (ex: ABC123)"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
              />
            </div>
            
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button 
              onClick={handleValidateCode} 
              className="w-full" 
              disabled={loading || !accessCode.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                "Accéder à ma séance"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Session view
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{accessData.patient?.name || "Patient"}</h1>
                <p className="text-muted-foreground">{getSeanceDisplay()}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {getTimeRemaining()}
              </div>
            </div>
            
            {/* Objectifs */}
            {accessData.seance?.objectifs_principaux && accessData.seance.objectifs_principaux.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Objectifs</p>
                <div className="flex flex-wrap gap-1">
                  {accessData.seance.objectifs_principaux.map((obj, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{obj}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exercices list */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Exercices ({seanceExercices.length})
          </h2>

          {seanceExercices.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucun exercice dans cette séance
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {seanceExercices.map((exercice) => {
                const isCompleted = completedExercices.has(exercice.id);
                return (
                  <Card 
                    key={exercice.id}
                    className={`transition-all ${isCompleted ? 'bg-green-500/10 border-green-500/30' : ''}`}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center gap-3">
                        <Button
                          variant={isCompleted ? "default" : "outline"}
                          size="icon"
                          className={`flex-shrink-0 ${isCompleted ? 'bg-green-500 hover:bg-green-600' : ''}`}
                          onClick={() => toggleExerciceComplete(exercice.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        
                        {exercice.exercices?.thumbnail_url && (
                          <img 
                            src={exercice.exercices.thumbnail_url} 
                            alt="" 
                            className="w-12 h-12 rounded object-cover flex-shrink-0"
                          />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                            {exercice.exercices?.title || exercice.name || "Exercice"}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {exercice.series && (
                              <span>{exercice.series} séries</span>
                            )}
                            {exercice.repetitions && (
                              <span>× {exercice.repetitions} reps</span>
                            )}
                            {exercice.duration_seconds && (
                              <span>{formatDuration(exercice.duration_seconds)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}