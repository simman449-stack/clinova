import { useState, useEffect } from "react";
import { Shield, Trash2, CheckCircle2, AlertTriangle, Users, BookOpen, MessageSquare } from "lucide-react";
import { api } from "../lib/api";
import { ClinicalCase } from "../types";

interface ModeratorDashboardProps {
  onBack: () => void;
  onSelectCase: (caseId: string) => void;
}

export default function ModeratorDashboard({ onBack, onSelectCase }: ModeratorDashboardProps) {
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAllCasesForReview = async () => {
    try {
      const data = await api.get("/api/cases");
      setCases(data);
    } catch (err: any) {
      setError("Failed to retrieve master case log.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllCasesForReview();
  }, []);

  const handleDeleteCase = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete the case: "${name}"? This will also wipe its peer comment logs.`)) {
      return;
    }

    try {
      await api.delete(`/api/cases/${id}`);
      setCases(cases.filter(c => c.id !== id));
    } catch (err: any) {
      alert("Failed to delete case file: " + err.message);
    }
  };

  const getDifficultyBg = (d: string) => {
    switch (d) {
      case "Easy": return "bg-emerald-100 text-emerald-800";
      case "Medium": return "bg-amber-100 text-amber-800";
      default: return "bg-rose-100 text-rose-800";
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* Head */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-rose-600" />
          <h2 className="text-xl font-bold text-slate-800">Clinova Reviewer Control Panel</h2>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-xs font-semibold transition"
        >
          Exit Control Panel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cases review list */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Active Case Directory Audit</h3>
            <p className="text-[11px] text-slate-400">Total Cases listed in directory: {cases.length}</p>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400">Loading directory...</p>
          ) : error ? (
            <p className="text-xs text-rose-600">{error}</p>
          ) : cases.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No published cases exist to moderate.</p>
          ) : (
            <div className="space-y-3">
              {cases.map(c => (
                <div 
                  key={c.id} 
                  id={`review-item-${c.id}`}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-250 flex items-center justify-between gap-4 text-xs hover:bg-slate-100/55 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-800 truncate block text-xs max-w-xs">{c.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-sm font-semibold capitalize ${getDifficultyBg(c.difficulty)}`}>
                        {c.difficulty}
                      </span>
                      <span className="bg-slate-200 text-slate-700 text-[9px] px-1 rounded-sm uppercase font-semibold">
                        {c.specialty}
                      </span>
                    </div>

                    <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-2">
                      <span>By: <span className="font-semibold text-slate-700">{c.author_name}</span></span>
                      <span>•</span>
                      <span>State: <span className="uppercase font-bold text-[10px]">{c.status}</span></span>
                      <span>•</span>
                      <span>Replies: {c.contributions_count}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      id={`inspect-case-${c.id}`}
                      onClick={() => onSelectCase(c.id)}
                      className="px-2.5 py-1 text-[10px] bg-white border border-slate-300 text-slate-600 hover:text-slate-800 font-semibold rounded-sm transition hover:bg-slate-100"
                    >
                      Audit
                    </button>
                    <button
                      id={`mod-delete-case-${c.id}`}
                      onClick={() => handleDeleteCase(c.id, c.title)}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-sm transition"
                      title="Nuke Case File"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conduct Rulebook and Guidelines */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-1.5">
              <Shield className="w-4.5 h-4.5 text-sky-600" />
              <span>Reviewer Conduct Standards</span>
            </h3>
            
            <ul className="space-y-3.5 text-xs text-slate-600">
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-700">Strictly No PHI:</strong> Any case showing real patient names, direct hospitals, or clear clinical locations must be deleted instantly.
                </span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-700">Promote Reasoning:</strong> Highlight excellent peer commentary with the Blue <span className="font-bold text-sky-700">Mod Recognition</span> badge.
                </span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-700">Abusive Language:</strong> Wipe comment chains that carry non-peer educational attitudes or inappropriate medical diagnosis marketing.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-xl text-xs text-rose-800 leading-normal flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p>
              <strong className="block text-rose-900 mb-0.5">Critical Oversight Notice:</strong> Deletions on case directories are irreversible. Ensure full diagnostics analysis check before clicking nuke.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
