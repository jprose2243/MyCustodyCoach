'use client';

import { supabase } from '@/src/lib/supabase-browser';
import { SessionContextProvider } from '@supabase/auth-helpers-react';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionContextProvider supabaseClient={supabase as unknown as Parameters<typeof SessionContextProvider>[0]['supabaseClient']}>
      {children}
    </SessionContextProvider>
  );
}