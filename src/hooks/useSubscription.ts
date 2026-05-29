import { useAuth } from "@/lib/auth";

export function useSubscription() {
  const { user } = useAuth();
  // Subscription tiers removed — all praticiens have full access
  return {
    subscription: null,
    isLoading: false,
    isSubscribed: true,
    tier: "pro",
  };
}
