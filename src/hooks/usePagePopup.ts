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
        let popupData: Popup | null = null;
        try {
          popupData = await pb.collection("admin_popups").getFirstListItem(
            `page_key = "${pageKey}" && is_active = true`
          ) as Popup;
        } catch (err: any) {
          if (err?.status !== 404) {
            console.error("Error fetching popup:", err);
          }
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
        let dismissed = false;
        try {
          await pb.collection("user_dismissed_popups").getFirstListItem(
            `popup_id = "${popupData.id}" && user_id = "${user.id}"`
          );
          dismissed = true;
        } catch (err: any) {
          if (err?.status !== 404) {
            console.error("Error checking dismissed status:", err);
          }
        }

        setIsDismissed(dismissed);
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
