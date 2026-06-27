import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Check if we have valid real Supabase credentials (not placeholder values)
const hasRealCredentials =
  supabaseUrl &&
  supabaseUrl !== "" &&
  supabaseUrl !== "MY_SUPABASE_URL" &&
  supabaseUrl !== "YOUR_SUPABASE_URL" &&
  supabaseAnonKey &&
  supabaseAnonKey !== "" &&
  supabaseAnonKey !== "MY_SUPABASE_ANON_KEY" &&
  supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY";

export const isMockClient = !hasRealCredentials;

// --- Mock Supabase Client Implementation ---
class MockSupabaseClient {
  private listeners: Array<(event: string, session: any) => void> = [];
  private realtimeCallbacks: { [channel: string]: Array<(payload: any) => void> } = {};

  constructor() {
    // Initialize default collections in localStorage
    if (!localStorage.getItem("cs_bingo_users")) {
      localStorage.setItem("cs_bingo_users", JSON.stringify([]));
    }
    if (!localStorage.getItem("cs_bingo_profiles")) {
      localStorage.setItem("cs_bingo_profiles", JSON.stringify([]));
    }
    if (!localStorage.getItem("cs_bingo_boards")) {
      localStorage.setItem("cs_bingo_boards", JSON.stringify([]));
    }
    if (!localStorage.getItem("cs_bingo_scores")) {
      localStorage.setItem("cs_bingo_scores", JSON.stringify([]));
    }
  }

  // Auth helper methods
  private getStorageItem(key: string): any[] {
    return JSON.parse(localStorage.getItem(key) || "[]");
  }

