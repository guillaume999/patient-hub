import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Loader2, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface SeanceType {
  id: string;
  pathologie: string;
  objectif_principal: string;
  author_name: string | null;
  is_shared: boolean;
  is_validated: boolean | null;
}

interface ImportSeanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (seanceTypeId: string) => void;
}

export function ImportSeanceDialog({
  open,
  onOpenChange,
  onSelect,
}: ImportSeanceDialogProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [seances, setSeances] = useState<SeanceType[]>([]);

  useEffect(() => {
    if (open && user) {
      fetchSeances();
    }
  }, [open, user]);

  const fetchSeances = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("seance_types")
      .select("id, pathologie, objectif_principal, author_name, is_shared, is_validated")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSeances(data);
    }
    setLoading(false);
  };

  const filteredSeances = seances.filter(
    (s) =>
      s.pathologie.toLowerCase().includes(search.toLowerCase()) ||
      s.objectif_principal.toLowerCase().includes(search.toLowerCase())
  );

  const mySeances = filteredSeances.filter((s) => !s.is_shared);
  const sharedSeances = filteredSeances.filter((s) => s.is_shared && s.is_validated);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importer une séance</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par pathologie ou objectif..."
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
              {mySeances.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-muted-foreground">
                    Mes séances
                  </h4>
                  <div className="space-y-2">
                    {mySeances.map((s) => (
                      <Button
                        key={s.id}
                        variant="outline"
                        className="w-full justify-start h-auto py-3"
                        onClick={() => {
                          onSelect(s.id);
                          onOpenChange(false);
                        }}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{s.pathologie}</span>
                          <span className="text-xs text-muted-foreground">
                            {s.objectif_principal}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {sharedSeances.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-muted-foreground">
                    Séances partagées
                  </h4>
                  <div className="space-y-2">
                    {sharedSeances.map((s) => (
                      <Button
                        key={s.id}
                        variant="outline"
                        className="w-full justify-start h-auto py-3"
                        onClick={() => {
                          onSelect(s.id);
                          onOpenChange(false);
                        }}
                      >
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{s.pathologie}</span>
                            <Badge variant="secondary" className="text-xs">
                              Validé
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {s.objectif_principal}
                          </span>
                          {s.author_name && (
                            <span className="text-xs text-muted-foreground">
                              Par {s.author_name}
                            </span>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {filteredSeances.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Aucune séance trouvée
                </p>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
