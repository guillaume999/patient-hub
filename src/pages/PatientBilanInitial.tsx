import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Save, ClipboardList, User, Printer } from "lucide-react";

interface BilanData {
  profession: string;
  poids: string;
  taille: string;
  lateralite: string;
  loisir_sport: string;
  situation_fam: string;
  pathologie: string;
  plainte_patient: string;
  date_debut: string;
  circonstances: string;
  evolution: string;
  signes: string;
  mvt_impossibles: string;
  atcd: string;
  ttt_deja_suivis: string;
  projets_attentes: string;
  douleur_localisation: string;
  douleur_type: string;
  douleur_circonstances_apparition: string;
  douleur_eva: string;
  douleur_soulage_aggrave: string;
  morpho_extension_flexion: string;
  morpho_fonctionnel: string;
  morpho_attitude_statique: string;
  morpho_ceinture: string;
  morpho_dos: string;
  morpho_bassin: string;
  morpho_genou: string;
  morpho_pieds: string;
  morpho_articulaire: string;
  cutaneo_cicatrice_couleur: string;
  cutaneo_trophiques: string;
  cutaneo_adherences_chaleur: string;
  cutaneo_test_decollement: string;
  cutaneo_test_godet: string;
  cutaneo_amyotrophie: string;
  force_musculaire: string;
  commentaires: string;
}

const defaultBilan: BilanData = {
  profession: "",
  poids: "",
  taille: "",
  lateralite: "",
  loisir_sport: "",
  situation_fam: "",
  pathologie: "",
  plainte_patient: "",
  date_debut: "",
  circonstances: "",
  evolution: "",
  signes: "",
  mvt_impossibles: "",
  atcd: "",
  ttt_deja_suivis: "",
  projets_attentes: "",
  douleur_localisation: "",
  douleur_type: "",
  douleur_circonstances_apparition: "",
  douleur_eva: "",
  douleur_soulage_aggrave: "",
  morpho_extension_flexion: "",
  morpho_fonctionnel: "",
  morpho_attitude_statique: "",
  morpho_ceinture: "",
  morpho_dos: "",
  morpho_bassin: "",
  morpho_genou: "",
  morpho_pieds: "",
  morpho_articulaire: "",
  cutaneo_cicatrice_couleur: "",
  cutaneo_trophiques: "",
  cutaneo_adherences_chaleur: "",
  cutaneo_test_decollement: "",
  cutaneo_test_godet: "",
  cutaneo_amyotrophie: "",
  force_musculaire: "",
  commentaires: "",
};

