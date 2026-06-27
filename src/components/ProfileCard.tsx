import React from "react";
import { Profile } from "../types";
import { Linkedin, Github, Globe, Briefcase, Mail, Award } from "lucide-react";
import { motion } from "motion/react";

interface ProfileCardProps {
  profile: Profile;
  score?: { points: number; bingos: number; squares_checked: number } | null;
}

export default function ProfileCard({ profile, score }: ProfileCardProps) {
  const {
    first_name,
    last_name,
    cohort_year,
    current_role,
    company,
    email,
    linkedin_handle,
    github_handle,
    website_url,
    avatar_initials,
  } = profile;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glow-card rounded-2xl border border-white/5 shadow-2xl overflow-hidden"
    >
      {/* Accent Header Block */}
      <div className="h-16 bg-gradient-to-r from-brand-dark to-brand-deep relative border-b border-white/5" />

      <div className="px-6 pb-6 relative">
        {/* Profile Avatar */}
        <div className="absolute -top-10 left-6 w-20 h-20 rounded-2xl bg-[#092315] p-1 shadow-2xl border border-white/10">
          <div className="w-full h-full rounded-xl bg-brand-green/20 text-brand-neon border border-brand-neon/30 flex items-center justify-center font-display font-black text-2xl tracking-wider">
            {avatar_initials || (first_name && last_name ? `${first_name[0]}${last_name[0]}`.toUpperCase() : "CS")}
          </div>
        </div>

        {/* Cohort Badge */}
        <div className="flex justify-end pt-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-neon/10 text-brand-neon font-display font-bold text-xs rounded-full border border-brand-neon/20 shadow-sm">
            <Award className="w-3.5 h-3.5" />
            {cohort_year ? `${cohort_year} Pass Out` : "Alum"}
          </span>
        </div>

        {/* Profile Info */}
        <div className="mt-4">
          <h3 className="text-xl font-display font-bold text-white leading-tight">
            {first_name || "CodeSapiens"} {last_name || "Alumni"}
          </h3>
          {profile.bio && (
            <p className="text-xs text-slate-400 mt-2 bg-black/20 p-2.5 rounded-lg border border-white/5 leading-relaxed italic">
              "{profile.bio}"
            </p>
          )}
          <p className="text-sm font-semibold text-slate-300 mt-2.5 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
            {current_role ? (
              <span>
                {current_role} {company && <span className="text-slate-400 font-normal">at</span>} {company}
              </span>
            ) : (
              <span className="text-slate-500 font-normal italic">No role specified yet</span>
            )}
          </p>
          <p className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            {email}
          </p>
        </div>

        {/* Gameplay Stats (if passed) */}
        {score && (
          <div className="grid grid-cols-3 gap-3 my-5 p-3.5 bg-black/40 rounded-xl border border-white/5 text-center">
            <div>
              <p className="text-2xl font-display font-black text-brand-neon">{score.points}</p>
              <p className="text-[10px] uppercase tracking-wider font-display font-bold text-slate-400 mt-0.5">Points</p>
            </div>
            <div>
              <p className="text-2xl font-display font-black text-amber-400">{score.bingos}</p>
              <p className="text-[10px] uppercase tracking-wider font-display font-bold text-slate-400 mt-0.5">Bingos</p>
            </div>
            <div>
              <p className="text-2xl font-display font-black text-blue-400">{score.squares_checked}</p>
              <p className="text-[10px] uppercase tracking-wider font-display font-bold text-slate-400 mt-0.5">Checked</p>
            </div>
          </div>
        )}

        {/* Contact links / handles */}
        <div className="flex gap-2 mt-5 border-t border-white/5 pt-4 justify-center sm:justify-start">
          {linkedin_handle && (
            <a
              href={`https://linkedin.com/in/${linkedin_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-black/40 hover:bg-white/5 hover:text-brand-neon border border-white/10 transition-all text-slate-400"
              title={`LinkedIn: ${linkedin_handle}`}
            >
              <Linkedin className="w-5 h-5" />
            </a>
          )}
          {github_handle && (
            <a
              href={`https://github.com/${github_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-black/40 hover:bg-white/5 hover:text-brand-neon border border-white/10 transition-all text-slate-400"
              title={`GitHub: ${github_handle}`}
            >
              <Github className="w-5 h-5" />
            </a>
          )}
          {website_url && (
            <a
              href={website_url.startsWith("http") ? website_url : `https://${website_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-black/40 hover:bg-white/5 hover:text-brand-neon border border-white/10 transition-all text-slate-400"
              title="Personal Website"
            >
              <Globe className="w-5 h-5" />
            </a>
          )}
          {!linkedin_handle && !github_handle && !website_url && (
            <p className="text-xs text-slate-500 italic py-1">Add professional links in "Edit Profile"!</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
