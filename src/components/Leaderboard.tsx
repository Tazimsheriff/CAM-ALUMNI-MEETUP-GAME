import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Score, Profile } from "../types";
import { useToast } from "./Toast";
import { Trophy, Medal, Search, Users, Linkedin, Github, RefreshCw, Mail, Globe, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CodeSapiensMascot } from "./CodeSapiensLogo";

interface LeaderboardProps {
  currentUserId: string;
}

export default function Leaderboard({ currentUserId }: LeaderboardProps) {
  const [scores, setScores] = useState<Score[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"ranks" | "connections">("ranks");
  const [loading, setLoading] = useState(true);
  const [cohortFilter, setCohortFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    fetchScores();
    fetchConnections();

    // Subscribe to live scores, profiles, and connections changes
    const channel = supabase
      .channel("leaderboard-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scores" },
        () => {
          fetchScores(false); // Silent reload to keep it live and smooth
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          fetchScores(false); // Silent reload to keep it live and smooth
          fetchConnections();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connections" },
        () => {
          fetchConnections();
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel?.(channel);
        channel.unsubscribe?.();
      }
    };
  }, [cohortFilter]);

  const fetchScores = async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      // Build query
      let query = supabase.from("scores").select("*, profiles(*)");

      if (cohortFilter !== "all") {
        query = query.eq("profiles.cohort_year", Number(cohortFilter));
      }

      const { data, error } = await query;

      if (error) {
        showToast("Error loading leaderboard: " + error.message, "error");
      } else if (data) {
        // Double check data sorting client-side as backup and filter out profiles that are incomplete
        const sortedData = (data as Score[])
          .filter((score) => score.profiles && score.profiles.first_name)
          .sort((a, b) => b.points - a.points || b.bingos - a.bingos);
        
        setScores(sortedData);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from("connections")
        .select("*, profiles!connections_connected_user_id_fkey(*)")
        .eq("user_id", currentUserId);

      if (error) {
        console.error("Error fetching connections:", error);
      } else if (data) {
        const mappedData = data.map((item: any) => {
          const profileKey = Object.keys(item).find((k) => k.startsWith("profiles"));
          const profileObj = profileKey ? item[profileKey] : null;
          return { ...item, profiles: profileObj };
        });
        setConnections(mappedData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredScores = scores.filter((score) => {
    if (!searchQuery.trim()) return true;
    const search = searchQuery.toLowerCase();
    const fullName = `${score.profiles?.first_name} ${score.profiles?.last_name}`.toLowerCase();
    const company = (score.profiles?.company || "").toLowerCase();
    const role = (score.profiles?.current_role || "").toLowerCase();
    return fullName.includes(search) || company.includes(search) || role.includes(search);
  });

  const filteredConnections = connections.filter((conn) => {
    const profile = conn.profiles;
    if (!profile) return false;
    
    if (cohortFilter !== "all" && profile.cohort_year !== Number(cohortFilter)) {
      return false;
    }
    
    if (!searchQuery.trim()) return true;
    const search = searchQuery.toLowerCase();
    const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.toLowerCase();
    const company = (profile.company || "").toLowerCase();
    const role = (profile.current_role || "").toLowerCase();
    return fullName.includes(search) || company.includes(search) || role.includes(search);
  });

  const getRankBadge = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-300" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="font-display font-bold text-xs text-slate-400">{index + 1}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto py-2 px-4 sm:px-6">
      {/* Tab Selector: Leaderboard vs Connections */}
      <div className="flex bg-black/40 border border-white/10 p-1.5 rounded-2xl mb-6 max-w-md mx-auto shadow-inner">
        <button
          onClick={() => setActiveTab("ranks")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "ranks"
              ? "bg-brand-neon text-black shadow-lg shadow-brand-neon/10 font-black"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Trophy className="w-4 h-4 shrink-0" />
          Ranks
        </button>
        <button
          onClick={() => setActiveTab("connections")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "connections"
              ? "bg-brand-neon text-black shadow-lg shadow-brand-neon/10 font-black"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          Connections ({connections.length})
        </button>
      </div>

      {/* Search and Filters Section */}
      <div className="glow-card rounded-3xl shadow-xl p-4 sm:p-5 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center border border-white/5">
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <Search className="w-4 h-4 text-brand-neon" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "ranks"
                ? "Search alumni, companies, colleges, or roles..."
                : "Search your connections..."
            }
            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/20 transition-all text-sm font-medium"
          />
        </div>

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
            onClick={() => {
              fetchScores(true);
              fetchConnections();
            }}
            className="p-2.5 rounded-xl border border-white/10 bg-black/40 hover:bg-white/5 hover:border-brand-neon/30 transition-all text-slate-400 hover:text-white cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4.5 h-4.5 text-brand-neon" />
          </button>
        </div>
      </div>

      {/* Leaderboard Table Grid / Connections Grid */}
      <div className="glow-card rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-brand-dark to-brand-deep px-6 py-4.5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2.5">
            {activeTab === "ranks" ? (
              <Trophy className="w-5 h-5 text-brand-neon" />
            ) : (
              <Users className="w-5 h-5 text-brand-neon" />
            )}
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white">
              {activeTab === "ranks" ? "Meetup Leaderboard" : "My Scanned Connections"}
            </h3>
          </div>
          <span className="text-[10px] font-display font-bold uppercase bg-brand-neon/20 text-brand-neon border border-brand-neon/40 px-3 py-1 rounded-full animate-pulse">
            Realtime Live
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-brand-neon border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CodeSapiensMascot className="w-6 h-6" />
              </div>
            </div>
            <p className="text-slate-400 text-sm font-medium">
              {activeTab === "ranks" ? "Retrieving active rankings..." : "Retrieving connections..."}
            </p>
          </div>
        ) : activeTab === "connections" ? (
          filteredConnections.length === 0 ? (
            <div className="text-center py-20 px-4">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-display font-bold text-slate-300">No Connections Found</h4>
              <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                {connections.length === 0
                  ? "Scan other alumni's personal QR codes on the Bingo Board tab to log them here and unlock social links!"
                  : "No connections match your current filters."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 sm:p-6 bg-black/10">
              {filteredConnections.map((conn) => {
                const profile = conn.profiles as Profile;
                if (!profile) return null;
                const formattedDate = new Date(conn.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });

                return (
                  <motion.div
                    key={conn.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-brand-dark/40 border border-white/5 rounded-2xl p-4.5 flex flex-col justify-between hover:border-brand-neon/20 hover:bg-white/5 transition-all group"
                  >
                    <div>
                      {/* Top Header: Avatar, Name & Cohort */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-brand-green/20 text-brand-neon border border-brand-neon/30 flex items-center justify-center font-display font-bold text-base shrink-0">
                            {profile.avatar_initials || "CS"}
                          </div>
                          <div>
                            <h4 className="text-sm font-display font-bold text-white leading-tight">
                              {profile.first_name} {profile.last_name}
                            </h4>
                            <span className="inline-block mt-1 text-[10px] bg-white/5 text-slate-400 font-mono px-2 py-0.5 rounded-md border border-white/5">
                              {profile.cohort_year} Pass Out
                            </span>
                          </div>
                        </div>
                        
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 shrink-0 bg-black/30 px-2 py-1 rounded-lg">
                          <Calendar className="w-3 h-3 text-brand-neon" />
                          {formattedDate}
                        </span>
                      </div>

                      {/* Professional details */}
                      <div className="mt-4 text-xs text-slate-300 pl-1 border-l border-brand-neon/20 py-0.5">
                        {profile.current_role ? (
                          <div>
                            <p className="font-semibold text-white leading-snug">{profile.current_role}</p>
                            {profile.company && (
                              <p className="text-slate-400 text-[11px] mt-0.5">{profile.company}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-slate-500 italic">Mingle-ready alum</p>
                        )}
                      </div>
                    </div>

                    {/* Social links */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-3.5 border-t border-white/5">
                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        {profile.email && (
                          <a
                            href={`mailto:${profile.email}`}
                            className="hover:text-white flex items-center gap-1 transition-colors text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5"
                            title={profile.email}
                          >
                            <Mail className="w-3.5 h-3.5 text-brand-neon" />
                            <span className="text-[10px] max-w-[120px] truncate">{profile.email}</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {profile.linkedin_handle && (
                          <a
                            href={`https://linkedin.com/in/${profile.linkedin_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-neon p-1.5 transition-colors bg-white/5 hover:bg-brand-neon/10 border border-white/5 hover:border-brand-neon/30 rounded-xl flex items-center gap-1.5 text-[11px] font-bold font-display"
                          >
                            <Linkedin className="w-4 h-4 text-brand-neon shrink-0" />
                            LinkedIn
                          </a>
                        )}
                        {profile.github_handle && (
                          <a
                            href={`https://github.com/${profile.github_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-neon p-1.5 transition-colors bg-white/5 hover:bg-brand-neon/10 border border-white/5 hover:border-brand-neon/30 rounded-xl flex items-center gap-1.5 text-[11px] font-bold font-display"
                          >
                            <Github className="w-4 h-4 text-brand-neon shrink-0" />
                            GitHub
                          </a>
                        )}
                        {profile.website_url && (
                          <a
                            href={profile.website_url.startsWith("http") ? profile.website_url : `https://${profile.website_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-300 p-1.5 transition-colors bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl flex items-center gap-1.5 text-[11px] font-bold font-display"
                            title="Website"
                          >
                            <Globe className="w-4 h-4 text-brand-neon shrink-0" />
                            Web
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : filteredScores.length === 0 ? (
          <div className="text-center py-20 px-4">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-display font-bold text-slate-300">No Alumni Placed Yet</h4>
            <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
              {cohortFilter !== "all"
                ? `Be the first ${cohortFilter} Pass Out alum to mark a square and claim a spot on the leaderboard!`
                : "No attendee has marked any square yet. Be the first to start the board and get on top!"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-black/20 border-b border-white/5 text-slate-400 text-[10px] uppercase font-display font-bold tracking-wider">
                    <th className="py-4 px-6 text-center w-16">Rank</th>
                    <th className="py-4 px-4">Attendee</th>
                    <th className="py-4 px-4 text-center w-28">Pass Out Year</th>
                    <th className="py-4 px-4">Role / Company / College</th>
                    <th className="py-4 px-4 text-center w-28">Checked</th>
                    <th className="py-4 px-4 text-center w-24">Bingos</th>
                    <th className="py-4 px-6 text-right w-28">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {filteredScores.map((score, index) => {
                      const isSelf = score.user_id === currentUserId;
                      const profile = score.profiles!;

                      return (
                        <motion.tr
                          key={score.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`transition-colors group hover:bg-white/5 ${
                            isSelf ? "bg-brand-green/20 font-semibold border-l-4 border-brand-neon" : ""
                          }`}
                        >
                          {/* Rank Badge */}
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center">
                              {getRankBadge(index)}
                            </div>
                          </td>

                          {/* Attendee Info Card */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-brand-green/20 text-brand-neon border border-brand-neon/30 flex items-center justify-center font-display font-bold text-sm shrink-0">
                                {profile.avatar_initials || "CS"}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-display font-bold text-white">
                                    {profile.first_name} {profile.last_name}
                                  </span>
                                  {isSelf && (
                                    <span className="text-[9px] bg-brand-neon text-black px-2 py-0.5 rounded-md font-display font-black uppercase tracking-wider">
                                      Me
                                    </span>
                                  )}
                                </div>
                                {/* Social Handles */}
                                <div className="flex items-center gap-2.5 mt-1 text-slate-400">
                                  {profile.linkedin_handle && (
                                    <a
                                      href={`https://linkedin.com/in/${profile.linkedin_handle}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:text-brand-neon transition-colors"
                                    >
                                      <Linkedin className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  {profile.github_handle && (
                                    <a
                                      href={`https://github.com/${profile.github_handle}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:text-brand-neon transition-colors"
                                    >
                                      <Github className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Pass Out badge */}
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-display font-bold bg-white/5 text-slate-300 group-hover:bg-brand-neon/10 group-hover:text-brand-neon transition-all border border-transparent group-hover:border-brand-neon/20">
                              {profile.cohort_year} Pass Out
                            </span>
                          </td>

                          {/* Role & Company */}
                          <td className="py-4 px-4 text-slate-300 text-xs">
                            {profile.current_role ? (
                              <div>
                                <p className="font-semibold text-white">{profile.current_role}</p>
                                {profile.company && <p className="text-slate-400 mt-0.5">{profile.company}</p>}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">Mingle-ready alum</span>
                            )}
                          </td>

                          {/* Squares Checked */}
                          <td className="py-4 px-4 text-center font-bold text-slate-300 text-sm">
                            {score.squares_checked}
                          </td>

                          {/* Bingos Count */}
                          <td className="py-4 px-4 text-center font-bold text-amber-400 text-sm">
                            {score.bingos > 0 ? (
                              <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-300 px-2.5 py-0.5 rounded-lg border border-amber-400/20">
                                {score.bingos}
                              </span>
                            ) : (
                              "0"
                            )}
                          </td>

                          {/* Points */}
                          <td className="py-4 px-6 text-right font-display font-black text-brand-neon text-base">
                            {score.points} <span className="text-[10px] font-bold text-slate-400">pts</span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card List View */}
            <div className="block md:hidden divide-y divide-white/5">
              <AnimatePresence>
                {filteredScores.map((score, index) => {
                  const isSelf = score.user_id === currentUserId;
                  const profile = score.profiles!;

                  return (
                    <motion.div
                      key={score.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`p-5 transition-colors flex flex-col gap-3.5 relative ${
                        isSelf ? "bg-brand-green/20 border-l-4 border-brand-neon" : "hover:bg-white/5"
                      }`}
                    >
                      {/* Top Row: Rank Badge, Profile Avatar, Name Details & Points */}
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3">
                          {/* Rank Icon */}
                          <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-black/30 rounded-lg">
                            {getRankBadge(index)}
                          </div>

                          {/* Profile Avatar */}
                          <div className="w-10 h-10 rounded-xl bg-brand-green/20 text-brand-neon border border-brand-neon/30 flex items-center justify-center font-display font-bold text-sm shrink-0">
                            {profile.avatar_initials || "CS"}
                          </div>

                          {/* Name and Cohort info */}
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-display font-bold text-white leading-none">
                                {profile.first_name} {profile.last_name}
                              </span>
                              {isSelf && (
                                <span className="text-[8px] bg-brand-neon text-black px-1.5 py-0.5 rounded-md font-display font-black uppercase tracking-wider leading-none">
                                  Me
                                </span>
                              )}
                            </div>
                            <span className="inline-block mt-1 text-[10px] bg-white/5 text-slate-400 font-mono px-2 py-0.5 rounded-md border border-white/5">
                              {profile.cohort_year} Pass Out
                            </span>
                          </div>
                        </div>

                        {/* Point totals */}
                        <div className="text-right shrink-0 bg-black/40 px-3.5 py-1.5 rounded-xl border border-white/5">
                          <p className="font-display font-black text-brand-neon text-base leading-none">
                            {score.points}
                          </p>
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5 block">
                            pts
                          </span>
                        </div>
                      </div>

                      {/* Middle Row: Professional Summary / Title */}
                      <div className="text-slate-300 text-xs px-1">
                        {profile.current_role ? (
                          <div>
                            <p className="font-semibold text-white leading-snug">{profile.current_role}</p>
                            {profile.company && (
                              <p className="text-slate-400 text-[11px] mt-0.5">{profile.company}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-slate-500 italic">Mingle-ready alum</p>
                        )}
                      </div>

                      {/* Bottom Footer Row: Interactive Stats & Connect Buttons */}
                      <div className="flex items-center justify-between gap-4 pt-3.5 border-t border-white/5">
                        {/* Stats Tags */}
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] bg-white/5 border border-white/10 text-slate-300 px-2.5 py-1 rounded-lg">
                            <span className="font-bold text-white">{score.squares_checked}</span> squares
                          </span>
                          {score.bingos > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 border border-amber-400/20 text-amber-300 px-2.5 py-1 rounded-lg">
                              <Trophy className="w-3 h-3 text-amber-400" />
                              <span className="font-bold">{score.bingos}</span> {score.bingos === 1 ? "line" : "lines"}
                            </span>
                          )}
                        </div>

                        {/* Social Icons */}
                        <div className="flex items-center gap-3 text-slate-400">
                          {profile.linkedin_handle && (
                            <a
                              href={`https://linkedin.com/in/${profile.linkedin_handle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-brand-neon p-1 transition-colors bg-white/5 hover:bg-brand-neon/10 border border-white/5 hover:border-brand-neon/30 rounded-lg"
                            >
                              <Linkedin className="w-4 h-4 text-brand-neon" />
                            </a>
                          )}
                          {profile.github_handle && (
                            <a
                              href={`https://github.com/${profile.github_handle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-brand-neon p-1 transition-colors bg-white/5 hover:bg-brand-neon/10 border border-white/5 hover:border-brand-neon/30 rounded-lg"
                            >
                              <Github className="w-4 h-4 text-brand-neon" />
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
