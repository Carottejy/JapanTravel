import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthValue {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  resetPassword: (email: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

const redirectTo = () => window.location.origin + import.meta.env.BASE_URL;

// Messages d'erreur Supabase les plus courants, traduits.
function fr(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return "Adresse e-mail ou mot de passe incorrect.";
  if (/email not confirmed/i.test(msg)) return "Adresse e-mail pas encore confirmée : ouvrez le lien reçu par e-mail.";
  if (/already registered/i.test(msg)) return "Un compte existe déjà avec cette adresse.";
  if (/password should be at least/i.test(msg)) return "Le mot de passe doit contenir au moins 6 caractères.";
  if (/rate limit/i.test(msg)) return "Trop de tentatives, réessayez dans quelques minutes.";
  if (/failed to fetch|network/i.test(msg)) return "Impossible de joindre le serveur. Vérifiez votre connexion.";
  return msg;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      // Lien « mot de passe oublié » : on envoie l'utilisateur choisir un nouveau mot de passe.
      if (event === "PASSWORD_RECOVERY") window.location.hash = "#/compte";
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value: AuthValue = {
    session,
    loading,
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? fr(error.message) : null;
    },
    async signUp(email, password) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo() },
      });
      if (error) return { error: fr(error.message), needsConfirmation: false };
      return { error: null, needsConfirmation: !data.session };
    },
    async resetPassword(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectTo() });
      return error ? fr(error.message) : null;
    },
    async signOut() {
      await supabase.auth.signOut();
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const v = useContext(AuthContext);
  if (!v) throw new Error("useAuth hors AuthProvider");
  return v;
}
