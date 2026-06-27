import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Profile } from "../types";
import { useToast } from "./Toast";
import { Users, Search, Linkedin, Github, Globe, Mail, Calendar, RefreshCw, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CodeSapiensMascot } from "./CodeSapiensLogo";

interface ConnectionsProps {
  currentUserId: string;
}

export default function Connections({ currentUserId }: ConnectionsProps) {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cohortFilter, setCohortFilter] = useState<string>("all");
  const { showToast } = useToast();

  useEffect(() => {
    fetchConnections();

    // Set up real-time subscription for connections and profiles updates
    const channel = supabase
      .channel("connections-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connections" },
        () => {
          fetchConnections(false); // Silent reload to keep updates instant
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          fetchConnections(false); // Silent reload to capture any profile edit details live
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel?.(channel);
        channel.unsubscribe?.();
      }
    };
  }, [currentUserId]);

  const fetchConnections = async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      const { data, error } = await supabase
        .from("connections")
        .select("*, profiles!connections_connected_user_id_fkey(*)")
        .eq("user_id", currentUserId);

      if (error) {
        showToast("Error retrieving connections: " + error.message, "error");
      } else if (data) {
        // Resolve nested profiles
        const mappedData = data.map((item: any) => {
          const profileKey = Object.keys(item).find((k) => k.startsWith("profiles"));
          const profileObj = profileKey ? item[profileKey] : null;
          return { ...item, profiles: profileObj };
        });
        
        // Sort newest connections first
        const sortedData = mappedData.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setConnections(sortedData);
      }
    } catch (err: any) {
      console.error("Failed to fetch connections", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const filteredConnections = connections.filter((conn) => {
    const profile = conn.profiles as Profile;
    if (!profile) return false;

    if (cohortFilter !== "all" && profile.cohort_year !== Number(cohortFilter)) {
      return false;
    }

    if (!searchQuery.trim()) return true;
    const search = searchQuery.toLowerCase();
    const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.toLowerCase();
    const company = (profile.company || "").toLowerCase();
    const role = (profile.current_role || "").toLowerCase();
    const bio = (profile.bio || "").toLowerCase();
    
    return (
      fullName.includes(search) ||
      company.includes(search) ||
      role.includes(search) ||
      bio.includes(search)
    );
  });

  return (
    <div className="max-w-5xl mx-auto py-2 px-4 sm:px-6">
      
      {/* Page Title & Stats Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-black text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-brand-neon" />
            My Connections
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Browse and connect with other alumni you have met and scanned.
          </p>
        </div>
        
        <div className="flex items-center gap-2.5 self-start sm:self-center bg-brand-neon/10 border border-brand-neon/30 rounded-2xl px-4 py-2 text-brand-neon shadow-lg shadow-brand-neon/5">
          <Users className="w-4 h-4" />
          <span className="text-xs font-display font-black tracking-wide uppercase">
            {connections.length} Connected
          </span>
        </div>
      </div>

      {/* Realtime / Search Filter Panel */}
      <div className="glow-card rounded-3xl p-4 sm:p-5 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center border border-white/5">
        
        {/* Search Bar */}
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <Search className="w-4 h-4 text-brand-neon" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, role, bio, or company..."
            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/20 transition-all text-sm font-medium"
          />
        </div>

        {/* Filters and Reload button */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={cohortFilter}
            onChange={(e) => setCohortFilter(e.target.value)}
            className="w-full md:w-44 px-4 py-2.5 bg-black/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-brand-neon focus:bg-brand-dark transition-all text-sm font-medium appearance-none cursor-pointer"
          >
            <option value="all">All Pass Out Years</option>
            {[2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
              <option key={year} value={year}>
                {year} Pass Out
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchConnections(true)}
            className="p-2.5 rounded-xl border border-white/10 bg-black/40 hover:bg-white/5 hover:border-brand-neon/30 transition-all text-slate-400 hover:text-white cursor-pointer"
            title="Refresh connections"
          >
            <RefreshCw className="w-4.5 h-4.5 text-brand-neon" />
          </button>
        </div>
      </div>

      {/* Render connections list */}
      {loading ? (
        <div className="glow-card rounded-3xl border border-white/5 py-24 flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-brand-neon border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <CodeSapiensMascot className="w-6 h-6" />
            </div>
          </div>
          <p className="text-slate-400 text-sm font-medium animate-pulse">
            Retrieving your network contacts...
          </p>
        </div>
      ) : filteredConnections.length === 0 ? (
        <div className="glow-card rounded-3xl border border-white/5 py-20 px-6 text-center">
          <Users className="w-14 h-14 text-slate-600 mx-auto mb-4" />
          <h4 className="text-lg font-display font-bold text-slate-300">No connections match</h4>
          <p className="text-slate-500 text-xs mt-1.5 max-w-md mx-auto">
            {connections.length === 0
              ? "Your scanned network is empty! Head over to the Bingo Board, meet other alumni, and scan their personal QR codes to save them here."
              : "No matches found. Try widening your search query or pass-out year filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredConnections.map((conn) => {
              const profile = conn.profiles as Profile;
              if (!profile) return null;
              
              const formattedDate = new Date(conn.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <motion.div
                  key={conn.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="glow-card rounded-3xl border border-white/5 p-5 sm:p-6 bg-brand-dark/30 hover:bg-white/5 hover:border-brand-neon/30 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Header Row: Profile Avatar initials & name / cohort info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-brand-green/20 text-brand-neon border border-brand-neon/30 flex items-center justify-center font-display font-black text-lg shrink-0 select-none shadow-md">
                          {profile.avatar_initials || "CS"}
                        </div>
                        <div>
                          <h4 className="text-base font-display font-black text-white group-hover:text-brand-neon transition-colors leading-tight">
                            {profile.first_name} {profile.last_name}
                          </h4>
                          <span className="inline-flex mt-1 text-[10px] bg-white/5 text-slate-400 font-mono px-2 py-0.5 rounded-md border border-white/5">
                            {profile.cohort_year} Pass Out
                          </span>
                        </div>
                      </div>
                      
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                        <Calendar className="w-3.5 h-3.5 text-brand-neon" />
                        {formattedDate}
                      </span>
                    </div>

                    {/* Role / Professional headline */}
                    <div className="mt-4 text-xs text-slate-300 pl-1 border-l-2 border-brand-neon/20 py-0.5">
                      {profile.current_role ? (
                        <div>
                          <p className="font-semibold text-white text-sm leading-snug">
                            {profile.current_role}
                          </p>
                          {profile.company && (
                            <p className="text-slate-400 text-xs mt-0.5">{profile.company}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-slate-500 italic">Mingle-ready alum</p>
                      )}
                    </div>

                    {/* Personal Bio */}
                    <div className="mt-4 bg-black/35 rounded-2xl p-3 border border-white/5 text-xs text-slate-300 leading-relaxed relative">
                      {profile.bio ? (
                        <p className="italic">"{profile.bio}"</p>
                      ) : (
                        <p className="text-slate-500 italic">No bio provided yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Social links / Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-white/5">
                    
                    {/* Email connection */}
                    <div className="flex items-center text-xs text-slate-400">
                      {profile.email ? (
                        <a
                          href={`mailto:${profile.email}`}
                          className="hover:text-brand-neon flex items-center gap-2 transition-colors text-slate-400 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5"
                          title={profile.email}
                        >
                          <Mail className="w-4 h-4 text-brand-neon" />
                          <span className="text-[10px] max-w-[140px] truncate">{profile.email}</span>
                        </a>
                      ) : (
                        <span className="text-slate-600">No email provided</span>
                      )}
                    </div>

                    {/* Direct Social Links */}
                    <div className="flex items-center gap-2">
                      {profile.linkedin_handle && (
                        <a
                          href={`https://linkedin.com/in/${profile.linkedin_handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-neon px-3 py-2 transition-all bg-white/5 hover:bg-brand-neon/10 border border-white/5 hover:border-brand-neon/30 rounded-xl flex items-center gap-1.5 text-xs font-bold font-display"
                        >
                          <Linkedin className="w-4 h-4 text-brand-neon shrink-0" />
                          <span className="hidden sm:inline">LinkedIn</span>
                        </a>
                      )}
                      {profile.github_handle && (
                        <a
                          href={`https://github.com/${profile.github_handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-neon px-3 py-2 transition-all bg-white/5 hover:bg-brand-neon/10 border border-white/5 hover:border-brand-neon/30 rounded-xl flex items-center gap-1.5 text-xs font-bold font-display"
                        >
                          <Github className="w-4 h-4 text-brand-neon shrink-0" />
                          <span className="hidden sm:inline">GitHub</span>
                        </a>
                      )}
                      {profile.website_url && (
                        <a
                          href={profile.website_url.startsWith("http") ? profile.website_url : `https://${profile.website_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-300 p-2 transition-colors bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl flex items-center justify-center"
                          title={`Website: ${profile.website_url}`}
                        >
                          <Globe className="w-4 h-4 text-brand-neon shrink-0" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
