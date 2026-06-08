import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, AlertTriangle, Activity, Award, Check, Trash2, 
  ArrowUp, ArrowDown, Shield, Send, CheckCircle, FileText, 
  Stethoscope, Thermometer, FlaskConical, Image, HelpCircle,
  Sparkles
} from "lucide-react";
import { api } from "../lib/api";
import { ClinicalCase, Contribution, User, ContributionCategory, CaseStatus } from "../types";

interface CaseDetailsProps {
  caseId: string;
  currentUser: User;
  onBack: () => void;
  onAuthTrigger: () => void;
}

const CATEGORIES: { value: ContributionCategory; label: string; icon: string }[] = [
  { value: "differential_diagnosis", label: "Differential Diagnosis", icon: "🧠" },
  { value: "additional_questions", label: "Additional Questions", icon: "❓" },
  { value: "investigations", label: "Investigations", icon: "🧪" },
  { value: "management_plan", label: "Management Plan", icon: "📋" },
  { value: "learning_points", label: "Learning Points", icon: "💡" }
];

export default function CaseDetails({ caseId, currentUser, onBack, onAuthTrigger }: CaseDetailsProps) {
  const [data, setData] = useState<{ case: ClinicalCase; contributions: Contribution[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ContributionCategory>("differential_diagnosis");
  
  // AI Synthesis Workspace State
  const [aiSynthesis, setAiSynthesis] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAi, setShowAi] = useState(false);
  
  // New Contribution submission form
  const [contribContent, setContribContent] = useState("");
  const [submittingContrib, setSubmittingContrib] = useState(false);

  // Load detailed Case structure
  const fetchCase = async () => {
    try {
      const result = await api.get(`/api/cases/${caseId}`);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load core study files.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchCase();
  }, [caseId]);

  // Handle Voting
  const handleVote = async (contribId: string, type: "up" | "down") => {
    if (!currentUser || currentUser.role === "guest") {
      alert("You must register or log in as a student to vote on medical commentary.");
      return;
    }
    
    try {
      const res = await api.post(`/api/contributions/${contribId}/vote`, { vote_type: type });
      
      // Update local state with the returned new votes value
      if (data) {
        const updatedContribs = data.contributions.map(c => {
          if (c.id === contribId) {
            return { ...c, votes: res.votes };
          }
          return c;
        });
        setData({ ...data, contributions: updatedContribs });
      }
    } catch (err: any) {
      alert(err.message || "You cannot vote on your own posts.");
    }
  };

  // Submit Comments
  const handleContribSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.role === "guest") {
      onAuthTrigger();
      return;
    }

    if (!contribContent.trim()) return;

    setSubmittingContrib(true);
    try {
      const newContrib = await api.post(`/api/cases/${caseId}/contributions`, {
        category: activeTab,
        content: contribContent.trim()
      });
      
      // Update state
      if (data) {
        setData({
          case: { ...data.case, contributions_count: data.case.contributions_count + 1 },
          contributions: [newContrib, ...data.contributions]
        });
      }
      setContribContent("");
    } catch (err: any) {
      alert(err.message || "Could not save contribution comments.");
    } finally {
      setSubmittingContrib(false);
    }
  };

  // Select standard helpful contribution
  const handleToggleHelpful = async (contribId: string) => {
    try {
      await api.post(`/api/contributions/${contribId}/helpful`, {});
      fetchCase(); // Refresh database counters
    } catch (err: any) {
      alert(err.message || "Could not assign helpful badge.");
    }
  };

  // Approve Moderator stamp recognition
  const handleToggleRecognized = async (contribId: string) => {
    try {
      await api.post(`/api/contributions/${contribId}/recognize`, {});
      fetchCase();
    } catch (err: any) {
      alert(err.message || "Quality stamp restriction error.");
    }
  };

  // Delete comment / contribution
  const handleDeleteContrib = async (contribId: string) => {
    if (!confirm("Are you sure you want to delete this clinical comment?")) return;
    try {
      await api.delete(`/api/contributions/${contribId}`);
      if (data) {
        setData({
          case: { ...data.case, contributions_count: Math.max(0, data.case.contributions_count - 1) },
          contributions: data.contributions.filter(c => c.id !== contribId)
        });
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Update Status
  const handleStatusChange = async (newStatus: CaseStatus) => {
    try {
      const updatedCase = await api.post(`/api/cases/${caseId}/status`, { status: newStatus });
      if (data) {
        setData({ ...data, case: { ...data.case, status: updatedCase.status } });
      }
    } catch (err: any) {
      alert(err.message || "Unauthorized status shift.");
    }
  };

  // Fetch educational clinical synthesis from Gemini API
  const handleFetchAiSynthesis = async () => {
    if (aiSynthesis) {
      setShowAi(!showAi);
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setShowAi(true);
    try {
      const res = await api.post(`/api/cases/${caseId}/ai-synthesis`, {});
      setAiSynthesis(res);
    } catch (err: any) {
      setAiError(err.message || "Failed to generate comprehensive educational diagnostic summary template.");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div id="case-loading-spinner" className="max-w-4xl mx-auto py-12 text-center text-slate-500 font-medium">
        Loading clinical study files and peer discussion modules...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div id="case-error-card" className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-xl text-center">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-rose-800 font-bold">Unreachable Study Folder</h3>
          <p className="text-xs text-rose-600 mt-1">{error || "Case data model is missing."}</p>
          <button 
            onClick={onBack}
            className="mt-4 px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition"
          >
            Back to Home Feed
          </button>
        </div>
      </div>
    );
  }

  const kase = data.case;
  const filteredContributions = data.contributions.filter(c => c.category === activeTab);

  // Match difficulty style
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

  return (
    <div className="max-w-5xl mx-auto py-4 px-4 sm:px-6">
      {/* Disclaimer Banner */}
      <div id="educational-disclaimer" className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-[11px] sm:text-xs leading-relaxed flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
        <p>
          <span className="font-bold">Medical Education Disclaimer:</span> Clinova is a peer-to-peer clinical reasoning platform designed exclusively for educational discussions among medical students and mentors. The contents of this portal are fictionalized or fully anonymized, and MUST NOT be used for diagnostics, treatment guidelines, or professional healthcare consulting.
        </p>
      </div>

      {/* Detail Back and Action bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          id="detail-back-button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold uppercase tracking-wider transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Back to Case Files</span>
        </button>

        {/* Case Author and Moderators status controller */}
        {(currentUser.id === kase.author_id || currentUser.role === "moderator" || currentUser.role === "admin") && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 px-2">Set Status:</span>
            {(["open", "solved", "archived"] as CaseStatus[]).map(st => (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-sm capitalize transition ${
                  kase.status === st 
                    ? "bg-white text-slate-800 shadow-xs border border-slate-200/80 font-bold" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Case Header Information Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold rounded-full">
              {kase.specialty}
            </span>
            <span className={`px-2.5 py-0.5 border text-xs font-semibold rounded-md ${getDifficultyColor(kase.difficulty)}`}>
              {kase.difficulty} Difficulty
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg">
            <span>Posted by {kase.author_name}</span>
            <div className="flex items-center bg-sky-50 text-sky-700 leading-none px-1.5 py-0.5 rounded-sm font-bold text-[10px]" title="Author Reputation Score">
              Rep: {kase.author_reputation}
            </div>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mb-4">
          {kase.title}
        </h1>

        {/* Patient Case Profile File */}
        <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 sm:p-5 mt-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-sky-600" />
            <span>Admitted Patient Chart</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 border-b border-slate-200 pb-3">
            <div className="p-2 bg-white rounded-md border border-slate-150">
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">Age Group</span>
              <span className="text-sm font-semibold text-slate-800">{kase.age} years old</span>
            </div>
            <div className="p-2 bg-white rounded-md border border-slate-150">
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">Biological Sex</span>
              <span className="text-sm font-semibold text-slate-800">{kase.sex}</span>
            </div>
            <div className="p-2 bg-white rounded-md border border-slate-150">
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">Chief Symptom</span>
              <span className="text-sm font-semibold text-sky-700 line-clamp-1">{kase.chief_complaint}</span>
            </div>
            <div className="p-2 bg-white rounded-md border border-slate-150">
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">Current Case State</span>
              <span className="text-sm font-bold text-slate-850 capitalize">● {kase.status}</span>
            </div>
          </div>

          <div className="space-y-5 text-sm text-slate-705">
            {/* Chief complaint full callout */}
            <div className="p-3.5 bg-sky-50/50 border-l-4 border-sky-600 rounded-r-lg shadow-2xs">
              <span className="block text-sky-950 font-bold text-[10px] uppercase tracking-wider mb-0.5">Chief Complaint (Presenting Symptom)</span>
              <p className="font-serif italic text-slate-800 text-sm leading-normal">&ldquo;{kase.chief_complaint}&rdquo;</p>
            </div>

            {/* HPI & PMH */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {kase.history_present_illness && (
                <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-2xs">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    <span>History of Present Illness (HPI)</span>
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed font-serif whitespace-pre-wrap">{kase.history_present_illness}</p>
                </div>
              )}

              <div className="space-y-4">
                {kase.past_medical_history && (
                  <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-2xs">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                      <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                      <span>Past Medical History (PMH)</span>
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{kase.past_medical_history}</p>
                  </div>
                )}

                {kase.medications && (
                  <div className="bg-slate-50/50 p-3.5 rounded-lg border border-dashed border-slate-200">
                    <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Active Outpatient Medications</span>
                    <p className="text-xs text-slate-650 italic whitespace-pre-wrap leading-tight">{kase.medications}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Vitals & Exams */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {kase.vital_signs && (
                <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-2xs text-xs">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                    <Thermometer className="w-4 h-4 text-rose-600" />
                    <span>Vital Signs on Admission</span>
                  </span>
                  <p className="text-slate-800 font-mono text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-150 leading-relaxed">{kase.vital_signs}</p>
                </div>
              )}

              {kase.physical_exam && (
                <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-2xs text-xs">
                  <span className="flex items-center gap-1.5 text-slate-500 font-bold text-xs mb-2 uppercase tracking-wide">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Physical Examination Findings</span>
                  </span>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{kase.physical_exam}</p>
                </div>
              )}
            </div>

            {/* Labs & Imaging (Professional Tabular Monochromatic Style) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {kase.laboratory_results && (
                <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-2xs">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2.5 uppercase tracking-wide">
                    <FlaskConical className="w-4 h-4 text-sky-600" />
                    <span>Laboratory Findings & Hematology</span>
                  </span>
                  <p className="text-xs text-slate-850 leading-relaxed whitespace-pre-wrap font-mono bg-slate-50 border border-slate-150 p-3 rounded-lg">{kase.laboratory_results}</p>
                </div>
              )}

              {kase.imaging_results && (
                <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-2xs">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2.5 uppercase tracking-wide">
                    <Image className="w-4 h-4 text-amber-600" />
                    <span>Imaging Studies & ECG Readings</span>
                  </span>
                  <p className="text-xs text-slate-850 leading-relaxed whitespace-pre-wrap font-mono bg-slate-50 border border-slate-150 p-3 rounded-lg">{kase.imaging_results}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clinova Clinical AI Synthesis Copilot */}
        <div className="mt-6 border border-amber-350 bg-amber-50/10 rounded-xl overflow-hidden shadow-xs">
          <div className="flex items-center justify-between p-4 bg-amber-50/20 border-b border-amber-150">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-650 animate-pulse" />
              <div>
                <h4 className="text-xs font-bold text-amber-955 uppercase tracking-wider">Clinova AI Reasoning Copilot</h4>
                <p className="text-[10px] text-amber-800 leading-tight">Generate peer clinical summary and expert differential diagnostics based on case briefing.</p>
              </div>
            </div>
            <button
              id="ai-synthesis-trigger"
              onClick={handleFetchAiSynthesis}
              disabled={aiLoading}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition duration-150 shrink-0 ${
                aiLoading 
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed" 
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }`}
            >
              {aiLoading ? "Consulting..." : aiSynthesis ? (showAi ? "Hide Summary" : "Show Summary") : "Review Case"}
            </button>
          </div>

          {showAi && (
            <div className="p-4 sm:p-5 bg-white space-y-5">
              {aiLoading && (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <Activity className="w-8 h-8 text-amber-500 animate-[spin_2s_linear_infinite]" />
                  <span className="text-xs font-semibold text-slate-505 mt-2.5 animate-pulse">Running advanced diagnostic synthesis via Gemini...</span>
                </div>
              )}

              {aiError && (
                <div className="p-3 bg-rose-50 border border-rose-150 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{aiError}</span>
                  <button onClick={handleFetchAiSynthesis} className="ml-auto underline font-bold hover:text-rose-955">Retry</button>
                </div>
              )}

              {aiSynthesis && (
                <div className="divide-y divide-slate-100 space-y-4">
                  {/* Summary */}
                  <div className="pb-4">
                    <span className="text-[10px] font-bold text-amber-750 uppercase tracking-widest block mb-1">Expert Clinical Briefing</span>
                    <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-serif italic">
                      &ldquo;{aiSynthesis.summary}&rdquo;
                    </p>
                  </div>

                  {/* Differentials Diagnoses Grid */}
                  <div className="py-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5">AI Recommended Differential Diagnostics</span>
                    <div className="overflow-x-auto border border-slate-150 rounded-lg">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-150 text-[10px] text-slate-550 uppercase tracking-wider font-bold">
                          <tr>
                            <th className="px-3.5 py-2.5">Diagnosis</th>
                            <th className="px-3.5 py-2.5">Probability / Tier</th>
                            <th className="px-3.5 py-2.5">Clinical Rationale</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 text-slate-700">
                          {aiSynthesis.differentialDiagnoses?.map((df: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-3.5 py-2.5 font-bold text-slate-900">{df.diagnosis}</td>
                              <td className="px-3.5 py-2.5">
                                <span className={`px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase tracking-wider ${
                                  df.probability.toLowerCase().includes("primary") || df.probability.toLowerCase().includes("confirmed")
                                    ? "bg-emerald-55/20 text-emerald-800 border border-emerald-250"
                                    : "bg-amber-55/20 text-amber-800 border border-amber-250"
                                }`}>
                                  {df.probability}
                                </span>
                              </td>
                              <td className="px-3.5 py-2.5 leading-relaxed text-slate-600 font-serif">{df.rationale}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pearls & Workup Side-by-side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-4">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block mb-2">High-Yield Educational Pearls</span>
                      <ul className="space-y-2">
                        {aiSynthesis.clinicalPearls?.map((pt: string, idx: number) => (
                          <li key={idx} className="text-xs text-slate-700 leading-normal flex items-start gap-2 font-serif">
                            <span className="text-emerald-500 shrink-0 font-bold mt-0.5">▪</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-sky-700 uppercase tracking-widest block mb-2">Recommended Diagnostic Workup</span>
                      <ul className="space-y-2">
                        {aiSynthesis.recommendedWorkup?.map((wu: string, idx: number) => (
                          <li key={idx} className="text-xs text-slate-700 leading-normal flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-sky-550 shrink-0 mt-0.5" />
                            <span>{wu}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Immediate Stabilization Emergency rescue */}
                  {aiSynthesis.emergencyActions && aiSynthesis.emergencyActions.length > 0 && (
                    <div className="pt-4">
                      <div className="bg-rose-50/50 border border-rose-150 p-4 rounded-xl">
                        <span className="text-[10px] font-bold text-rose-700 uppercase tracking-widest block mb-2">Immediate Rescue Protocol (Emergency)</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {aiSynthesis.emergencyActions.map((act: string, idx: number) => (
                            <div key={idx} className="text-xs bg-white border border-rose-100 p-2.5 rounded-lg shadow-2xs">
                              <span className="font-bold text-rose-800 text-[9px] block uppercase mb-1">Critical Action {idx+1}</span>
                              <span className="text-slate-700 leading-tight block font-medium font-serif">{act}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Central discussion question callout box */}
        <div className="mt-6 p-4 bg-sky-50/80 border border-sky-150 rounded-xl shadow-2xs">
          <h4 className="text-[10px] font-bold text-sky-900 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-sky-600" />
            <span>Structured Discussion Challenge</span>
          </h4>
          <p className="font-semibold text-slate-850 text-sm leading-relaxed">
            {kase.discussion_question}
          </p>
        </div>
      </div>

      {/* Structured reasoning categories selection tabs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left hand Tabs Selector */}
        <div className="md:col-span-1 space-y-1 bg-white border border-slate-200 rounded-xl p-3 shadow-xs h-fit">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">
            Reasoning Categories
          </h4>
          {CATEGORIES.map(cat => {
            const count = data.contributions.filter(c => c.category === cat.value).length;
            return (
              <button
                key={cat.value}
                onClick={() => setActiveTab(cat.value)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition ${
                  activeTab === cat.value
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[13px]">{cat.icon}</span>
                  <span>{cat.label}</span>
                </div>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold leading-normal ${
                  activeTab === cat.value ? "bg-white/20 text-white" : "bg-slate-105 text-slate-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right hand Comment Feed */}
        <div className="md:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">
                {CATEGORIES.find(c => c.value === activeTab)?.icon}
              </span>
              <h3 className="font-bold text-slate-800 text-[15px]">
                {CATEGORIES.find(c => c.value === activeTab)?.label} discussion channel
              </h3>
            </div>

            {/* Submission Form */}
            {currentUser && currentUser.role !== "guest" ? (
              <form onSubmit={handleContribSubmit} className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="block text-xs font-bold text-slate-600">Propose clinical reasoning thought:</span>
                <textarea
                  id="contrib-input-textarea"
                  required
                  rows={3}
                  placeholder={`Share evidence-based factors or differential points for this category...`}
                  value={contribContent}
                  onChange={(e) => setContribContent(e.target.value)}
                  className="w-full text-sm border border-slate-200 bg-white p-3 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 italic">
                    Earn upvotes to level up from Beginner to Mentor!
                  </span>
                  <button
                    id="contrib-submit-btn"
                    type="submit"
                    disabled={submittingContrib || !contribContent.trim()}
                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-semibold text-xs rounded-lg transition duration-150 flex items-center gap-1"
                  >
                    <span>Submit</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl mb-6 text-center">
                <p className="text-xs text-sky-850 font-medium">
                  Want to contribute clinical explanations or upvote arguments?
                </p>
                <button
                  onClick={onAuthTrigger}
                  className="mt-2.5 px-5 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-700 transition"
                >
                  Join the School Session
                </button>
              </div>
            )}

            {/* List of comments/posts */}
            <div className="space-y-4 divide-y divide-slate-100">
              {filteredContributions.length > 0 ? (
                filteredContributions.map(contrib => {
                  const hasUserUpvoted = false; // vote trackers could be added

                  return (
                    <div 
                      key={contrib.id} 
                      id={`contrib-card-${contrib.id}`}
                      className={`pt-4 first:pt-0 ${
                        contrib.is_helpful 
                          ? "border-2 border-emerald-500 bg-emerald-50/20 p-4 rounded-xl shadow-xs" 
                          : ""
                      }`}
                    >
                      {/* Helpful Banner Badge */}
                      {contrib.is_helpful && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold mb-3 pb-2 border-b border-emerald-100/60">
                          <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                          <span>Selected as Most Helpful Contribution by Case Author (+20 Rep Award)</span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-4">
                        {/* Vote widgets left bar */}
                        <div className="flex flex-col items-center shrink-0 bg-slate-50 border border-slate-150 p-1.5 rounded-lg">
                          <button
                            id={`contrib-upvote-${contrib.id}`}
                            onClick={() => handleVote(contrib.id, "up")}
                            className="p-1 hover:text-emerald-600 text-slate-400 hover:bg-emerald-50 rounded-sm transition"
                            title="Upvote Clinical Quality"
                          >
                            <ArrowUp className="w-4.5 h-4.5" />
                          </button>
                          <span className="text-xs font-bold text-slate-700 my-0.5">{contrib.votes}</span>
                          <button
                            id={`contrib-downvote-${contrib.id}`}
                            onClick={() => handleVote(contrib.id, "down")}
                            className="p-1 hover:text-rose-600 text-slate-400 hover:bg-rose-50 rounded-sm transition"
                            title="Downvote Inaccuracy"
                          >
                            <ArrowDown className="w-4.5 h-4.5" />
                          </button>
                        </div>

                        {/* Core Post detail */}
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-800">{contrib.user_name}</span>
                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-sm uppercase">
                                {contrib.user_role}
                              </span>
                              
                              {/* Clinical score indicator */}
                              <div className="flex items-center text-[9px] bg-slate-100 text-slate-500 font-bold px-1 py-0.2 rounded-xs">
                                Rep: {contrib.user_reputation}
                              </div>

                              {/* Recognized visual stamp */}
                              {contrib.moderator_recognized && (
                                <div className="flex items-center gap-0.5 text-[9px] bg-sky-50 text-sky-700 border border-sky-200 px-1 py-0.2 rounded-xs font-bold" title="Recognized by Staff Moderators (+10 points)">
                                  <Shield className="w-2.5 h-2.5 text-sky-600" />
                                  <span>Mod Recognition</span>
                                </div>
                              )}
                            </div>

                            <span className="text-[10px] text-slate-400">
                              {new Date(contrib.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {contrib.content}
                          </p>

                          {/* Action ribbon for specific levels/authors */}
                          <div className="flex items-center gap-3 mt-3 pt-2 text-[10px] border-t border-dashed border-slate-100">
                            
                            {/* Set Helpful toggle (Author only) */}
                            {currentUser.id === kase.author_id && (
                              <button
                                id={`toggle-helpful-${contrib.id}`}
                                onClick={() => handleToggleHelpful(contrib.id)}
                                className={`font-semibold flex items-center gap-1 Transition ${
                                  contrib.is_helpful 
                                    ? "text-rose-600 hover:text-rose-700" 
                                    : "text-emerald-700 hover:text-emerald-800"
                                }`}
                              >
                                {contrib.is_helpful ? "✖ Unselect Helpful" : "✔ Select Most Helpful"}
                              </button>
                            )}

                            {/* Set stamp recognition (Staff moderators only) */}
                            {(currentUser.role === "moderator" || currentUser.role === "admin") && (
                              <button
                                id={`toggle-recognize-${contrib.id}`}
                                onClick={() => handleToggleRecognized(contrib.id)}
                                className="text-sky-700 hover:text-sky-800 font-bold flex items-center gap-1 shrink-0"
                              >
                                <Shield className="w-3 h-3 text-sky-600" />
                                <span>{contrib.moderator_recognized ? "✖ Remove Quality Seal" : "★ Grant Mod Recognition (+10 Rep)"}</span>
                              </button>
                            )}

                            {/* Delete commentary */}
                            {(currentUser.role === "moderator" || currentUser.role === "admin" || currentUser.id === contrib.user_id) && (
                              <button
                                id={`delete-contrib-${contrib.id}`}
                                onClick={() => handleDeleteContrib(contrib.id)}
                                className="text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 ml-auto"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete Post</span>
                              </button>
                            )}

                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No academic notes published in this category yet. Be the first to start the reasoning discussion.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
