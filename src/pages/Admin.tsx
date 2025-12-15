import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  FileText, 
  BarChart3, 
  Search, 
  Crown, 
  Clock, 
  Star,
  Trash2,
  Shield
} from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  trial_end_date: string | null;
  is_premium: boolean | null;
  created_at: string;
}

interface SeanceType {
  id: string;
  pathologie: string;
  objectif_principal: string;
  author_name: string | null;
  is_shared: boolean;
  user_id: string;
  created_at: string;
}

interface Stats {
  totalUsers: number;
  premiumUsers: number;
  trialUsers: number;
  totalSeances: number;
  sharedSeances: number;
  totalPatients: number;
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [seances, setSeances] = useState<SeanceType[]>([]);
  const [featuredSeances, setFeaturedSeances] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    premiumUsers: 0,
    trialUsers: 0,
    totalSeances: 0,
    sharedSeances: 0,
    totalPatients: 0,
  });
  const [userSearch, setUserSearch] = useState("");
  const [seanceSearch, setSeanceSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les droits d'accès à cette page.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAdmin, adminLoading, user, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch seances
      const { data: seancesData, error: seancesError } = await supabase
        .from("seance_types")
        .select("*")
        .order("created_at", { ascending: false });

      if (seancesError) throw seancesError;
      setSeances(seancesData || []);

      // Fetch featured seances
      const { data: featuredData, error: featuredError } = await supabase
        .from("featured_seances")
        .select("seance_type_id");

      if (featuredError) throw featuredError;
      setFeaturedSeances(featuredData?.map(f => f.seance_type_id) || []);

      // Calculate stats
      const now = new Date();
      const premiumCount = usersData?.filter(u => u.is_premium).length || 0;
      const trialCount = usersData?.filter(u => 
        !u.is_premium && u.trial_end_date && new Date(u.trial_end_date) > now
      ).length || 0;
      const sharedCount = seancesData?.filter(s => s.is_shared).length || 0;

      // Fetch patients count
      const { count: patientsCount } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true });

      setStats({
        totalUsers: usersData?.length || 0,
        premiumUsers: premiumCount,
        trialUsers: trialCount,
        totalSeances: seancesData?.length || 0,
        sharedSeances: sharedCount,
        totalPatients: patientsCount || 0,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePremium = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_premium: !currentStatus })
        .eq("user_id", userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.user_id === userId ? { ...u, is_premium: !currentStatus } : u
      ));

      toast({
        title: "Succès",
        description: `Utilisateur ${!currentStatus ? "passé en premium" : "retiré du premium"}.`,
      });
    } catch (error) {
      console.error("Error updating premium status:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    }
  };

  const toggleAdmin = async (userId: string) => {
    try {
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (existingRole) {
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");
        
        toast({ title: "Rôle admin retiré" });
      } else {
        await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });
        
        toast({ title: "Rôle admin ajouté" });
      }

      fetchData();
    } catch (error) {
      console.error("Error toggling admin:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rôle.",
        variant: "destructive",
      });
    }
  };

  const toggleFeatured = async (seanceId: string) => {
    try {
      if (featuredSeances.includes(seanceId)) {
        const { error } = await supabase
          .from("featured_seances")
          .delete()
          .eq("seance_type_id", seanceId);

        if (error) throw error;

        setFeaturedSeances(featuredSeances.filter(id => id !== seanceId));
        toast({ title: "Séance retirée des mises en avant" });
      } else {
        const { error } = await supabase
          .from("featured_seances")
          .insert({ seance_type_id: seanceId, added_by: user!.id });

        if (error) throw error;

        setFeaturedSeances([...featuredSeances, seanceId]);
        toast({ title: "Séance mise en avant pour les utilisateurs en essai" });
      }
    } catch (error) {
      console.error("Error toggling featured:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut.",
        variant: "destructive",
      });
    }
  };

  const deleteSeance = async (seanceId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette séance ?")) return;

    try {
      const { error } = await supabase
        .from("seance_types")
        .delete()
        .eq("id", seanceId);

      if (error) throw error;

      setSeances(seances.filter(s => s.id !== seanceId));
      toast({ title: "Séance supprimée" });
    } catch (error) {
      console.error("Error deleting seance:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la séance.",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(u => 
    (u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const filteredSeances = seances.filter(s =>
    s.pathologie.toLowerCase().includes(seanceSearch.toLowerCase()) ||
    s.objectif_principal.toLowerCase().includes(seanceSearch.toLowerCase()) ||
    s.author_name?.toLowerCase().includes(seanceSearch.toLowerCase())
  );

  if (authLoading || adminLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="font-display text-3xl font-bold text-foreground">
            Administration
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-xs text-muted-foreground">Utilisateurs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Crown className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
              <p className="text-2xl font-bold">{stats.premiumUsers}</p>
              <p className="text-xs text-muted-foreground">Premium</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{stats.trialUsers}</p>
              <p className="text-xs text-muted-foreground">En essai</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="w-6 h-6 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold">{stats.totalSeances}</p>
              <p className="text-xs text-muted-foreground">Séances</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="w-6 h-6 mx-auto text-orange-500 mb-2" />
              <p className="text-2xl font-bold">{stats.sharedSeances}</p>
              <p className="text-xs text-muted-foreground">Partagées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-6 h-6 mx-auto text-purple-500 mb-2" />
              <p className="text-2xl font-bold">{stats.totalPatients}</p>
              <p className="text-xs text-muted-foreground">Patients</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="seances" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Modération Séances
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des utilisateurs</CardTitle>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Rechercher par nom ou email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Utilisateur</th>
                        <th className="text-left py-3 px-2">Email</th>
                        <th className="text-left py-3 px-2">Statut</th>
                        <th className="text-left py-3 px-2">Fin essai</th>
                        <th className="text-left py-3 px-2">Premium</th>
                        <th className="text-left py-3 px-2">Admin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => {
                        const now = new Date();
                        const trialEnd = u.trial_end_date ? new Date(u.trial_end_date) : null;
                        const isInTrial = trialEnd && trialEnd > now && !u.is_premium;
                        const trialExpired = trialEnd && trialEnd <= now && !u.is_premium;

                        return (
                          <tr key={u.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-2">
                              {u.first_name} {u.last_name}
                            </td>
                            <td className="py-3 px-2 text-sm text-muted-foreground">
                              {u.email}
                            </td>
                            <td className="py-3 px-2">
                              {u.is_premium ? (
                                <Badge className="bg-yellow-500">Premium</Badge>
                              ) : isInTrial ? (
                                <Badge variant="secondary">En essai</Badge>
                              ) : trialExpired ? (
                                <Badge variant="destructive">Essai expiré</Badge>
                              ) : (
                                <Badge variant="outline">Standard</Badge>
                              )}
                            </td>
                            <td className="py-3 px-2 text-sm">
                              {trialEnd ? trialEnd.toLocaleDateString("fr-FR") : "-"}
                            </td>
                            <td className="py-3 px-2">
                              <Switch
                                checked={u.is_premium || false}
                                onCheckedChange={() => togglePremium(u.user_id, u.is_premium || false)}
                              />
                            </td>
                            <td className="py-3 px-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleAdmin(u.user_id)}
                              >
                                <Shield className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seances">
            <Card>
              <CardHeader>
                <CardTitle>Modération des séances</CardTitle>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Rechercher par pathologie, objectif ou auteur..."
                    value={seanceSearch}
                    onChange={(e) => setSeanceSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Pathologie</th>
                        <th className="text-left py-3 px-2">Objectif</th>
                        <th className="text-left py-3 px-2">Auteur</th>
                        <th className="text-left py-3 px-2">Partagée</th>
                        <th className="text-left py-3 px-2">Mise en avant</th>
                        <th className="text-left py-3 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSeances.map((s) => (
                        <tr key={s.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2">{s.pathologie}</td>
                          <td className="py-3 px-2">{s.objectif_principal}</td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">
                            {s.author_name || "Anonyme"}
                          </td>
                          <td className="py-3 px-2">
                            {s.is_shared ? (
                              <Badge variant="secondary">Partagée</Badge>
                            ) : (
                              <Badge variant="outline">Privée</Badge>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            <Switch
                              checked={featuredSeances.includes(s.id)}
                              onCheckedChange={() => toggleFeatured(s.id)}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteSeance(s.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
