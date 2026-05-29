import { useState, useEffect } from "react";
import { pb } from "@/integrations/pocketbase/client";
import { useAuth } from "@/lib/auth";

interface Popup {
  id: string;
  page_key: string;
  title: string;
  content: string;
  is_active: boolean;
}

export function usePagePopup(pageKey: string) {
  const { user } = useAuth();
  const [popup, setPopup] = useState<Popup | null>(null);
  const [isDismissed, setIsDismissed] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopup = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch the popup for this page
        let _d = null, _e = null; try { _d = await pb.collection("admin_popups").getFullList({}); } catch(e: any) { _e = e; }
                const data = _d; const error = _e;
          .select("*")
          .eq("page_key", pageKey)
          .eq("is_active", true)
          .maybeSingle();

        if (popupError) {
          console.error("Error fetching popup:", popupError);
          setLoading(false);
          return;
        }

        if (!popupData) {
          setPopup(null);
          setLoading(false);
          return;
        }

        setPopup(popupData);

        // Check if user has dismissed this popup
        let _d = null, _e = null; try { _d = await pb.collection("user_dismissed_popups").getFullList({}); } catch(e: any) { _e = e; }
                const data = _d; const error = _e;
          .select("id")
          .eq("popup_id", popupData.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (dismissedError) {
          console.error("Error checking dismissed status:", dismissedError);
        }

        setIsDismissed(!!dismissedData);
      } catch (err) {
        console.error("Error in usePagePopup:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPopup();
  }, [pageKey, user]);

  const dismissPopup = async (dontShowAgain: boolean) => {
    if (!user || !popup) return;

    if (dontShowAgain) {
      try {
        await pb.collection("user_dismissed_popups").create({
          user_id: user.id,
          popup_id: popup.id,
        });
      } catch (err) {
        console.error("Error dismissing popup:", err);
      }
    }

    setIsDismissed(true);
  };

  const shouldShowPopup = !loading && popup && !isDismissed;

  return {
    popup,
    shouldShowPopup,
    dismissPopup,
    loading,
  };
}
