import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Users, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
}

export default function Patients() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ first_name: "", last_name: "", email: "", phone: "", date_of_birth: "", city: "" });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchPatients();
  }, [user]);

  const fetchPatients = async () => {
    const { data, error } = await supabase.from("patients").select("id, first_name, last_name, date_of_birth, email, phone, city").order("created_at", { ascending: false });
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else setPatients(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("patients").insert({ ...formData, user_id: user?.id });
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Patient ajouté" }); setIsDialogOpen(false); setFormData({ first_name: "", last_name: "", email: "", phone: "", date_of_birth: "", city: "" }); fetchPatients(); }
  };

  const filtered = patients.filter(p => `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()));

  if (authLoading || loading) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10"><Users className="w-6 h-6 text-blue-500" /></div>
            <div><h1 className="text-3xl font-display font-bold">Patients</h1><p className="text-muted-foreground">{patients.length} patient(s) enregistré(s)</p></div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogTrigger asChild><Button className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" />Ajouter</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>Nouveau patient</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4"><div><Label>Prénom *</Label><Input required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} /></div><div><Label>Nom *</Label><Input required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} /></div></div>
                  <div className="grid grid-cols-2 gap-4"><div><Label>Email</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div><div><Label>Téléphone</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div></div>
                  <div className="grid grid-cols-2 gap-4"><div><Label>Date de naissance</Label><Input type="date" value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} /></div><div><Label>Ville</Label><Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div></div>
                  <Button type="submit" className="w-full gradient-primary text-primary-foreground">Enregistrer</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead>Téléphone</TableHead><TableHead>Ville</TableHead></TableRow></TableHeader><TableBody>{filtered.map(p => (<TableRow key={p.id}><TableCell className="font-medium">{p.first_name} {p.last_name}</TableCell><TableCell>{p.email || "-"}</TableCell><TableCell>{p.phone || "-"}</TableCell><TableCell>{p.city || "-"}</TableCell></TableRow>))}{filtered.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucun patient trouvé</TableCell></TableRow>}</TableBody></Table></CardContent></Card>
      </div>
    </Layout>
  );
}
