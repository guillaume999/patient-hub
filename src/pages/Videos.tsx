import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/lib/auth";
import { Video, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Videos() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [user, loading, navigate]);

  if (loading) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-purple-500/10"><Video className="w-6 h-6 text-purple-500" /></div>
          <div><h1 className="text-3xl font-display font-bold">Vidéothèque</h1><p className="text-muted-foreground">Gérez vos vidéos médicales</p></div>
        </div>
        <Card><CardContent className="flex items-center justify-center py-20"><p className="text-muted-foreground">Fonctionnalité de vidéothèque à venir</p></CardContent></Card>
      </div>
    </Layout>
  );
}
