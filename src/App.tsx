import React, { useState, useEffect } from "react";
import { supabase, isMockClient } from "./supabase";
import { Profile, Board, Score } from "./types";
import { ToastProvider, useToast } from "./components/Toast";
import AuthScreen from "./components/AuthScreen";
import ProfileEdit from "./components/ProfileEdit";
import ProfileCard from "./components/ProfileCard";
import BingoBoard from "./components/BingoBoard";
import Leaderboard from "./components/Leaderboard";
import Badges from "./components/Badges";
import Connections from "./components/Connections";
import MemePopup from "./components/MemePopup";
import {
  Grid,
  Trophy,
  Award,
  User,
  LogOut,
  Sparkles,
  HeartHandshake,
  CheckCircle,
  Code2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type Tab = "board" | "leaderboard" | "connections" | "badges" | "profile";

function AppContent() {
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [score, setScore] = useState<Score | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("board");
  const [profileSetupRequired, setProfileSetupRequired] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // 1. Get current session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession) {
        fetchUserProfile(currentSession.user.id, currentSession.user.email);
      } else {
        setLoading(false);
      }
    });

    // 2. Setup auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession((prevSession) => {
        const isSameUser = currentSession?.user?.id === prevSession?.user?.id;
        
        if (isSameUser && currentSession) {
          // If it's the same user, do not show the loading screen or re-fetch profile
          return currentSession;
        }

        if (currentSession) {
          setLoading(true);
          fetchUserProfile(currentSession.user.id, currentSession.user.email);
        } else {
          setProfile(null);
          setBoard(null);
          setScore(null);
          setProfileSetupRequired(false);
          setLoading(false);
        }
        return currentSession;
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        showToast("Error fetching profile: " + error.message, "error");
        setLoading(false);
        return;
      }

      if (data && data.first_name) {
        setProfile(data as Profile);
        setProfileSetupRequired(false);
        // Sync active board and scores
        await fetchBoardAndScore(userId);
      } else {
        // Redirection on first login: Force profile creation
        setProfile(data as Profile || null);
        setProfileSetupRequired(true);
        showToast("Welcome! Please complete your profile to play.", "info");
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBoardAndScore = async (userId: string) => {
    try {
      // Fetch board
      const { data: boardData } = await supabase
        .from("boards")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (boardData) setBoard(boardData as Board);

      // Fetch score
      const { data: scoreData } = await supabase
        .from("scores")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (scoreData) setScore(scoreData as Score);
    } catch (err) {
      console.error("Error fetching board/score:", err);
    }
  };

  const handleProfileSaveSuccess = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
    setProfileSetupRequired(false);
    // Initialize standard state for board/score after profile creation
    fetchBoardAndScore(updatedProfile.id);
  };

  const handleScoreUpdate = (updatedScore: Score) => {
    setScore(updatedScore);
    // Trigger board refresh to sync checked list
    supabase
      .from("boards")
      .select("*")
      .eq("user_id", session?.user.id)
      .single()
      .then(({ data }) => {
        if (data) setBoard(data as Board);
      });
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    showToast("Logged out successfully.", "info");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sunburst">
        <div className="w-12 h-12 border-4 border-brand-neon border-t-transparent rounded-full animate-spin" />
        <p className="text-brand-neon font-display font-bold mt-4 tracking-wide text-sm animate-pulse">
          Loading CodeSapiens Meetup...
        </p>
      </div>
    );
  }

  // If not logged in, show Auth Screen
  if (!session) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  // If profile setup is required, block app and force setup
  if (profileSetupRequired) {
    return (
      <div className="min-h-screen bg-sunburst py-12">
        <ProfileEdit
          userId={session.user.id}
          userEmail={session.user.email}
          initialProfile={profile}
          isFirstTimeSetup={true}
          onSaveSuccess={handleProfileSaveSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sunburst flex flex-col pb-20 md:pb-6">
      {/* Premium Desktop Header */}
      <header className="sticky top-0 z-40 bg-brand-dark/90 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo Brand Block */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-neon/10 text-brand-neon flex items-center justify-center font-bold border border-brand-neon/20">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-display font-black text-white flex items-center gap-1.5 leading-none">
                CodeSapiens
              </h1>
              <p className="text-[10px] text-brand-neon font-bold uppercase tracking-wider mt-0.5">
                explore.evolve.engineer
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex bg-black/40 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("board")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "board"
                  ? "bg-brand-neon text-black shadow-lg shadow-brand-neon/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Grid className="w-4 h-4" />
              Bingo Board
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "leaderboard"
                  ? "bg-brand-neon text-black shadow-lg shadow-brand-neon/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Trophy className="w-4 h-4" />
              Leaderboard
            </button>
            <button
              onClick={() => setActiveTab("connections")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "connections"
                  ? "bg-brand-neon text-black shadow-lg shadow-brand-neon/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              Connections
            </button>
            <button
              onClick={() => setActiveTab("badges")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "badges"
                  ? "bg-brand-neon text-black shadow-lg shadow-brand-neon/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Award className="w-4 h-4" />
              My Badges
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "bg-brand-neon text-black shadow-lg shadow-brand-neon/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <User className="w-4 h-4" />
              Profile
            </button>
          </nav>

          {/* User Account Controls */}
          <div className="flex items-center gap-3">
            {profile && (
              <div className="hidden md:flex items-center gap-2.5 pr-2.5 border-r border-white/10">
                <div className="w-8.5 h-8.5 rounded-lg bg-brand-neon/10 text-brand-neon flex items-center justify-center text-xs font-bold border border-brand-neon/20 uppercase">
                  {profile.avatar_initials}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white leading-none">
                    {profile.first_name} {profile.last_name}
                  </p>
                  <span className="inline-block mt-0.5 text-[9px] bg-brand-neon/10 text-brand-neon font-bold px-1.5 py-0.5 rounded border border-brand-neon/20">
                    {profile.cohort_year} Pass Out
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Responsive Body Viewport */}
      <main className="flex-1 py-6 pb-24 md:pb-6 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "board" && profile && (
              <BingoBoard
                userId={session.user.id}
                profile={profile}
                onScoreUpdate={handleScoreUpdate}
              />
            )}

            {activeTab === "leaderboard" && (
              <Leaderboard currentUserId={session.user.id} />
            )}

            {activeTab === "connections" && (
              <Connections currentUserId={session.user.id} />
            )}

            {activeTab === "badges" && (
              <Badges score={score} board={board} profile={profile} />
            )}

            {activeTab === "profile" && profile && (
              <div className="max-w-2xl mx-auto space-y-6">
                <ProfileCard profile={profile} score={score} />
                <ProfileEdit
                  userId={session.user.id}
                  userEmail={session.user.email}
                  initialProfile={profile}
                  isFirstTimeSetup={false}
                  onSaveSuccess={(updated) => setProfile(updated)}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Responsive Bottom Navigation Tab-Bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-brand-dark/95 backdrop-blur-md border-t border-white/10 shadow-lg md:hidden flex justify-around items-center h-16 z-40 px-3">
        <button
          onClick={() => setActiveTab("board")}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors ${
            activeTab === "board" ? "text-brand-neon animate-pulse" : "text-slate-400 hover:text-white"
          }`}
        >
          <Grid className="w-5.5 h-5.5" />
          <span className="text-[10px] font-bold">Grid</span>
        </button>

        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors ${
            activeTab === "leaderboard" ? "text-brand-neon" : "text-slate-400 hover:text-white"
          }`}
        >
          <Trophy className="w-5.5 h-5.5" />
          <span className="text-[10px] font-bold">Ranks</span>
        </button>

        <button
          onClick={() => setActiveTab("connections")}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors ${
            activeTab === "connections" ? "text-brand-neon" : "text-slate-400 hover:text-white"
          }`}
        >
          <HeartHandshake className="w-5.5 h-5.5" />
          <span className="text-[10px] font-bold">Network</span>
        </button>

        <button
          onClick={() => setActiveTab("badges")}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors ${
            activeTab === "badges" ? "text-brand-neon" : "text-slate-400 hover:text-white"
          }`}
        >
          <Award className="w-5.5 h-5.5" />
          <span className="text-[10px] font-bold">Badges</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors ${
            activeTab === "profile" ? "text-brand-neon" : "text-slate-400 hover:text-white"
          }`}
        >
          <User className="w-5.5 h-5.5" />
          <span className="text-[10px] font-bold">Me</span>
        </button>
      </nav>
      <MemePopup />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
