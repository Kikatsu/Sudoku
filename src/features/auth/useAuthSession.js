import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient.js";

export function useAuthSession() {
  const [authUser, setAuthUser] = useState(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return undefined;
    let cancelled = false;
    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        if (error) {
          console.warn("Supabase session restore failed; clearing local auth state.", error);
          await supabase.auth.signOut();
        }
        if (!cancelled) {
          setAuthUser(session?.user ?? null);
          setAuthReady(true);
        }
      })
      .catch((error) => {
        console.warn("Supabase session bootstrap failed.", error);
        if (!cancelled) {
          setAuthUser(null);
          setAuthReady(true);
        }
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  return { authUser, authReady, signOut };
}
