import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Play, Edit, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExerciceItemCardProps {
  exercice: {
    id: string;
    name: string | null;
    description: string | null;
    repetitions: number | null;
    duration_seconds: number | null;
    series: number;
    ordre: number;
    exercice_id: string | null;
    exercice?: {
      id: string;
      title: string;
      video_url: string | null;
      thumbnail_url: string | null;
      status?: string;
    } | null;
  };
  index: number;
  seanceTypeId: string;
  onUpdate?: () => void;
}

export function ExerciceItemCard({ 
  exercice, 
  index, 
  seanceTypeId,
  onUpdate 
}: ExerciceItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    series: exercice.series || 1,
    repetitions: exercice.repetitions || null,
    duration_seconds: exercice.duration_seconds || null,
  });
  // Check if exercise is shared/platform (visible in exercise list)
  const isSharedOrPlatform = exercice.exercice?.status === "shared" || exercice.exercice?.status === "pending";
  const [isVisible, setIsVisible] = useState(isSharedOrPlatform);
  const [saving, setSaving] = useState(false);

  const thumbnailUrl = exercice.exercice?.thumbnail_url || null;
  const videoUrl = exercice.exercice?.video_url || null;
  const exerciceName = exercice.exercice?.title || exercice.name || `Exercice ${index + 1}`;
  const hasVideo = thumbnailUrl || videoUrl;

  const handleSaveMetrics = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("seance_exercices")
        .update({
          series: editValues.series,
          repetitions: editValues.repetitions,
          duration_seconds: editValues.duration_seconds,
        })
        .eq("id", exercice.id);

      if (error) throw error;
      
      toast.success("Exercice mis à jour");
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error("Error updating exercise:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditValues({
      series: exercice.series || 1,
      repetitions: exercice.repetitions || null,
      duration_seconds: exercice.duration_seconds || null,
    });
    setIsEditing(false);
  };

  const handleToggleVisibility = async () => {
    if (!exercice.exercice_id) {
      toast.error("Cet exercice n'est pas lié à un exercice de la bibliothèque");
      return;
    }

    setSaving(true);
    try {
      const newVisibility = !isVisible;
      // Toggle between "draft" (hidden) and "shared" (visible in list)
      const newStatus = newVisibility ? "shared" : "draft";
      
      const { error } = await supabase
        .from("exercices")
        .update({ status: newStatus })
        .eq("id", exercice.exercice_id);

      if (error) throw error;
      
      setIsVisible(newVisibility);
      toast.success(newVisibility ? "Exercice visible dans la liste" : "Exercice masqué de la liste");
    } catch (error) {
      console.error("Error toggling visibility:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Thumbnail with video - full width */}
      {hasVideo && (
        <div className="relative w-full aspect-video bg-muted">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={exerciceName}
              className="w-full h-full object-cover"
            />
          ) : videoUrl ? (
            <video 
              src={videoUrl}
              className="w-full h-full object-cover"
              muted
            />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 text-primary fill-primary ml-0.5" />
            </div>
          </div>
          {/* Order badge */}
          <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
            {index + 1}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Header with name */}
        <div className="flex items-start gap-2">
          {!hasVideo && (
            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
              {index + 1}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">{exerciceName}</p>
            {exercice.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{exercice.description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>

        {/* Metrics display or edit mode */}
        {isEditing ? (
          <div className="space-y-3 bg-muted/50 p-3 rounded-lg">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Séries</Label>
                <Input
                  type="number"
                  min={1}
                  value={editValues.series}
                  onChange={(e) => setEditValues({ ...editValues, series: parseInt(e.target.value) || 1 })}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Reps</Label>
                <Input
                  type="number"
                  min={0}
                  value={editValues.repetitions || ""}
                  onChange={(e) => setEditValues({ ...editValues, repetitions: e.target.value ? parseInt(e.target.value) : null })}
                  className="h-9 text-sm"
                  placeholder="—"
                />
              </div>
              <div>
                <Label className="text-xs">Durée (s)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editValues.duration_seconds || ""}
                  onChange={(e) => setEditValues({ ...editValues, duration_seconds: e.target.value ? parseInt(e.target.value) : null })}
                  className="h-9 text-sm"
                  placeholder="—"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="flex-1 h-9"
                onClick={handleSaveMetrics}
                disabled={saving}
              >
                <Check className="w-4 h-4 mr-1" />
                Valider
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              <span className="text-sm font-bold">{exercice.series || 1}</span>
              <span className="text-xs">série{(exercice.series || 1) > 1 ? "s" : ""}</span>
            </div>
            {exercice.repetitions && (
              <div className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                <span className="text-sm font-bold">{exercice.repetitions}</span>
                <span className="text-xs">reps</span>
              </div>
            )}
            {exercice.duration_seconds && (
              <div className="inline-flex items-center gap-1 bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                <span className="text-sm font-bold">{exercice.duration_seconds}</span>
                <span className="text-xs">sec</span>
              </div>
            )}
          </div>
        )}

        {/* Separator */}
        <Separator />

        {/* Visibility toggle */}
        {exercice.exercice_id && (
          <div className="flex items-center justify-between">
            <Label 
              htmlFor={`ex-visibility-${exercice.id}`} 
              className="text-xs text-muted-foreground cursor-pointer"
            >
              Visible dans "Mes exercices"
            </Label>
            <Switch
              id={`ex-visibility-${exercice.id}`}
              checked={isVisible}
              onCheckedChange={handleToggleVisibility}
              disabled={saving}
            />
          </div>
        )}
      </div>
    </div>
  );
}