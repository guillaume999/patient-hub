import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { pb } from "@/integrations/pocketbase/client";

export type User = {
  id: string;
  email?: string;
  role?: string;
  name?: string;
  [key: string]: any;
};

export type Session = {
  access_token: string;
  user: User;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName?: string, lastName?: string, pseudo?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const model = (pb.authStore as any).record ?? (pb.authStore as any).model;
    if (pb.authStore.isValid && model) {
      setUser(model as User);
      setSession({ access_token: pb.authStore.token, user: model as User });
    }
    setLoading(false);

    const unsub = pb.authStore.onChange(() => {
      const m = (pb.authStore as any).record ?? (pb.authStore as any).model;
      if (pb.authStore.isValid && m) {
        setUser(m as User);
        setSession({ access_token: pb.authStore.token, user: m as User });
      } else {
        setUser(null);
        setSession(null);
      }
    }, false);

    return () => { if (typeof unsub === "function") unsub(); };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await pb.collection("users").authWithPassword(email, password);
      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string, pseudo?: string) => {
    try {
      const name = [firstName, lastName].filter(Boolean).join(" ").trim() || undefined;
      await pb.collection("users").create({
        email,
        password,
        passwordConfirm: password,
        emailVisibility: true,
        ...(name ? { name } : {}),
      });
      await pb.collection("users").authWithPassword(email, password);
      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  };

  const signOut = async () => {
    pb.authStore.clear();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
