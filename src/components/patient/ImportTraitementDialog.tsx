import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Loader2, Search, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface TraitementType {
  id: string;
  pathologie: string;
  author_name: string | null;
  is_shared: boolean;
  is_validated: boolean | null;
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
  const [traitements, setTraitements] = useState<TraitementType[]>([]);

  useEffect(() => {
    if (open && user) {
      fetchTraitements();
    }
  }, [open, user]);

  const fetchTraitements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("traitement_types")
      .select("id, pathologie, author_name, is_shared, is_validated")
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
    (t) => !t.is_shared || (t.is_shared && t.author_name)
  );
  const sharedTraitements = filteredTraitements.filter(
    (t) => t.is_shared && t.is_validated
  );

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

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
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
                        onClick={() => {
                          onSelect(t.id);
                          onOpenChange(false);
                        }}
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
                        onClick={() => {
                          onSelect(t.id);
                          onOpenChange(false);
                        }}
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
