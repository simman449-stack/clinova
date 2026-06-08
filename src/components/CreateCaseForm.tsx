import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles, AlertCircle, HelpCircle, FileText, Activity, ShieldAlert, Award } from "lucide-react";
import { api } from "../lib/api";
import { CaseDifficulty } from "../types";

interface CreateCaseFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

const SPECIALTIES = [
  "Internal Medicine",
  "Cardiology",
  "Neurology",
  "Emergency Medicine",
  "Pediatrics",
  "General Surgery",
  "Obstetrics & Gynecology",
  "Psychiatry",
  "Dermatology",
  "Orthopedics",
  "Family Medicine",
  "Critical Care"
];

type WizardStep = "registry" | "history" | "diagnostics" | "challenge";

export default function CreateCaseForm({ onBack, onSuccess }: CreateCaseFormProps) {
  const [activeStep, setActiveStep] = useState<WizardStep>("registry");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields State
  const [title, setTitle] = useState("");
  const [specialty, setSpecialty] = useState("Internal Medicine");
  const [difficulty, setDifficulty] = useState<CaseDifficulty>("Medium");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"Male" | "Female" | "Other">("Male");
  
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [historyPresentIllness, setHistoryPresentIllness] = useState("");
  const [pastMedicalHistory, setPastMedicalHistory] = useState("");
  const [medications, setMedications] = useState("");
  const [vitalSigns, setVitalSigns] = useState("");
  const [physicalExam, setPhysicalExam] = useState("");
  const [laboratoryResults, setLaboratoryResults] = useState("");
  const [imagingResults, setImagingResults] = useState("");
  const [discussionQuestion, setDiscussionQuestion] = useState("What are your differential diagnoses and what is the next best diagnostic step?");

  const stepsList: { key: WizardStep; label: string; description: string }[] = [
    { key: "registry", label: "Registry", description: "Meta Classification" },
    { key: "history", label: "History & Vitals", description: "Subjective & Objective stats" },
    { key: "diagnostics", label: "Laboratories & Imaging", description: "Diagnostic criteria" },
    { key: "challenge", label: "Peer Challenge", description: "Educational framing" }
  ];

  const handleNextStep = () => {
    setError(null);
    if (activeStep === "registry") {
      if (!title.trim() || !age) {
        setError("Please complete the Case Title and Patient Age fields.");
        return;
      }
      setActiveStep("history");
    } else if (activeStep === "history") {
      if (!chiefComplaint.trim()) {
        setError("Please define the Chief Complaint symptom.");
        return;
      }
      setActiveStep("diagnostics");
    } else if (activeStep === "diagnostics") {
      setActiveStep("challenge");
    }
  };

  const handlePrevStep = () => {
    setError(null);
    if (activeStep === "challenge") setActiveStep("diagnostics");
    else if (activeStep === "diagnostics") setActiveStep("history");
    else if (activeStep === "history") setActiveStep("registry");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validations
    if (!title.trim() || !chiefComplaint.trim() || !discussionQuestion.trim() || !age) {
      setError("Please ensure that all required diagnostic parameters are set before submitting.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/cases", {
        title: title.trim(),
        specialty,
        difficulty,
        age: parseInt(age),
        sex,
        chief_complaint: chiefComplaint.trim(),
        history_present_illness: historyPresentIllness.trim(),
        past_medical_history: pastMedicalHistory.trim(),
        medications: medications.trim(),
        vital_signs: vitalSigns.trim(),
        physical_exam: physicalExam.trim(),
        laboratory_results: laboratoryResults.trim(),
        imaging_results: imagingResults.trim(),
        discussion_question: discussionQuestion.trim()
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to submit clinical case. Connect authenticated user account again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-5 px-4 sm:px-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          id="create-case-back-button"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-bold uppercase tracking-wider transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Case Feeds</span>
        </button>
        <div className="flex items-center gap-1.5 text-xs text-sky-700 bg-sky-50 px-3 py-1.5 rounded-full font-bold border border-sky-200">
          <Award className="w-3.5 h-3.5 text-sky-600" />
          <span>+5 Reputation on sharing case file</span>
        </div>
      </div>

      {/* Step Progress Tracker */}
      <div className="bg-white border border-slate-200 rounded-xl mb-6 p-4 shadow-sm">
        <div className="grid grid-cols-4 gap-2">
          {stepsList.map((step, idx) => {
            const isCompleted = stepsList.indexOf(step) < stepsList.findIndex(s => s.key === activeStep);
            const isActive = step.key === activeStep;

            return (
              <button
                type="button"
                key={step.key}
                onClick={() => {
                  // Allow clicking previously filled tabs
                  const targetIdx = stepsList.findIndex(s => s.key === step.key);
                  const currentIdx = stepsList.findIndex(s => s.key === activeStep);
                  if (targetIdx < currentIdx || (title.trim() && age)) {
                    setActiveStep(step.key);
                    setError(null);
                  }
                }}
                className={`text-left border-l-3 pl-3 py-1 transition flex flex-col justify-between h-full ${
                  isActive
                    ? "border-sky-600 text-sky-950"
                    : isCompleted
                    ? "border-emerald-500 text-slate-700"
                    : "border-slate-100 text-slate-400"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                  Step {idx + 1}
                </span>
                <span className="text-xs font-bold block truncate leading-tight mt-0.5 sm:mt-0">
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Banner Guidance Area */}
        <div className="bg-slate-50/80 border-b border-slate-100 p-5 flex items-start gap-4">
          <div className="p-2.5 bg-sky-100/50 text-sky-700 rounded-lg shrink-0">
            <FileText className="w-5.5 h-5.5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-snug">Academic Peer Registry</h2>
            <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
              Submit structured case notes for collaborative educational reviews. Ensure <strong className="text-rose-600 font-semibold">no real names or patient identifying items (PHI)</strong> are present.
            </p>
          </div>
        </div>

        {/* Form Root */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div id="create-case-error" className="mb-6 p-3 bg-rose-50 border border-rose-150 text-rose-800 text-xs rounded-lg flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: META REGISTRY */}
          {activeStep === "registry" && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <span>Classification & Demographics</span>
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Clinical Case Title *</label>
                <input
                  id="create-case-title"
                  type="text"
                  required
                  placeholder="e.g. Acute Crushing Substernal Chest Pain in a Diabetic Patient"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg text-sm bg-slate-50/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Clinical Specialty *</label>
                  <select
                    id="create-case-specialty"
                    required
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg text-sm bg-white"
                  >
                    {SPECIALTIES.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Difficulty Target *</label>
                  <div className="flex gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-250/30">
                    {["Easy", "Medium", "Hard"].map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setDifficulty(level as CaseDifficulty)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition duration-150 ${
                          difficulty === level 
                            ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Patient Age *</label>
                  <input
                    id="create-case-age"
                    type="number"
                    required
                    min="0"
                    max="120"
                    placeholder="e.g. 54"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg text-sm bg-slate-50/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Biological Sex *</label>
                  <select
                    id="create-case-sex"
                    required
                    value={sex}
                    onChange={(e) => setSex(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg text-sm bg-white"
                  >
                    <option value="Male">Male Patient</option>
                    <option value="Female">Female Patient</option>
                    <option value="Other">Other / Intersex</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLINICAL HISTORY */}
          {activeStep === "history" && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <span>Subjective & Objective Clinical Context</span>
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Chief Complaint (CC) *</label>
                <textarea
                  id="create-case-complaint"
                  required
                  rows={2}
                  placeholder="e.g. Sharp retrosternal thoracic pain radiated downstream to the left arm, lasting over 4 hours with associated cold sweating..."
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg text-sm bg-slate-50/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">History of Present Illness (HPI)</label>
                  <textarea
                    id="create-case-hpi"
                    rows={4}
                    placeholder="Onset details, duration of pain, physical triggers, radiating trends, and associated reviews of medical systems."
                    value={historyPresentIllness}
                    onChange={(e) => setHistoryPresentIllness(e.target.value)}
                    className="w-full p-3 border border-slate-200 focus:border-sky-500 rounded-lg text-xs bg-slate-50/20 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Past History & Active Medications</label>
                  <textarea
                    id="create-case-pmh"
                    rows={4}
                    placeholder="Chronic comorbidities, historical hospitalizations, active medicines, substances, allergies, or surgical histories."
                    value={pastMedicalHistory}
                    onChange={(e) => setPastMedicalHistory(e.target.value)}
                    className="w-full p-3 border border-slate-200 focus:border-sky-500 rounded-lg text-xs bg-slate-50/20 leading-relaxed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Baseline Vital Signs</label>
                  <input
                    id="create-case-vitals"
                    type="text"
                    placeholder="e.g. Temp 37.1°C, BP 138/88 mmHg, HR 92/min, RR 18/min, SpO2 95% on room air"
                    value={vitalSigns}
                    onChange={(e) => setVitalSigns(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-sky-500 rounded-lg text-xs bg-slate-50/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Key Physical Exam Findings</label>
                  <input
                    id="create-case-physical"
                    type="text"
                    placeholder="e.g. Normal S1/S2 heart noises, clear bilateral vesicular breath, soft abdomen, no peripheral edema"
                    value={physicalExam}
                    onChange={(e) => setPhysicalExam(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-sky-500 rounded-lg text-xs bg-slate-50/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIAGNOSTICS & LABS */}
          {activeStep === "diagnostics" && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                  <span>Diagnostic Findings & Tests</span>
                  <span className="text-[10px] text-slate-400 italic lowercase normal-case">Optional - leave blank to challenge peers</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-600 uppercase">Laboratory Findings (Bloods)</label>
                  </div>
                  <textarea
                    id="create-case-labs"
                    rows={5}
                    placeholder="e.g. WBC: 11.2 K/uL, Hemoglobin: 14.1 g/dL, Troponin-I: 1.45 ng/mL (Reference normal < 0.04), Creatinine: 1.1 mg/dL"
                    value={laboratoryResults}
                    onChange={(e) => setLaboratoryResults(e.target.value)}
                    className="w-full p-3 border border-slate-200 focus:border-sky-500 rounded-lg text-xs bg-slate-50/20 font-mono leading-relaxed"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-600 uppercase">Imaging Results & ECG Waves</label>
                  </div>
                  <textarea
                    id="create-case-imaging"
                    rows={5}
                    placeholder="e.g. ECG: Hyperacute ST elevations of 2.5 mm in precordial leads V2-V5, reciprocal depressions in leads II, III, aVF. CXR: Normal lung fields."
                    value={imagingResults}
                    onChange={(e) => setImagingResults(e.target.value)}
                    className="w-full p-3 border border-slate-200 focus:border-sky-500 rounded-lg text-xs bg-slate-50/20 font-mono leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PEER CHALLENGE QUESTION */}
          {activeStep === "challenge" && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span>Educational Objective Formulation</span>
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Active Discussion Focus Question *</label>
                <textarea
                  id="create-case-prompt"
                  required
                  rows={3}
                  value={discussionQuestion}
                  onChange={(e) => setDiscussionQuestion(e.target.value)}
                  className="w-full p-3.5 border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg text-xs font-semibold bg-sky-50/10 text-sky-950"
                />
                
                <div className="mt-3">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Quick Preset Diagnostic Scenarios
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDiscussionQuestion("What are your primary differential diagnoses and what pathophysiology explains the progression of symptoms?")}
                      className="text-[10px] font-semibold text-slate-600 hover:text-sky-700 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 px-3 py-1.5 rounded-lg transition"
                    >
                      Pathophysiology & Differentials
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscussionQuestion("What further clinical history questions or physical examination signs would you prioritize to narrow down the differential?")}
                      className="text-[10px] font-semibold text-slate-600 hover:text-sky-700 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 px-3 py-1.5 rounded-lg transition"
                    >
                      Further Exams & Core History
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscussionQuestion("What high-yield imaging studies or labs should we order next, and what is the standard emergency stabilization protocol?")}
                      className="text-[10px] font-semibold text-slate-600 hover:text-sky-700 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 px-3 py-1.5 rounded-lg transition"
                    >
                      Investigations & Code Protocol
                    </button>
                  </div>
                </div>
              </div>

              {/* Review card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-4 text-xs text-slate-600">
                <span className="font-bold text-slate-800 uppercase tracking-wider block mb-2 text-[10px]">
                  Clinical Registry Review
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium leading-tight">Patient Specimen</span>
                    <strong className="text-slate-800 font-bold">{age}yo {sex}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium leading-tight">Registry target</span>
                    <strong className="text-slate-800 font-bold">{specialty}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium leading-tight">Difficulty Target</span>
                    <strong className="text-slate-800 font-bold">{difficulty}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium leading-tight">Title preview</span>
                    <strong className="text-slate-800 font-bold truncate block" title={title}>{title}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons footer */}
          <div className="border-t border-slate-100 pt-5 mt-8 flex items-center justify-between">
            {activeStep !== "registry" ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-bold uppercase tracking-wider transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Prev Step</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-wider transition"
              >
                Cancel
              </button>

              {activeStep !== "challenge" ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  id="create-case-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition"
                >
                  {loading ? (
                    <span>Registering Case...</span>
                  ) : (
                    <>
                      <span>Register Case & Inform Peers</span>
                      <Check className="w-4 h-4 ml-0.5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
