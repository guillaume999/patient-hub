import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Loader2, Search, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface TraitementType {
  id: string;
  pathologie: string;
  description: string | null;
  author_name: string | null;
  is_shared: boolean;
  is_validated: boolean | null;
  user_id: string;
}

interface ImportTraitementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (traitementId: string) => void;
}

export function ImportTraitementDialog({
  open,
  onOpenChange,
  onSelect,
}: ImportTraitementDialogProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [traitements, setTraitements] = useState<TraitementType[]>([]);
  const [userPseudo, setUserPseudo] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      fetchTraitements();
      fetchUserPseudo();
    }
  }, [open, user]);

  const fetchUserPseudo = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("pseudo")
      .eq("user_id", user.id)
      .maybeSingle();
    setUserPseudo(data?.pseudo || null);
  };

  const fetchTraitements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("traitement_types")
      .select("id, pathologie, description, author_name, is_shared, is_validated, user_id")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTraitements(data);
    }
    setLoading(false);
  };

  const filteredTraitements = traitements.filter((t) =>
    t.pathologie.toLowerCase().includes(search.toLowerCase())
  );

  const myTraitements = filteredTraitements.filter(
    (t) => t.user_id === user?.id
  );
  const sharedTraitements = filteredTraitements.filter(
    (t) => t.is_shared && t.is_validated && t.user_id !== user?.id
  );

  const handleSelectTraitement = async (traitement: TraitementType) => {
    if (!user) return;
    setCopying(true);

    try {
      // Create a hidden copy of the traitement for the patient
      const { data: newTraitement, error: traitementError } = await supabase
        .from("traitement_types")
        .insert({
          user_id: user.id,
          pathologie: traitement.pathologie,
          description: traitement.description,
          author_name: userPseudo || traitement.author_name,
          is_shared: false,
          is_copy: true,
          is_hidden_from_list: true, // Hidden from traitement list
          original_id: traitement.id
        })
        .select()
        .single();

      if (traitementError) throw traitementError;

      // Copy tests
      const { data: testsData } = await supabase
        .from("traitement_tests")
        .select("*")
        .eq("traitement_type_id", traitement.id)
        .order("ordre", { ascending: true });

      if (testsData && testsData.length > 0) {
        for (const test of testsData) {
          await supabase.from("traitement_tests").insert({
            traitement_type_id: newTraitement.id,
            description: test.description,
            exercice_id: test.exercice_id,
            ordre: test.ordre
          });
        }
      }

      // Copy seances
      const { data: seancesData } = await supabase
        .from("traitement_seances")
        .select("*")
        .eq("traitement_type_id", traitement.id)
        .order("ordre", { ascending: true });

      if (seancesData && seancesData.length > 0) {
        for (const seance of seancesData) {
          await supabase.from("traitement_seances").insert({
            traitement_type_id: newTraitement.id,
            seance_type_id: seance.seance_type_id,
            ordre: seance.ordre
          });
        }
      }

      toast.success("Traitement importé pour ce patient");
      onSelect(newTraitement.id);
      onOpenChange(false);
    } catch (error) {
      console.error("Error copying traitement:", error);
      toast.error("Erreur lors de l'importation du traitement");
    } finally {
      setCopying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importer un plan de traitement</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par pathologie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading || copying ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            {copying && <span className="ml-2 text-sm text-muted-foreground">Importation en cours...</span>}
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {myTraitements.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-muted-foreground">
                    Mes traitements
                  </h4>
                  <div className="space-y-2">
                    {myTraitements.map((t) => (
                      <Button
                        key={t.id}
                        variant="outline"
                        className="w-full justify-start h-auto py-3"
                        onClick={() => handleSelectTraitement(t)}
                        disabled={copying}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{t.pathologie}</span>
                          {t.author_name && (
                            <span className="text-xs text-muted-foreground">
                              Par {t.author_name}
                            </span>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {sharedTraitements.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-muted-foreground">
                    Traitements partagés
                  </h4>
                  <div className="space-y-2">
                    {sharedTraitements.map((t) => (
                      <Button
                        key={t.id}
                        variant="outline"
                        className="w-full justify-start h-auto py-3"
                        onClick={() => handleSelectTraitement(t)}
                        disabled={copying}
                      >
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{t.pathologie}</span>
                            <Badge variant="secondary" className="text-xs">
                              Validé
                            </Badge>
                          </div>
                          {t.author_name && (
                            <span className="text-xs text-muted-foreground">
                              Par {t.author_name}
                            </span>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {filteredTraitements.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Aucun traitement trouvé
                </p>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
