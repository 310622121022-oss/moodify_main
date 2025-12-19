import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseClient: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Exporting a noop client.');

  const makeBuilder = () => {
    const builder: any = {
      select() { return builder; },
      order() { return builder; },
      eq() { return builder; },
      gte() { return builder; },
      lt() { return builder; },
      limit() { return builder; },
      insert() { return builder; },
      update() { return builder; },
      delete() { return builder; },
      then(resolve: any) {
        const res = { data: null, error: null };
        resolve(res);
        return Promise.resolve(res);
      },
      catch() { return Promise.resolve({ data: null, error: null }); },
    };
    return builder;
  };

  supabaseClient = {
    from() { return makeBuilder(); },
    rpc() { return makeBuilder(); },
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      // Provide a compatible onAuthStateChange that returns a subscription
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        const subscription = {
          unsubscribe: () => {},
        };
        // no-op: don't call callback because there's no session
        return { data: { subscription } };
      },
      // minimal sign in/out shapes matching supabase-js v2
      signInWithPassword: async (_: any) => ({ data: null, error: null }),
      signUp: async (_: any) => ({ data: null, error: null }),
      signOut: async () => ({ data: null, error: null }),
    },
  };
} else {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient;
