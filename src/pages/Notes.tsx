import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/lib/auth";
import { FileText, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Notes() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [user, loading, navigate]);

  if (loading) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-orange-500/10"><FileText className="w-6 h-6 text-orange-500" /></div>
          <div><h1 className="text-3xl font-display font-bold">Notes</h1><p className="text-muted-foreground">Gérez vos notes médicales</p></div>
        </div>
        <Card><CardContent className="flex items-center justify-center py-20"><p className="text-muted-foreground">Fonctionnalité de notes à venir</p></CardContent></Card>
      </div>
    </Layout>
  );
}
