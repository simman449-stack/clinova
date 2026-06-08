import React, { useState, useEffect } from "react";
import { Search, BookOpen, Plus, Shield, Award, UserCheck, AlertCircle, RefreshCw, X } from "lucide-react";
import { api } from "./lib/api";
import { User, ClinicalCase } from "./types";

// Import custom sub-components
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import CaseCard from "./components/CaseCard";
import CaseDetails from "./components/CaseDetails";
import CreateCaseForm from "./components/CreateCaseForm";
import ProfileView from "./components/ProfileView";
import ModeratorDashboard from "./components/ModeratorDashboard";

const SPECIALTIES = [
  "All",
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

const INITIAL_GUEST: User = {
  id: "guest",
  full_name: "Guest Student",
  email: "guest@clinova.edu",
  university: "Browse-only Access",
  academic_year: "N/A",
  country: "Global",
  biography: "Browsing educational case files in read-only guest state.",
  reputation_score: 0,
  role: "guest",
  created_at: new String().toString(),
  badges: []
};

export default function App() {
  // Authentication & Session States
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_GUEST);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Directory and Case States
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // Filters & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [sortBy, setSortBy] = useState("recent"); // recent, discussed, popular

  // Current view controller: 'feed' | 'create-case' | 'case-details' | 'profile' | 'moderator'
  const [activeView, setActiveView] = useState<string>("feed");

  // Validate session on load
  const loadUserSession = async () => {
    setAuthLoading(true);
    try {
      const data = await api.get("/api/auth/me");
      if (data.user) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(INITIAL_GUEST);
      }
    } catch (e) {
      setCurrentUser(INITIAL_GUEST);
    } finally {
      setAuthLoading(false);
    }
  };

  // Fetch Cases Feed
  const loadCases = async () => {
    setCasesLoading(true);
    try {
      const params = new URLSearchParams({
        specialty: selectedSpecialty,
        difficulty: selectedDifficulty,
        sortBy: sortBy,
        search: searchQuery
      });
      const data = await api.get(`/api/cases?${params.toString()}`);
      setCases(data);
    } catch (e) {
      console.error("Failed to fetch cases index list", e);
    } finally {
      setCasesLoading(false);
    }
  };

  useEffect(() => {
    loadUserSession();
  }, []);

  useEffect(() => {
    loadCases();
  }, [selectedSpecialty, selectedDifficulty, sortBy, searchQuery]);

  // Handle successful login/sign-up
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    loadCases(); // refresh card counts
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("clinova_token");
    setCurrentUser(INITIAL_GUEST);
    setActiveView("feed");
    setSelectedCaseId(null);
  };

  // Switch to specific Case details view
  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setActiveView("case-details");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Top sticky header */}
      <Header
        currentUser={currentUser}
        activeView={activeView}
        onSetView={(view) => {
          setActiveView(view);
          setSelectedCaseId(null);
        }}
        onLogout={handleLogout}
        onAuthTrigger={() => setIsAuthModalOpen(true)}
        onSelectCase={handleSelectCase}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        
        {/* Render View: Creation Case Form */}
        {activeView === "create-case" && (
          <CreateCaseForm
            onBack={() => {
              setActiveView("feed");
              setSelectedCaseId(null);
            }}
            onSuccess={() => {
              setActiveView("feed");
              loadCases();
              loadUserSession(); // update authors points +5!
            }}
          />
        )}

        {/* Render View: Detailed case discussion tabs */}
        {activeView === "case-details" && selectedCaseId && (
          <CaseDetails
            caseId={selectedCaseId}
            currentUser={currentUser}
            onBack={() => {
              setActiveView("feed");
              setSelectedCaseId(null);
              loadCases(); // reload counts
            }}
            onAuthTrigger={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* Render View: User profile and badges locker */}
        {activeView === "profile" && (
          <ProfileView
            user={currentUser}
            onProfileUpdate={(updatedUser) => {
              setCurrentUser(updatedUser);
            }}
          />
        )}

        {/* Render View: Moderator Board */}
        {activeView === "moderator" && (
          <ModeratorDashboard
            onBack={() => {
              setActiveView("feed");
              loadCases();
            }}
            onSelectCase={handleSelectCase}
          />
        )}

        {/* Render View: Directory Feed Grid (Home Feed) */}
        {activeView === "feed" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            
            {/* Banner info & Welcome Board */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 bg-sky-50 text-sky-700 text-[10px] font-bold uppercase rounded-md border border-sky-200">
                    MVP Education Release
                  </span>
                  {currentUser.role === "guest" && (
                    <span className="text-[11px] text-slate-450 font-medium font-sans">
                      Viewing cases in Browse-only Guest mode
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Clinova Peer Clinical Case Folder</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Analyze fictional clinical files shared by medical peers. Discuss differential diagnoses, request investigations, and earn positive reputation scores.
                </p>
              </div>

              {currentUser.role !== "guest" ? (
                <button
                  id="feed-share-case-action"
                  onClick={() => setActiveView("create-case")}
                  className="px-4.5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-xs transition duration-150 flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish Case Report</span>
                </button>
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-150 text-xs shrink-0 max-w-xs">
                  <span className="font-bold block text-slate-700 text-[11px] mb-0.5 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                    <span>Join Clinova Peers</span>
                  </span>
                  <p className="text-[11px] text-slate-450">Log in to create cases and vote on differential diagnostics.</p>
                </div>
              )}
            </div>

            {/* Filter and Search Action board */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-xs gap-4 flex flex-col lg:flex-row lg:items-center justify-between">
              
              {/* Search keywords */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                <input
                  id="feed-search-input"
                  type="text"
                  placeholder="Query title, chief symptom, specialty, or contributor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-slate-50/50 rounded-lg text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-slate-700"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")} 
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Specialty select */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Specialty:</span>
                  <select
                    id="feed-specialty-filter"
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs font-medium bg-white text-slate-700"
                  >
                    {SPECIALTIES.map(spec => (
                      <option key={spec} value={spec}>{spec === "All" ? "All Specialties" : spec}</option>
                    ))}
                  </select>
                </div>

                {/* Difficulty selection buttons */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Difficulty:</span>
                  <div className="flex bg-slate-50 border border-slate-200 p-0.5 rounded-md">
                    {["All", "Easy", "Medium", "Hard"].map(diff => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setSelectedDifficulty(diff)}
                        className={`px-2 py-0.8 text-[11px] font-semibold rounded-xs transition ${
                          selectedDifficulty === diff
                            ? "bg-white text-slate-800 shadow-xs font-bold"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sorting Select */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Sort:</span>
                  <select
                    id="feed-sort-filter"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs font-medium bg-white text-slate-700"
                  >
                    <option value="recent">Recent cases</option>
                    <option value="discussed">Most discussed</option>
                    <option value="popular">Most popular</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Live Case grid layout */}
            {casesLoading ? (
              <div className="py-24 text-center justify-center flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
                <p className="text-xs text-slate-500 font-medium">Recompiling peer cases indices...</p>
              </div>
            ) : cases.length === 0 ? (
              <div className="bg-white border border-slate-200 p-12 rounded-xl text-center shadow-xs">
                <BookOpen className="w-12 h-12 text-slate-350 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 mb-1">No Academic Cases Found</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-normal">
                  No published clinical files match your active filter settings. Reset the filters or query keywords to retry.
                </p>
                {searchQuery || selectedSpecialty !== "All" || selectedDifficulty !== "All" ? (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedSpecialty("All");
                      setSelectedDifficulty("All");
                    }}
                    className="mt-4 px-4 py-1.5 bg-slate-100 border border-slate-250 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-md transition"
                  >
                    Reset Directory Filters
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cases.map(kase => (
                  <div key={kase.id}>
                    <CaseCard
                      kase={kase}
                      onSelect={handleSelectCase}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer disclaimer */}
      <footer className="bg-white border-t border-slate-205 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-[10px] text-slate-400 font-medium">
          <p>© 2026 Clinova Inc. For Peer Clinical Medical Case Discussion & Education Only.</p>
          <p className="mt-1">All clinical parameters, tests details and imaging reports are fabricated/educational folder assets.</p>
        </div>
      </footer>

      {/* Active Auth overlay modal */}
      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}
