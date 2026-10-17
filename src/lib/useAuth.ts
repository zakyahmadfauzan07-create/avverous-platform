import { useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, UserProfile } from '@/lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
      (async () => {
        if (newSession?.user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('id, email, full_name, school')
            .eq('id', newSession.user.id)
            .maybeSingle();
          if (mounted) setProfile(prof as UserProfile | null);
        } else {
          if (mounted) setProfile(null);
        }
      })();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (sess.session?.user) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, email, full_name, school')
        .eq('id', sess.session.user.id)
        .maybeSingle();
      setProfile(prof as UserProfile | null);
    } else {
      setProfile(null);
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setUser(null);
  }, []);

  const isEmailConfirmed = Boolean(user?.email_confirmed_at || user?.confirmed_at);

  return {
    user,
    session,
    profile,
    loading,
    isEmailConfirmed,
    signOut,
    refreshProfile,
  };
}
