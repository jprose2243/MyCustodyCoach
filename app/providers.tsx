'use client';

import { supabase } from '@/lib/supabase-browser';
import { SessionContextProvider } from '@supabase/auth-helpers-react';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionContextProvider supabaseClient={supabase as any}>
      {children}
    </SessionContextProvider>
  );
}