export default function PatientBilanInitial() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bilan, setBilan] = useState<BilanData>(defaultBilan);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchPatientData();
    }
  }, [user, id]);

  const fetchPatientData = async () => {
    const { data: patient } = await supabase
      .from("patients")
      .select("name")
      .eq("id", id)
      .maybeSingle();

    if (patient) {
      setPatientName(patient.name);
    }

    const { data: carePlan } = await supabase
      .from("patient_care_plans")
      .select("bilan_kine")
      .eq("patient_id", id)
      .maybeSingle();

    if (carePlan?.bilan_kine) {
      try {
        const parsed = JSON.parse(carePlan.bilan_kine);
        if (typeof parsed === "object") {
          setBilan({ ...defaultBilan, ...parsed });
        }
      } catch {
        setBilan(prev => ({ ...prev, commentaires: carePlan.bilan_kine || "" }));
      }
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!id || !user) return;
    setSaving(true);

    const bilanJson = JSON.stringify(bilan);

    const { data: existingPlan } = await supabase
      .from("patient_care_plans")
      .select("id")
      .eq("patient_id", id)
      .maybeSingle();

    if (existingPlan) {
      await supabase
        .from("patient_care_plans")
        .update({ bilan_kine: bilanJson })
        .eq("id", existingPlan.id);
    } else {
      await supabase
        .from("patient_care_plans")
        .insert({
          patient_id: id,
          user_id: user.id,
          bilan_kine: bilanJson,
        });
    }

    toast({ title: "Bilan initial enregistré" });
    setSaving(false);
  };

  const handleChange = (field: keyof BilanData, value: string) => {
    setBilan(prev => ({ ...prev, [field]: value }));
  };

  const handlePrint = () => {
    window.print();
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const cellBase = "border border-border print:border-foreground p-1 text-sm";
  const cellLabel = `${cellBase} font-semibold bg-muted/50 whitespace-nowrap`;
  const cellHeader = `${cellBase} font-bold text-center bg-primary/10`;
  const inputClass = "border-0 p-0 h-6 bg-transparent focus-visible:ring-0 text-sm";
  const textareaClass = "border-0 p-0 min-h-[60px] bg-transparent focus-visible:ring-0 text-sm resize-none";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl print:max-w-none print:px-2 print:py-2">
        <div className="flex items-center gap-4 mb-8 print:hidden">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/patients/${id}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <ClipboardList className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Bilan Initial</h1>
              <p className="text-muted-foreground flex items-center gap-1">
                <User className="w-4 h-4" />
                {patientName}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Enregistrer
            </Button>
          </div>
        </div>

        {/* Grille style tableur */}
        <div className="border border-border rounded-lg overflow-auto print:border-foreground print:rounded-none">
          <table className="w-full text-sm border-collapse min-w-[900px]">
            <tbody>
              {/* En-tête pour impression */}
              <tr className="hidden print:table-row">
                <td colSpan={8} className={`${cellHeader} text-lg py-2`}>
                  BILAN INITIAL KINÉSITHÉRAPIE
                </td>
              </tr>
              
              {/* Ligne 1 */}
              <tr>
                <td className={cellLabel}>NOM</td>
                <td className={cellBase}>
                  <Input value={patientName} readOnly className={inputClass} />
                </td>
                <td className={cellLabel}>PROFESSION</td>
                <td className={cellBase}>
                  <Input value={bilan.profession} onChange={(e) => handleChange("profession", e.target.value)} className={inputClass} />
                </td>
                <td colSpan={2} className={cellHeader}>BILAN DOULEURS</td>
                <td className={cellLabel}>EVA</td>
                <td className={cellLabel}>SOULAGE/AGGRAVE</td>
              </tr>

              {/* Ligne 2 */}
              <tr>
                <td className={cellLabel}>PRÉNOM</td>
                <td className={cellBase}>
                  <div className="h-6 border-b border-dashed border-muted-foreground print:border-foreground"></div>
                </td>
                <td className={cellLabel}>POIDS, TAILLE</td>
                <td className={cellBase}>
                  <Input value={`${bilan.poids}${bilan.poids ? ' kg' : ''} / ${bilan.taille}${bilan.taille ? ' cm' : ''}`} readOnly className={inputClass} />
                </td>
                <td className={cellLabel}>LOCALISATION</td>
                <td className={cellLabel}>TYPE</td>
                <td className={cellLabel}>CIRCONSTANCES</td>
                <td className={cellBase} rowSpan={5}>
                  <Textarea value={bilan.douleur_soulage_aggrave} onChange={(e) => handleChange("douleur_soulage_aggrave", e.target.value)} className={textareaClass} />
                </td>
              </tr>

              {/* Ligne 3 */}
              <tr>
                <td className={cellLabel}>NAIS. / AGE</td>
                <td className={cellBase}>
                  <div className="h-6 border-b border-dashed border-muted-foreground print:border-foreground"></div>
                </td>
                <td className={cellLabel}>LATÉRALITÉ</td>
                <td className={cellBase}>
                  <Input value={bilan.lateralite} onChange={(e) => handleChange("lateralite", e.target.value)} className={inputClass} />
                </td>
                <td className={cellBase} rowSpan={4}>
                  <Textarea value={bilan.douleur_localisation} onChange={(e) => handleChange("douleur_localisation", e.target.value)} className={textareaClass} />
                </td>
                <td className={cellBase} rowSpan={4}>
                  <Textarea value={bilan.douleur_type} onChange={(e) => handleChange("douleur_type", e.target.value)} className={textareaClass} />
                </td>
                <td className={cellBase} rowSpan={4}>
                  <Textarea value={bilan.douleur_circonstances_apparition} onChange={(e) => handleChange("douleur_circonstances_apparition", e.target.value)} className={textareaClass} />
                </td>
              </tr>

              {/* Ligne 4 */}
              <tr>
                <td className={cellLabel}>SEXE</td>
                <td className={cellBase}>
                  <div className="h-6 border-b border-dashed border-muted-foreground print:border-foreground"></div>
                </td>
                <td className={cellLabel}>LOISIR, SPORT</td>
                <td className={cellBase}>
                  <Input value={bilan.loisir_sport} onChange={(e) => handleChange("loisir_sport", e.target.value)} className={inputClass} />
                </td>
              </tr>

              {/* Ligne 5 */}
              <tr>
                <td className={cellLabel}>SITUATION FAM</td>
                <td className={cellBase} colSpan={3}>
                  <Input value={bilan.situation_fam} onChange={(e) => handleChange("situation_fam", e.target.value)} className={inputClass} />
                </td>
              </tr>

              {/* Ligne 6 */}
              <tr>
                <td className={cellLabel}>PATHOLOGIE</td>
                <td className={cellBase} colSpan={3}>
                  <Input value={bilan.pathologie} onChange={(e) => handleChange("pathologie", e.target.value)} className={inputClass} />
                </td>
              </tr>

              {/* Ligne 7 */}
              <tr>
                <td className={cellLabel}>PLAINTE PATIENT</td>
                <td className={cellBase} colSpan={3}>
                  <Input value={bilan.plainte_patient} onChange={(e) => handleChange("plainte_patient", e.target.value)} className={inputClass} />
                </td>
                <td className={cellBase} rowSpan={2}>
                  <Textarea value={bilan.douleur_eva} onChange={(e) => handleChange("douleur_eva", e.target.value)} className={textareaClass} placeholder="Habituelle: /10&#10;Pire: /10&#10;Sport: /10" />
                </td>
                <td className={cellBase} colSpan={3} rowSpan={2}></td>
              </tr>

              {/* Ligne 8 */}
              <tr>
                <td className={cellLabel}>DATE</td>
                <td className={cellBase} colSpan={3}>
                  <Input type="date" value={bilan.date_debut} onChange={(e) => handleChange("date_debut", e.target.value)} className={inputClass} />
                </td>
              </tr>

              {/* Ligne 9: CIRCONSTANCES + BILAN MORPHODYNAMIQUE header */}
              <tr>
                <td className={cellLabel}>CIRCONSTANCES</td>
                <td className={cellBase} colSpan={3}>
                  <Input value={bilan.circonstances} onChange={(e) => handleChange("circonstances", e.target.value)} className={inputClass} />
                </td>
                <td colSpan={2} className={cellHeader}>BILAN MORPHODYNAMIQUE</td>
                <td colSpan={2} className={cellLabel}>EXTENSION, FLEXION, OSCILLE, TRAJETS, FORCE</td>
              </tr>

              {/* Ligne 10 */}
              <tr>
                <td className={cellLabel}>ÉVOLUTION</td>
                <td className={cellBase} colSpan={3}>
                  <Input value={bilan.evolution} onChange={(e) => handleChange("evolution", e.target.value)} className={inputClass} />
                </td>
                <td className={cellBase} colSpan={2} rowSpan={3}>
                  <Textarea value={bilan.morpho_extension_flexion} onChange={(e) => handleChange("morpho_extension_flexion", e.target.value)} className={textareaClass} />
                </td>
                <td className={cellBase} colSpan={2} rowSpan={3}>
                  <Textarea value={bilan.morpho_fonctionnel} onChange={(e) => handleChange("morpho_fonctionnel", e.target.value)} className={textareaClass} placeholder="Fonctionnel..." />
                </td>
              </tr>

              {/* Ligne 11 */}
              <tr>
                <td className={cellLabel}>GÊNES</td>
                <td className={cellBase} colSpan={3}>
                  <Input value={bilan.signes} onChange={(e) => handleChange("signes", e.target.value)} className={inputClass} />
                </td>
              </tr>

              {/* Ligne 12 */}
              <tr>
                <td className={cellLabel}>MVT IMPOSSIBLES</td>
                <td className={cellBase} colSpan={3}>
                  <Input value={bilan.mvt_impossibles} onChange={(e) => handleChange("mvt_impossibles", e.target.value)} className={inputClass} />
                </td>
              </tr>

              {/* Ligne 13: vide + FONCTIONNEL */}
              <tr>
                <td className={cellBase}></td>
                <td className={cellBase} colSpan={3}></td>
                <td colSpan={4} className={cellLabel}>FONCTIONNEL</td>
              </tr>

              {/* Ligne 14 */}
              <tr>
                <td className={cellBase}></td>
                <td className={cellBase} colSpan={3}></td>
                <td className={cellBase} colSpan={4} rowSpan={2}>
                  <Textarea value={bilan.force_musculaire} onChange={(e) => handleChange("force_musculaire", e.target.value)} className={textareaClass} placeholder="Tests fonctionnels..." />
                </td>
              </tr>

              {/* Ligne 15: ATCD */}
              <tr>
                <td className={cellLabel}>ATCD</td>
                <td className={cellBase} colSpan={3} rowSpan={2}>
                  <Textarea value={bilan.atcd} onChange={(e) => handleChange("atcd", e.target.value)} className={textareaClass} />
                </td>
              </tr>

              {/* Ligne 16: vide + BILAN MORPHOSTATIQUE header */}
              <tr>
                <td className={cellBase}></td>
                <td colSpan={2} className={cellHeader}>BILAN MORPHOSTATIQUE</td>
                <td className={cellBase} colSpan={2}></td>
              </tr>

              {/* Ligne 17: vide + ATTITUDE STATIQUE */}
              <tr>
                <td className={cellBase}></td>
                <td className={cellBase} colSpan={3}></td>
                <td className={cellLabel}>ATTITUDE STATIQUE</td>
                <td className={cellBase} colSpan={3}>
                  <Input value={bilan.morpho_attitude_statique} onChange={(e) => handleChange("morpho_attitude_statique", e.target.value)} className={inputClass} />
                </td>
              </tr>

              {/* Ligne 18: TTT K DEJA SUIVIS + CEINTURE */}
              <tr>
                <td className={cellLabel}>TTT K DÉJÀ SUIVIS</td>
                <td className={cellBase} colSpan={3} rowSpan={3}>
                  <Textarea value={bilan.ttt_deja_suivis} onChange={(e) => handleChange("ttt_deja_suivis", e.target.value)} className={textareaClass} />
                </td>
                <td className={cellLabel}>CEINTURE</td>
                <td className={cellBase} colSpan={3}>
                  <Input value={bilan.morpho_ceinture} onChange={(e) => handleChange("morpho_ceinture", e.target.value)} className={inputClass} />
                </td>
              </tr>

              {/* Ligne 19: DOS */}
              <tr>
                <td className={cellBase}></td>
                <td className={cellLabel}>DOS</td>
                <td className={cellBase} colSpan={3}>
                  <Input value={bilan.morpho_dos} onChange={(e) => handleChange("morpho_dos", e.target.value)} className={inputClass} />
                </td>
              </tr>

              {/* Ligne 20: BASSIN */}
              <tr>
                <td className={cellBase}></td>
                <td className={cellLabel}>BASSIN</td>
                <td className={cellBase} colSpan={3}>
                  <Input value={bilan.morpho_bassin} onChange={(e) => handleChange("morpho_bassin", e.target.value)} className={inputClass} />
                </td>
              </tr>

              {/* Ligne 21: PROJETS ATTENTES + GENOU */}
              <tr>
                <td className={cellLabel}>PROJETS, ATTENTES</td>
                <td className={cellBase} colSpan={3} rowSpan={2}>
                  <Textarea value={bilan.projets_attentes} onChange={(e) => handleChange("projets_attentes", e.target.value)} className={textareaClass} />
                </td>
                <td className={cellLabel}>GENOU</td>
                <td className={cellBase} colSpan={3}>
                  <Input value={bilan.morpho_genou} onChange={(e) => handleChange("morpho_genou", e.target.value)} className={inputClass} />
                </td>
              </tr>

              {/* Ligne 22: PIEDS */}
              <tr>
                <td className={cellBase}></td>
                <td className={cellLabel}>PIEDS</td>
                <td className={cellBase} colSpan={3}>
                  <Input value={bilan.morpho_pieds} onChange={(e) => handleChange("morpho_pieds", e.target.value)} className={inputClass} />
                </td>
              </tr>

              {/* Ligne 23: BILAN CUTANEO-TROPHIQUE + ARTICULAIRE */}
              <tr>
                <td colSpan={2} className={cellHeader}>BILAN CUTANÉO-TROPHIQUE</td>
                <td className={cellBase} colSpan={2}></td>
                <td className={cellLabel}>ARTICULAIRE</td>
                <td className={cellBase} colSpan={3}>
                  <Input value={bilan.morpho_articulaire} onChange={(e) => handleChange("morpho_articulaire", e.target.value)} className={inputClass} />
                </td>
              </tr>

              {/* Ligne 24: CICATRICE */}
              <tr>
                <td className={cellLabel}>CICATRICE, COULEUR</td>
                <td className={cellBase} colSpan={3}>
                  <Input value={bilan.cutaneo_cicatrice_couleur} onChange={(e) => handleChange("cutaneo_cicatrice_couleur", e.target.value)} className={inputClass} />
                </td>
                <td className={cellBase} colSpan={4}></td>
              </tr>

              {/* Ligne 25: TROPHIQUES */}
              <tr>
                <td className={cellLabel}>TROPHIQUES</td>
                <td className={cellBase} colSpan={3}>
                  <Input value={bilan.cutaneo_trophiques} onChange={(e) => handleChange("cutaneo_trophiques", e.target.value)} className={inputClass} />
                </td>
                <td className={cellBase} colSpan={4}></td>
              </tr>

              {/* Ligne 26: ADHERENCES */}
              <tr>
                <td className={cellLabel}>ADHÉRENCES, CHALEUR</td>
                <td className={cellBase} colSpan={3}>
                  <Input value={bilan.cutaneo_adherences_chaleur} onChange={(e) => handleChange("cutaneo_adherences_chaleur", e.target.value)} className={inputClass} />
                </td>
                <td className={cellBase} colSpan={4}></td>
              </tr>

              {/* Ligne 27: TEST DECOLLEMENT */}
              <tr>
                <td className={cellLabel}>TEST DÉCOLLEMENT</td>
                <td className={cellBase} colSpan={3}>
                  <Input value={bilan.cutaneo_test_decollement} onChange={(e) => handleChange("cutaneo_test_decollement", e.target.value)} className={inputClass} />
                </td>
                <td className={cellBase} colSpan={4}></td>
              </tr>

              {/* Ligne 28: TEST GODET */}
              <tr>
                <td className={cellLabel}>TEST GODET</td>
                <td className={cellBase} colSpan={3}>
                  <Input value={bilan.cutaneo_test_godet} onChange={(e) => handleChange("cutaneo_test_godet", e.target.value)} className={inputClass} />
                </td>
                <td className={cellBase} colSpan={4}></td>
              </tr>

              {/* Ligne 29: AMYOTROPHIE */}
              <tr>
                <td className={cellLabel}>AMYOTROPHIE</td>
                <td className={cellBase} colSpan={3}>
                  <Input value={bilan.cutaneo_amyotrophie} onChange={(e) => handleChange("cutaneo_amyotrophie", e.target.value)} className={inputClass} />
                </td>
                <td className={cellBase} colSpan={4}></td>
              </tr>

              {/* Ligne vide */}
              <tr>
                <td className={cellBase} colSpan={8}></td>
              </tr>

              {/* COMMENTAIRES header */}
              <tr>
                <td className={cellHeader}>COMMENTAIRES</td>
                <td className={cellBase} colSpan={7}></td>
              </tr>

              {/* COMMENTAIRES content */}
              <tr>
                <td className={cellBase} colSpan={8}>
                  <Textarea 
                    value={bilan.commentaires} 
                    onChange={(e) => handleChange("commentaires", e.target.value)} 
                    className="border-0 p-0 min-h-[100px] bg-transparent focus-visible:ring-0 text-sm resize-none w-full" 
                    placeholder="Commentaires généraux..."
                  />
                </td>
              </tr>

              {/* Lignes vides pour espace */}
              <tr>
                <td className={cellBase} colSpan={8}>&nbsp;</td>
              </tr>
              <tr>
                <td className={cellBase} colSpan={8}>&nbsp;</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
