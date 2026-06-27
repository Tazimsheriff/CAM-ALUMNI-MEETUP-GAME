import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Profile } from "../types";
import { useToast } from "./Toast";
import { User, Briefcase, Mail, Linkedin, Github, Globe, Sparkles, Check, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

interface ProfileEditProps {
  userId: string;
  userEmail: string;
  initialProfile: Profile | null;
  isFirstTimeSetup: boolean;
  onSaveSuccess: (updatedProfile: Profile) => void;
}

export default function ProfileEdit({
  userId,
  userEmail,
  initialProfile,
  isFirstTimeSetup,
  onSaveSuccess,
}: ProfileEditProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cohortYear, setCohortYear] = useState<number>(2025);
  const [currentRole, setCurrentRole] = useState("");
  const [company, setCompany] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const { showToast } = useToast();

  // Load either draft or initialProfile on mount / load
  useEffect(() => {
    if (isInitialized) return;
    if (!userId) return;

    const draftKey = `profile_draft_${userId}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFirstName(draft.firstName ?? "");
        setLastName(draft.lastName ?? "");
        setCohortYear(draft.cohortYear ?? 2025);
        setCurrentRole(draft.currentRole ?? "");
        setCompany(draft.company ?? "");
        setLinkedin(draft.linkedin ?? "");
        setGithub(draft.github ?? "");
        setWebsite(draft.website ?? "");
        setHasDraft(true);
        setIsInitialized(true);
        showToast("Restored your unsaved profile draft!", "info");
        return;
      } catch (e) {
        console.error("Error loading profile draft:", e);
      }
    }

    if (initialProfile) {
      setFirstName(initialProfile.first_name || "");
      setLastName(initialProfile.last_name || "");
      setCohortYear(initialProfile.cohort_year || 2025);
      setCurrentRole(initialProfile.current_role || "");
      setCompany(initialProfile.company || "");
      setLinkedin(initialProfile.linkedin_handle || "");
      setGithub(initialProfile.github_handle || "");
      setWebsite(initialProfile.website_url || "");
      setIsInitialized(true);
    } else if (isFirstTimeSetup) {
      setIsInitialized(true);
    }
  }, [initialProfile, userId, isInitialized, isFirstTimeSetup]);

  // Save draft on form input change, but only if it differs from initial profile
  useEffect(() => {
    if (!isInitialized || !userId) return;

    const draftKey = `profile_draft_${userId}`;
    const currentData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      cohortYear: Number(cohortYear),
      currentRole: currentRole.trim(),
      company: company.trim(),
      linkedin: linkedin.trim(),
      github: github.trim(),
      website: website.trim(),
    };

    const isDifferent =
      !initialProfile ||
      currentData.firstName !== (initialProfile.first_name || "") ||
      currentData.lastName !== (initialProfile.last_name || "") ||
      currentData.cohortYear !== (initialProfile.cohort_year || 2025) ||
      currentData.currentRole !== (initialProfile.current_role || "") ||
      currentData.company !== (initialProfile.company || "") ||
      currentData.linkedin !== (initialProfile.linkedin_handle || "") ||
      currentData.github !== (initialProfile.github_handle || "") ||
      currentData.website !== (initialProfile.website_url || "");

    if (isDifferent) {
      localStorage.setItem(draftKey, JSON.stringify(currentData));
      setHasDraft(true);
    } else {
      localStorage.removeItem(draftKey);
      setHasDraft(false);
    }
  }, [firstName, lastName, cohortYear, currentRole, company, linkedin, github, website, userId, isInitialized, initialProfile]);

  const handleDiscardDraft = () => {
    if (window.confirm("Are you sure you want to discard your unsaved draft?")) {
      const draftKey = `profile_draft_${userId}`;
      localStorage.removeItem(draftKey);
      setHasDraft(false);

      if (initialProfile) {
        setFirstName(initialProfile.first_name || "");
        setLastName(initialProfile.last_name || "");
        setCohortYear(initialProfile.cohort_year || 2025);
        setCurrentRole(initialProfile.current_role || "");
        setCompany(initialProfile.company || "");
        setLinkedin(initialProfile.linkedin_handle || "");
        setGithub(initialProfile.github_handle || "");
        setWebsite(initialProfile.website_url || "");
      } else {
        setFirstName("");
        setLastName("");
        setCohortYear(2025);
        setCurrentRole("");
        setCompany("");
        setLinkedin("");
        setGithub("");
        setWebsite("");
      }
      showToast("Unsaved changes discarded.", "info");
    }
  };

  // Compute initials for live avatar preview
  const getInitials = () => {
    const f = firstName.trim().charAt(0).toUpperCase();
    const l = lastName.trim().charAt(0).toUpperCase();
    if (f || l) return `${f}${l}`;
    return userEmail.substring(0, 2).toUpperCase();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      showToast("First name and Last name are required.", "error");
      return;
    }

    setLoading(true);

    const updatedProfile: Partial<Profile> = {
      id: userId,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      cohort_year: Number(cohortYear),
      current_role: currentRole.trim(),
      company: company.trim(),
      email: userEmail,
      linkedin_handle: linkedin.trim(),
      github_handle: github.trim(),
      website_url: website.trim(),
      avatar_initials: getInitials(),
    };

    try {
      const { data, error } = await supabase.from("profiles").upsert(updatedProfile);

      if (error) {
        showToast(error.message, "error");
      } else {
        const draftKey = `profile_draft_${userId}`;
        localStorage.removeItem(draftKey);
        setHasDraft(false);
        showToast(
          isFirstTimeSetup ? "Profile created! Let's play Bingo!" : "Profile updated successfully!",
          "success"
        );
        onSaveSuccess(updatedProfile as Profile);
      }
    } catch (err: any) {
      showToast(err.message || "An error occurred while saving profile.", "error");
    } finally {
      setLoading(false);
    }
  };

  const initials = getInitials();

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glow-card rounded-2xl shadow-2xl border border-white/5 p-6 sm:p-8"
      >
        <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-white/5">
          {/* Live Avatar Preview */}
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-[#092315] border-2 border-brand-neon/30 text-brand-neon flex items-center justify-center font-display font-black text-3xl shadow-xl tracking-widest">
              {initials}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-brand-neon text-black px-2.5 py-0.5 rounded-full text-xs font-display font-black shadow-sm">
              Pass Out {cohortYear}
            </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <h2 className="text-2xl font-display font-black text-white">
              {isFirstTimeSetup ? "Set Up Your Profile" : "Edit Alumni Profile"}
            </h2>
            <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
              {isFirstTimeSetup
                ? "Welcome! Complete your profile before exploring the meetup board."
                : "Update your contact details and active roles to stay connected."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                First Name <span className="text-brand-neon">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <User className="w-4.5 h-4.5 text-brand-neon" />
                </span>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ada"
                  className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/20 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                Last Name <span className="text-brand-neon">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <User className="w-4.5 h-4.5 text-brand-neon" />
                </span>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Lovelace"
                  className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/20 transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                Pass Out Year <span className="text-brand-neon">*</span>
              </label>
              <select
                value={cohortYear}
                onChange={(e) => setCohortYear(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-black/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-brand-neon focus:bg-brand-dark transition-all text-sm font-medium appearance-none cursor-pointer"
              >
                {[2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                  <option key={year} value={year}>
                    {year} Pass Out
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <Mail className="w-4.5 h-4.5" />
                </span>
                <input
                  type="email"
                  disabled
                  value={userEmail}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/5 text-slate-500 rounded-xl cursor-not-allowed text-sm font-medium"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                Current Role
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <Briefcase className="w-4.5 h-4.5 text-brand-neon" />
                </span>
                <input
                  type="text"
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  placeholder="Full Stack Engineer"
                  className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/20 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                Company / College
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <Briefcase className="w-4.5 h-4.5 text-brand-neon" />
                </span>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Corp / College Name"
                  className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/20 transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6">
            <h3 className="text-sm font-display font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-brand-neon" /> Professional Handles
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  LinkedIn Handle
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#0A66C2]">
                    <Linkedin className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="text"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="adalovelace"
                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/20 transition-all text-sm font-medium font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  GitHub Handle
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 group-focus-within:text-white">
                    <Github className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="text"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="ada-codes"
                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/20 transition-all text-sm font-medium font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Portfolio / Website
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                    <Globe className="w-4.5 h-4.5 text-brand-neon" />
                  </span>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="tazimsheriff.dev or https://ada.dev"
                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/20 transition-all text-sm font-medium font-sans"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            {hasDraft && (
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="px-5 py-3 bg-black/40 hover:bg-rose-500/10 hover:text-rose-400 border border-white/10 text-slate-400 font-display font-bold rounded-xl text-xs sm:text-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                Discard Unsaved Draft
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-brand-neon hover:bg-[#8CE825] text-black font-display font-black tracking-wide rounded-xl text-xs sm:text-sm shadow-xl border border-brand-neon/40 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Check className="w-4.5 h-4.5" />
                  {isFirstTimeSetup ? "Save & View Bingo Board" : "Update Profile"}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
