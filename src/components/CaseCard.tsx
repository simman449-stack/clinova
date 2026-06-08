import React from "react";
import { MessageSquare, Heart, Award, ArrowUp, ArrowRight } from "lucide-react";
import { ClinicalCase } from "../types";

interface CaseCardProps {
  kase: ClinicalCase;
  onSelect: (id: string) => void;
}

export default function CaseCard({ kase, onSelect }: CaseCardProps) {
  // Format difficulty badge style
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Easy":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "Hard":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "solved":
        return "bg-green-50 text-green-700 border-green-200";
      case "archived":
        return "bg-slate-50 text-slate-500 border-slate-200";
      default:
        return "bg-gray-50 text-gray-500 border-gray-100";
    }
  };

  const formattedDate = new Date(kase.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div 
      id={`case-card-${kase.id}`}
      onClick={() => onSelect(kase.id)}
      className="bg-white border border-slate-100 hover:border-sky-200 rounded-xl p-5 shadow-xs hover:shadow-xs transition duration-200 cursor-pointer flex flex-col justify-between group"
    >
      <div>
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 text-xs font-semibold rounded-full border border-slate-200">
              {kase.specialty}
            </span>
            <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border ${getDifficultyColor(kase.difficulty)}`}>
              {kase.difficulty}
            </span>
          </div>
          <span className={`px-2 py-0.5 text-[11px] uppercase font-bold rounded-sm border ${getStatusColor(kase.status)}`}>
            ● {kase.status}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-slate-900 group-hover:text-sky-600 transition-colors text-[15px] sm:text-[16px] leading-snug mb-2">
          {kase.title}
        </h3>

        {/* Clinical Snippet */}
        <p className="text-xs text-slate-600 line-clamp-2 mb-4 bg-slate-50/50 p-2.5 rounded-lg italic">
          <span className="font-semibold text-slate-700 not-italic text-[11px] uppercase bg-slate-200/60 px-1.5 py-0.5 rounded-sm mr-1.5">{kase.sex} ({kase.age}yo)</span>
          &ldquo;{kase.chief_complaint}&rdquo;
        </p>
      </div>

      {/* Footer statistics and authoring */}
      <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <span className="font-medium text-slate-700">{kase.author_name}</span>
          <div className="flex items-center gap-0.5 text-[10px] bg-sky-50 text-sky-700 px-1 py-0.5 rounded-sm font-semibold ml-1">
            <Award className="w-3 h-3" />
            <span>Rep: {kase.author_reputation}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-slate-600 font-medium hover:text-sky-600" title="Reputation and Votes">
            <ArrowUp className="w-4 h-4 text-slate-400" />
            <span>{kase.votes_count}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-600 font-medium" title="Contributions count">
            <MessageSquare className="w-4 h-4 text-slate-400" />
            <span>{kase.contributions_count}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}
