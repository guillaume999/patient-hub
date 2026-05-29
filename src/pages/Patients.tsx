import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { pb } from "@/integrations/pocketbase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Users, Loader2, Calendar, ArrowUpDown, ArrowUp, ArrowDown, Share2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PagePopup } from "@/components/popup/PagePopup";

interface Patient {
  id: string;
  prenom: string;
  nom: string;
  numero: string | null;
  statut: string;
  mutuelle: string | null;
  ordonnance: string | null;
}

type StatusFilter = "all" | "actif" | "en_traitement" | "en_attente" | "inactif";

const statusLabels: Record<string, string> = {
  actif: "Actif",
  en_traitement: "En traitement",
  en_attente: "En attente",
  inactif: "Inactif",
};

const statusColors: Record<string, string> = {
  actif: "bg-green-500/10 text-green-600",
  en_traitement: "bg-blue-500/10 text-blue-600",
  en_attente: "bg-yellow-500/10 text-yellow-600",
  inactif: "bg-muted text-muted-foreground",
};

const ordonnanceLabels: Record<string, string> = {
  oui: "Oui",
  non: "Non",
  renouv_kine: "Renouv. kiné",
};

export default function Patients() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("en_traitement");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<keyof Patient | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    statut: "actif",
    mutuelle: "non",
    ordonnance: "non",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchPatients();
  }, [user]);

  const fetchPatients = async () => {
    try {
      const items = await pb.collection("patients").getFullList({
        filter: `praticien = "${user?.id}"`,
        sort: "-created",
        fields: "id,prenom,nom,numero,statut,mutuelle,ordonnance",
      });
      setPatients(items as unknown as Patient[]);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updatePatientStatut = async (patientId: string, newStatut: string) => {
    try {
      await pb.collection("patients").update(patientId, { statut: newStatut });
      setPatients(patients.map(p => p.id === patientId ? { ...p, statut: newStatut } : p));
      toast({ title: "Statut mis à jour" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await pb.collection("patients").create({ ...formData, praticien: user?.id });
      toast({ title: "Patient ajouté" });
      setIsDialogOpen(false);
      setFormData({ prenom: "", nom: "", statut: "actif", mutuelle: "non", ordonnance: "non" });
      fetchPatients();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const handleSort = (column: keyof Patient) => {
    if (sortColumn === column) setSortDirection(d => d === "asc" ? "desc" : "asc");
    else { setSortColumn(column); setSortDirection("asc"); }
  };

  const getSortIcon = (column: keyof Patient) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    return sortDirection === "asc" ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const fullName = (p: Patient) => `${p.prenom} ${p.nom}`.trim();

  const filtered = patients
    .filter(p => {
      const matchesSearch = fullName(p).toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.statut === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (!sortColumn) return 0;
      const aVal = sortColumn === "prenom" ? fullName(a) : a[sortColumn];
      const bVal = sortColumn === "prenom" ? fullName(b) : b[sortColumn];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === "string" && typeof bVal === "string"
        ? aVal.localeCompare(bVal, "fr")
        : (aVal as any) - (bVal as any);
      return sortDirection === "asc" ? cmp : -cmp;
    });

  if (authLoading || loading) return (
    <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>
  );

  return (
    <Layout>
      <PagePopup pageKey="patients" />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10"><Users className="w-6 h-6 text-blue-500" /></div>
            <div>
              <h1 className="text-3xl font-display font-bold">Patients</h1>
              <p className="text-muted-foreground">{patients.length} patient(s) enregistré(s)</p>
            </div>
          </div>
          <div className="flex gap-2 md:gap-4 w-full md:w-auto flex-wrap">
            <Button variant="outline" onClick={() => navigate("/planning")}>
              <Calendar className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Planning</span>
            </Button>
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" />Ajouter</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouveau patient</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Prénom *</Label>
                      <Input required value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} />
                    </div>
                    <div>
                      <Label>Nom *</Label>
                      <Input required value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Statut</Label>
                      <Select value={formData.statut} onValueChange={v => setFormData({...formData, statut: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="actif">Actif</SelectItem>
                          <SelectItem value="en_traitement">En traitement</SelectItem>
                          <SelectItem value="en_attente">En attente</SelectItem>
                          <SelectItem value="inactif">Inactif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Mutuelle</Label>
                      <Select value={formData.mutuelle} onValueChange={v => setFormData({...formData, mutuelle: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="oui">Oui</SelectItem>
                          <SelectItem value="non">Non</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Ordonnance</Label>
                    <Select value={formData.ordonnance} onValueChange={v => setFormData({...formData, ordonnance: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oui">Oui</SelectItem>
                        <SelectItem value="non">Non</SelectItem>
                        <SelectItem value="renouv_kine">Renouv. kiné</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full gradient-primary text-primary-foreground">Enregistrer</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Status filter buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>
            Tous ({patients.length})
          </Button>
          <Button variant={statusFilter === "en_traitement" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("en_traitement")}
            className={statusFilter === "en_traitement" ? "" : "border-blue-500/50 text-blue-600 hover:bg-blue-500/10"}>
            En traitement ({patients.filter(p => p.statut === "en_traitement").length})
          </Button>
          <Button variant={statusFilter === "actif" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("actif")}
            className={statusFilter === "actif" ? "" : "border-green-500/50 text-green-600 hover:bg-green-500/10"}>
            Actif ({patients.filter(p => p.statut === "actif").length})
          </Button>
          <Button variant={statusFilter === "en_attente" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("en_attente")}
            className={statusFilter === "en_attente" ? "" : "border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10"}>
            En attente ({patients.filter(p => p.statut === "en_attente").length})
          </Button>
          <Button variant={statusFilter === "inactif" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("inactif")}
            className={statusFilter === "inactif" ? "" : "border-muted-foreground/50 text-muted-foreground hover:bg-muted"}>
            Inactif ({patients.filter(p => p.statut === "inactif").length})
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px] cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort("prenom")}>
                      <span className="flex items-center">Nom{getSortIcon("prenom")}</span>
                    </TableHead>
                    <TableHead className="min-w-[100px] hidden sm:table-cell cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort("numero")}>
                      <span className="flex items-center">Numéro{getSortIcon("numero")}</span>
                    </TableHead>
                    <TableHead className="min-w-[130px] cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort("statut")}>
                      <span className="flex items-center">Statut{getSortIcon("statut")}</span>
                    </TableHead>
                    <TableHead className="min-w-[80px] hidden md:table-cell cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort("mutuelle")}>
                      <span className="flex items-center">Mutuelle{getSortIcon("mutuelle")}</span>
                    </TableHead>
                    <TableHead className="min-w-[100px] hidden lg:table-cell cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort("ordonnance")}>
                      <span className="flex items-center">Ordonnance{getSortIcon("ordonnance")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/patients/${p.id}`)}>
                      <TableCell className="font-medium">
                        <div>
                          <span>{fullName(p)}</span>
                          <span className="sm:hidden text-xs text-muted-foreground block">{p.numero || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{p.numero || "-"}</TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Select value={p.statut || "actif"} onValueChange={v => updatePatientStatut(p.id, v)}>
                          <SelectTrigger className={`w-full sm:w-36 h-8 text-xs ${statusColors[p.statut] || ""}`}>
                            <SelectValue>{statusLabels[p.statut] || p.statut}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="actif">Actif</SelectItem>
                            <SelectItem value="en_traitement">En traitement</SelectItem>
                            <SelectItem value="en_attente">En attente</SelectItem>
                            <SelectItem value="inactif">Inactif</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.mutuelle === "oui" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                          {p.mutuelle === "oui" ? "Oui" : "Non"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          p.ordonnance === "oui" ? "bg-green-500/10 text-green-600" :
                          p.ordonnance === "renouv_kine" ? "bg-orange-500/10 text-orange-600" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {ordonnanceLabels[p.ordonnance || "non"] || "Non"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Aucun patient trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
