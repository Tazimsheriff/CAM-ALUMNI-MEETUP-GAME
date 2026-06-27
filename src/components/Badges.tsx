import React, { useState, useEffect } from "react";
import { Score, Board, Profile } from "../types";
import { ALL_BADGES } from "../data/squares";
import { checkBingos } from "./BingoBoard";
import { supabase } from "../supabase";
import {
  Sparkles,
  Trophy,
  Zap,
  Users,
  Award,
  Lock,
  CheckCircle2,
  MessageCircle,
  GitBranch,
  Anchor,
  Github,
  Layers,
  Rocket,
  Globe,
  UserCheck,
  Share2,
  Target,
  Sunrise,
  RotateCcw,
  CalendarCheck,
  Crown,
  Star,
  Ghost
} from "lucide-react";
import { motion } from "motion/react";

interface BadgesProps {
  score: Score | null;
  board: Board | null;
  profile?: Profile | null;
}

export default function Badges({ score, board, profile }: BadgesProps) {
  const [allScores, setAllScores] = useState<Score[]>([]);
  const [loadingScores, setLoadingScores] = useState(true);

  // Sync scores to evaluate leaderboard-related badges
  useEffect(() => {
    let active = true;
    const fetchScores = async () => {
      try {
        const { data, error } = await supabase.from("scores").select("*, profiles(*)");
        if (data && active) {
          const sorted = (data as Score[])
            .filter((s) => s.profiles && s.profiles.first_name)
            .sort((a, b) => b.points - a.points || b.bingos - a.bingos);
          setAllScores(sorted);
        }
      } catch (err) {
        console.error("Error fetching scores for badges:", err);
      } finally {
        if (active) setLoadingScores(false);
      }
    };
    fetchScores();
    return () => {
      active = false;
    };
  }, []);

  const checkedCount = board?.checked_indices.filter((idx) => idx !== 12).length || 0;
  const currentPoints = checkedCount * 10;
  const currentBingos = board ? checkBingos(board.checked_indices) : 0;
  const isBlackout = board?.checked_indices.length === 25;
  const passOutYear = profile?.cohort_year || score?.profiles?.cohort_year || 2026;

  const myId = profile?.id || "";
  const myCohort = passOutYear;

  // 1. Calculate Leaderboard Rank
  const myRank = allScores.findIndex((s) => s.user_id === myId) + 1;

  // 2. Cross-Cohort check
  const beatenProfiles = allScores
    .filter((s) => s.user_id !== myId && s.points < currentPoints && s.profiles)
    .map((s) => s.profiles!);
  const beatenCohorts = new Set(beatenProfiles.map((p) => p.cohort_year).filter((yr) => yr !== myCohort));
  const crossCohortCount = beatenCohorts.size;
  const isCrossCohort = crossCohortCount >= 3;

  // 3. Early Bird check
  const submittedScores = [...allScores]
    .filter((s) => s.submitted_at)
    .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());
  const mySubmittedIndex = submittedScores.findIndex((s) => s.user_id === myId);
  const isEarlyBird = mySubmittedIndex !== -1 && mySubmittedIndex < 10;

  // 4. CodeSapiens OG check
  const allCohortYears = allScores.map((s) => s.profiles?.cohort_year).filter(Boolean) as number[];
  const minCohort = allCohortYears.length > 0 ? Math.min(...allCohortYears) : 2019;
  const isOG = profile?.cohort_year !== undefined && profile.cohort_year <= minCohort;

  // 5. Perfect Attendance check (Admin flag or special user)
  const isPerfectAttendance =
    (profile as any)?.perfect_attendance === true ||
    profile?.email === "mubashirtazim2k@gmail.com" ||
    profile?.email?.includes("admin");

  // Helper to check if a specific square text is checked on the board
  const isSquareTextChecked = (textToFind: string) => {
    if (!board) return false;
    return board.checked_indices.some((gridIndex) => {
      if (gridIndex === 12) return false; // center/free
      const squaresIndex = gridIndex < 12 ? gridIndex : gridIndex - 1;
      const text = board.squares[squaresIndex];
      return text && text.toLowerCase().includes(textToFind.toLowerCase());
    });
  };

  const isUnlocked = (badgeId: string) => {
    switch (badgeId) {
      // --- Networking ---
      case "ice_breaker":
        return checkedCount >= 1;
      case "mingler":
        return checkedCount >= 5;
      case "social_butterfly":
        return checkedCount >= 10;
      case "cross_cohort":
        return isCrossCohort;
      case "deep_diver":
        return checkedCount >= 15;

      // --- Tech identity ---
      case "open_source_hero":
        return checkedCount >= 18;
      case "stack_overflow":
        return checkedCount >= 20;
      case "side_project_evangelist":
        return isSquareTextChecked("side project");
      case "portfolio_proud":
        return !!profile?.github_handle && !!profile?.website_url;

      // --- Career ---
      case "mentor_found":
        return checkedCount >= 12;
      case "referral_king":
        return isSquareTextChecked("referral");
      case "dream_company_scout":
        return isSquareTextChecked("dream company");

      // --- Event ---
      case "early_bird":
        return isEarlyBird;
      case "comeback_kid":
        return !!profile && checkedCount >= 2;
      case "perfect_attendance":
        return isPerfectAttendance;

      // --- Prestige / rare ---
      case "first_bingo":
        return currentBingos >= 1;
      case "triple_bingo":
        return currentBingos >= 3;
      case "alumni_connector":
        return currentPoints >= 200;
      case "full_blackout":
        return isBlackout;
      case "legend":
        return isBlackout && myRank > 0 && myRank <= 3;
      case "codesapiens_og":
        return isOG;
      case "hall_of_fame":
        return myRank === 1;
      case "ghost":
        return !!board && checkedCount === 0;

      default:
        return false;
    }
  };

  const getBadgeIcon = (iconName: string, unlocked: boolean) => {
    const size = "w-9 h-9";
    const color = unlocked ? "text-black" : "text-slate-500";

    switch (iconName) {
      case "Sparkles":
        return <Sparkles className={`${size} ${color}`} />;
      case "Trophy":
        return <Trophy className={`${size} ${color}`} />;
      case "Zap":
        return <Zap className={`${size} ${color}`} />;
      case "Users":
        return <Users className={`${size} ${color}`} />;
      case "Award":
        return <Award className={`${size} ${color}`} />;
      case "MessageCircle":
        return <MessageCircle className={`${size} ${color}`} />;
      case "GitBranch":
        return <GitBranch className={`${size} ${color}`} />;
      case "Anchor":
        return <Anchor className={`${size} ${color}`} />;
      case "Github":
        return <Github className={`${size} ${color}`} />;
      case "Layers":
        return <Layers className={`${size} ${color}`} />;
      case "Rocket":
        return <Rocket className={`${size} ${color}`} />;
      case "Globe":
        return <Globe className={`${size} ${color}`} />;
      case "UserCheck":
        return <UserCheck className={`${size} ${color}`} />;
      case "Share2":
        return <Share2 className={`${size} ${color}`} />;
      case "Target":
        return <Target className={`${size} ${color}`} />;
      case "Sunrise":
        return <Sunrise className={`${size} ${color}`} />;
      case "RotateCcw":
        return <RotateCcw className={`${size} ${color}`} />;
      case "CalendarCheck":
        return <CalendarCheck className={`${size} ${color}`} />;
      case "Crown":
        return <Crown className={`${size} ${color}`} />;
      case "Star":
        return <Star className={`${size} ${color}`} />;
      case "Ghost":
        return <Ghost className={`${size} ${color}`} />;
      default:
        return <Award className={`${size} ${color}`} />;
    }
  };

  const getBadgeColors = (badge: any, unlocked: boolean) => {
    if (!unlocked) return "bg-black/30 border-white/5 text-slate-500 opacity-60";

    switch (badge.category) {
      case "Networking":
        return "bg-gradient-to-br from-[#8CE825] to-emerald-500 border-brand-neon text-black shadow-[0_0_15px_rgba(140,232,37,0.3)]";
      case "Tech Identity":
        return "bg-gradient-to-br from-cyan-400 to-blue-500 border-cyan-300 text-black shadow-[0_0_15px_rgba(34,211,238,0.3)]";
      case "Career":
        return "bg-gradient-to-br from-amber-400 to-orange-500 border-amber-300 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]";
      case "Event":
        return "bg-gradient-to-br from-purple-400 to-pink-500 border-purple-300 text-black shadow-[0_0_15px_rgba(192,132,252,0.3)]";
      case "Prestige & Rare":
        if (badge.id === "full_blackout" || badge.id === "legend" || badge.id === "hall_of_fame") {
          return "bg-gradient-to-br from-brand-neon via-yellow-400 to-rose-500 border-brand-neon text-black shadow-[0_0_20px_rgba(140,232,37,0.6)] animate-pulse";
        }
        return "bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-300 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]";
      default:
        return "bg-[#1D9E75] border-emerald-400 text-black";
    }
  };

  const getBadgeProgress = (badgeId: string) => {
    switch (badgeId) {
      case "ice_breaker":
        return { value: checkedCount, total: 1, label: `${Math.min(1, checkedCount)} / 1 square` };
      case "mingler":
        return { value: checkedCount, total: 5, label: `${Math.min(5, checkedCount)} / 5 squares` };
      case "social_butterfly":
        return { value: checkedCount, total: 10, label: `${Math.min(10, checkedCount)} / 10 squares` };
      case "cross_cohort":
        return { value: crossCohortCount, total: 3, label: `${Math.min(3, crossCohortCount)} / 3 cohorts` };
      case "deep_diver":
        return { value: checkedCount, total: 15, label: `${Math.min(15, checkedCount)} / 15 squares` };
      case "open_source_hero":
        return { value: checkedCount, total: 18, label: `${Math.min(18, checkedCount)} / 18 squares` };
      case "stack_overflow":
        return { value: checkedCount, total: 20, label: `${Math.min(20, checkedCount)} / 20 squares` };
      case "side_project_evangelist":
        const hasProj = isSquareTextChecked("side project");
        return { value: hasProj ? 1 : 0, total: 1, label: hasProj ? "Done" : "0 / 1 square" };
      case "portfolio_proud":
        const scoreVal = (profile?.github_handle ? 0.5 : 0) + (profile?.website_url ? 0.5 : 0);
        const steps = [!!profile?.github_handle, !!profile?.website_url].filter(Boolean).length;
        return { value: scoreVal, total: 1, label: `${steps} / 2 linked` };
      case "mentor_found":
        return { value: checkedCount, total: 12, label: `${Math.min(12, checkedCount)} / 12 squares` };
      case "referral_king":
        const hasRef = isSquareTextChecked("referral");
        return { value: hasRef ? 1 : 0, total: 1, label: hasRef ? "Done" : "0 / 1 square" };
      case "dream_company_scout":
        const hasDream = isSquareTextChecked("dream company");
        return { value: hasDream ? 1 : 0, total: 1, label: hasDream ? "Done" : "0 / 1 square" };
      case "early_bird":
        return {
          value: isEarlyBird ? 1 : 0,
          total: 1,
          label: isEarlyBird ? "Unlocked" : mySubmittedIndex !== -1 ? `Rank ${mySubmittedIndex + 1}` : "No score yet",
        };
      case "comeback_kid":
        return { value: checkedCount >= 2 ? 1 : 0, total: 1, label: checkedCount >= 2 ? "Done" : "Meet 2 alumni" };
      case "perfect_attendance":
        return { value: isPerfectAttendance ? 1 : 0, total: 1, label: isPerfectAttendance ? "Awarded" : "Check Profile" };
      case "first_bingo":
        return { value: currentBingos, total: 1, label: `${Math.min(1, currentBingos)} / 1 Bingo` };
      case "triple_bingo":
        return { value: currentBingos, total: 3, label: `${Math.min(3, currentBingos)} / 3 Bingos` };
      case "alumni_connector":
        return { value: currentPoints, total: 200, label: `${Math.min(200, currentPoints)} / 200 pts` };
      case "full_blackout":
        return {
          value: board?.checked_indices.length || 0,
          total: 25,
          label: `${board?.checked_indices.length || 0} / 25 checked`,
        };
      case "legend":
        return {
          value: isBlackout && myRank > 0 && myRank <= 3 ? 1 : 0,
          total: 1,
          label: isBlackout && myRank <= 3 ? "Unlocked" : "Pending",
        };
      case "codesapiens_og":
        return { value: isOG ? 1 : 0, total: 1, label: isOG ? "OG Status" : "Pending" };
      case "hall_of_fame":
        return { value: myRank === 1 ? 1 : 0, total: 1, label: myRank === 1 ? "#1 Rank" : "Pending" };
      case "ghost":
        return { value: checkedCount === 0 ? 1 : 0, total: 1, label: checkedCount === 0 ? "Boo!" : "Failed" };
      default:
        return null;
    }
  };

  const unlockedCount = ALL_BADGES.filter((b) => isUnlocked(b.id)).length;
  const totalCount = ALL_BADGES.length;

  const categories = ["Networking", "Tech Identity", "Career", "Event", "Prestige & Rare"];

  return (
    <div className="max-w-4xl mx-auto py-2 px-4 sm:px-6">
      {/* Badge Progress Banner */}
      <div className="glow-card rounded-3xl p-6 mb-8 border border-white/5 shadow-2xl relative overflow-hidden">
        {/* Decorative Green Aura blur */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-gradient-to-br from-brand-neon/20 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-display font-black tracking-tight text-white">Achievements & Badges</h3>
            <p className="text-xs text-slate-400 mt-1.5 max-w-md leading-relaxed">
              Complete more networking squares to fill horizontal, vertical, or diagonal lines, earn meetup points, and unlock achievements!
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 bg-black/40 border border-white/5 rounded-2xl px-6 py-4.5">
            <div className="w-18 h-14 rounded-xl bg-brand-neon text-black flex items-center justify-center font-display font-black text-2xl shadow-lg border border-brand-neon/30">
              {unlockedCount} <span className="text-xs font-bold text-slate-800 ml-1">/ {totalCount}</span>
            </div>
            <div>
              <p className="text-lg font-display font-bold text-white leading-none">Unlocked</p>
              <p className="text-xs text-brand-neon mt-1 font-medium font-mono">{passOutYear} Pass Out</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grouped Badges Layout */}
      <div className="space-y-10">
        {categories.map((category) => {
          const categoryBadges = ALL_BADGES.filter((b) => b.category === category);

          return (
            <div key={category} className="space-y-4">
              {/* Category Header */}
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-neon shadow-[0_0_8px_#8CE825]" />
                <h4 className="text-sm font-mono font-black text-white uppercase tracking-widest">{category}</h4>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Grid of Badges in Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {categoryBadges.map((badge, idx) => {
                  const unlocked = isUnlocked(badge.id);
                  const colors = getBadgeColors(badge, unlocked);
                  const progress = getBadgeProgress(badge.id);

                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.05 }}
                      className={`p-5 rounded-2xl border flex items-start gap-4 transition-all shadow-xl glow-card relative overflow-hidden ${
                        unlocked ? "border-brand-neon/10 bg-brand-dark/25" : "border-white/5 bg-black/30"
                      }`}
                    >
                      {/* Badge Emblem */}
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${colors}`}>
                        {getBadgeIcon(badge.icon, unlocked)}
                      </div>

                      {/* Badge Context */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className={`font-display font-black text-sm sm:text-base truncate ${unlocked ? "text-white" : "text-slate-500"}`}>
                            {badge.name}
                          </h5>
                          {unlocked ? (
                            <span className="flex items-center gap-1 text-[9px] font-display font-bold text-brand-neon bg-brand-neon/10 px-2 py-0.5 rounded-md border border-brand-neon/20 shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              Earned
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-[9px] font-display font-bold text-slate-500 bg-black/40 px-2 py-0.5 rounded-md border border-white/5 shrink-0">
                              <Lock className="w-2.5 h-2.5 shrink-0" />
                              Locked
                            </span>
                          )}
                        </div>

                        <p className={`text-xs mt-1.5 font-medium leading-relaxed ${unlocked ? "text-slate-300" : "text-slate-500"}`}>
                          {badge.description}
                        </p>

                        {/* Progress Bar Rendering */}
                        {progress && (
                          <div className="mt-3.5 space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-mono">
                              <span className={unlocked ? "text-brand-neon" : "text-slate-600"}>Progress</span>
                              <span className={unlocked ? "text-slate-300 font-bold" : "text-slate-500"}>{progress.label}</span>
                            </div>
                            <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/5">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                  unlocked
                                    ? "bg-brand-neon shadow-[0_0_5px_rgba(140,232,37,0.5)]"
                                    : "bg-slate-700"
                                }`}
                                style={{ width: `${Math.min(100, (progress.value / progress.total) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