  private setStorageItem(key: string, data: any[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private getSessionUser(): any | null {
    const sessionStr = localStorage.getItem("cs_bingo_session");
    if (!sessionStr) return null;
    try {
      return JSON.parse(sessionStr);
    } catch {
      return null;
    }
  }

  private triggerAuthChange(event: string, session: any) {
    this.listeners.forEach((listener) => listener(event, session));
  }

  private triggerRealtimeUpdate(table: string) {
    // Notify all active channels that have registered callbacks
    Object.keys(this.realtimeCallbacks).forEach((channelName) => {
      const callbacks = this.realtimeCallbacks[channelName] || [];
      callbacks.forEach((cb) => {
        try {
          cb({ event: "UPDATE", schema: "public", table });
        } catch (e) {
          console.error("Error executing mock realtime callback:", e);
        }
      });
    });
  }

  public auth = {
    signUp: async ({ email, password }: any) => {
      const users = this.getStorageItem("cs_bingo_users");
      const exists = users.find((u) => u.email === email);
      if (exists) {
        return { data: { user: null }, error: { message: "User already exists." } };
      }

      const id = Math.random().toString(36).substring(2, 15);
      const newUser = { id, email, password };
      users.push(newUser);
      this.setStorageItem("cs_bingo_users", users);

      // Create an automatic initial profile stub
      const profiles = this.getStorageItem("cs_bingo_profiles");
      const newProfile = {
        id,
        email,
        first_name: "",
        last_name: "",
        cohort_year: 2025,
        current_role: "",
        company: "",
        linkedin_handle: "",
        github_handle: "",
        website_url: "",
        avatar_initials: email.substring(0, 2).toUpperCase(),
        created_at: new Date().toISOString(),
      };
      profiles.push(newProfile);
      this.setStorageItem("cs_bingo_profiles", profiles);

      const session = { user: { id, email } };
      localStorage.setItem("cs_bingo_session", JSON.stringify(session.user));
      this.triggerAuthChange("SIGNED_IN", session);

      return { data: { user: session.user, session }, error: null };
    },

    signInWithPassword: async ({ email, password }: any) => {
      const users = this.getStorageItem("cs_bingo_users");
      const user = users.find((u) => u.email === email && u.password === password);
      if (!user) {
        return { data: { session: null }, error: { message: "Invalid email or password." } };
      }

      const session = { user: { id: user.id, email: user.email } };
      localStorage.setItem("cs_bingo_session", JSON.stringify(session.user));
      this.triggerAuthChange("SIGNED_IN", session);

      return { data: { session, user: session.user }, error: null };
    },

    signInWithOtp: async ({ email }: any) => {
      // Magic Link fallback: sign in immediately, or sign up if new
      const users = this.getStorageItem("cs_bingo_users");
      let user = users.find((u) => u.email === email);
      if (!user) {
        const id = Math.random().toString(36).substring(2, 15);
        user = { id, email, password: "magiclink_password" };
        users.push(user);
        this.setStorageItem("cs_bingo_users", users);

        const profiles = this.getStorageItem("cs_bingo_profiles");
        const newProfile = {
          id,
          email,
          first_name: "",
          last_name: "",
          cohort_year: 2025,
          current_role: "",
          company: "",
          linkedin_handle: "",
          github_handle: "",
          website_url: "",
          avatar_initials: email.substring(0, 2).toUpperCase(),
          created_at: new Date().toISOString(),
        };
        profiles.push(newProfile);
        this.setStorageItem("cs_bingo_profiles", profiles);
      }

      const session = { user: { id: user.id, email: user.email } };
      localStorage.setItem("cs_bingo_session", JSON.stringify(session.user));
      this.triggerAuthChange("SIGNED_IN", session);

      return { data: { message: "Magic link sent successfully!" }, error: null };
    },

    signOut: async () => {
      localStorage.removeItem("cs_bingo_session");
      this.triggerAuthChange("SIGNED_OUT", null);
      return { error: null };
    },

    getSession: async () => {
      const user = this.getSessionUser();
      if (!user) return { data: { session: null }, error: null };
      return { data: { session: { user } }, error: null };
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      this.listeners.push(callback);
      const user = this.getSessionUser();
      const session = user ? { user } : null;
      // Trigger immediately
      setTimeout(() => {
        callback(user ? "SIGNED_IN" : "SIGNED_OUT", session);
      }, 0);

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              this.listeners = this.listeners.filter((l) => l !== callback);
            },
          },
        },
      };
    },
  };

  // Database operations builder
  public from(table: string) {
    const self = this;
    let dataList = this.getStorageItem(`cs_bingo_${table}`);

    let filtered = [...dataList];
    let orderCol: string | null = null;
    let orderAsc = true;

    const queryBuilder = {
      select: (fields?: string) => {
        // If joining profiles, we can attach profiles automatically
        if (fields && fields.includes("profiles")) {
          const profiles = self.getStorageItem("cs_bingo_profiles");
          filtered = filtered.map((item) => {
            const profile = profiles.find((p) => p.id === item.user_id);
            return { ...item, profiles: profile || null };
          });
        }
        return queryBuilder;
      },

      eq: (column: string, value: any) => {
        filtered = filtered.filter((item) => {
          if (column.includes(".")) {
            const [relation, col] = column.split(".");
            return item[relation]?.[col] === value;
          }
          return item[column] === value;
        });
        return queryBuilder;
      },

      order: (column: string, options?: { ascending?: boolean }) => {
        orderCol = column;
        orderAsc = options?.ascending !== false;
        return queryBuilder;
      },

      single: async () => {
        if (filtered.length === 0) {
          return { data: null, error: { message: "No row found", code: "PGRST116" } };
        }
        return { data: filtered[0], error: null };
      },

      then: async (resolve: any) => {
        // Execute ordering if needed
        if (orderCol) {
          filtered.sort((a, b) => {
            const valA = a[orderCol!];
            const valB = b[orderCol!];
            if (valA < valB) return orderAsc ? -1 : 1;
            if (valA > valB) return orderAsc ? 1 : -1;
            return 0;
          });
        }
        return resolve({ data: filtered, error: null });
      },

      upsert: async (records: any | any[]) => {
        const toUpsert = Array.isArray(records) ? records : [records];
        const currentData = self.getStorageItem(`cs_bingo_${table}`);

        toUpsert.forEach((rec) => {
          // If no id, auto-generate
          if (!rec.id) {
            rec.id = Math.random().toString(36).substring(2, 15);
          }
          // Check if record with match keys exists
          // Match keys: user_id for profiles, boards, scores
          let index = -1;
          if (table === "profiles") {
            index = currentData.findIndex((item) => item.id === rec.id);
          } else if (table === "boards" || table === "scores") {
            index = currentData.findIndex((item) => item.user_id === rec.user_id);
          }

          if (index !== -1) {
            currentData[index] = { ...currentData[index], ...rec, updated_at: new Date().toISOString() };
          } else {
            const now = new Date().toISOString();
            currentData.push({
              ...rec,
              created_at: now,
              updated_at: now,
            });
          }
        });

        self.setStorageItem(`cs_bingo_${table}`, currentData);
        self.triggerRealtimeUpdate(table);

        return { data: records, error: null };
      },

      insert: async (records: any | any[]) => {
        return queryBuilder.upsert(records);
      },
    };

    return queryBuilder;
  }

  // Realtime subscription mocks with chaining support
  public channel(name: string) {
    const self = this;
    const channelBuilder = {
      on: (event: string, filter: any, callback: (payload: any) => void) => {
        if (!self.realtimeCallbacks[name]) {
          self.realtimeCallbacks[name] = [];
        }
        self.realtimeCallbacks[name].push(callback);
        return channelBuilder; // chainable
      },
      subscribe: () => {
        return {
          unsubscribe: () => {
            // Keep unsubscribe clean or remove callbacks for this channel
            self.realtimeCallbacks[name] = [];
          },
        };
      },
    };
    return channelBuilder;
  }
}

// --- Initialize Client Instance ---
export const supabase = !isMockClient
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (new MockSupabaseClient() as any);
