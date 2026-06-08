import { useState, useEffect } from "react";
import { Award, BookOpen, Heart, MessageSquare, MapPin, GraduationCap, Calendar, Edit3, Save, Check } from "lucide-react";
import { api } from "../lib/api";
import { User } from "../types";

interface ProfileViewProps {
  user: User;
  onProfileUpdate: (updatedUser: User) => void;
}

export default function ProfileView({ user, onProfileUpdate }: ProfileViewProps) {
  const [stats, setStats] = useState({ casesCreated: 0, contributionsMade: 0, helpfulCount: 0 });
  const [loading, setLoading] = useState(true);
  
  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState(user.biography || "");
  const [editedUniv, setEditedUniv] = useState(user.university || "");
  const [editedYear, setEditedYear] = useState(user.academic_year || "");
  const [editedCountry, setEditedCountry] = useState(user.country || "");
  const [saveLoading, setSaveLoading] = useState(false);

  // Load user profile statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.get(`/api/users/${user.id}`);
        setStats(data.stats);
      } catch (err) {
        console.error("Failed to load user statistics", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
    
    // Sync editing states
    setEditedBio(user.biography || "");
    setEditedUniv(user.university || "");
    setEditedYear(user.academic_year || "");
    setEditedCountry(user.country || "");
  }, [user]);

  // Save changes
  const handleSave = async () => {
    setSaveLoading(true);
    try {
      const updated = await api.post("/api/users/profile", {
        biography: editedBio,
        university: editedUniv,
        academic_year: editedYear,
        country: editedCountry
      });
      onProfileUpdate(updated);
      setIsEditing(false);
    } catch (err) {
      alert("Could not update user biography details.");
    } finally {
      setSaveLoading(false);
    }
  };

  const getReputationLevel = (score: number) => {
    if (score >= 1000) return { title: "Clinical Mentor", color: "bg-rose-50 text-rose-700 border-rose-200" };
    if (score >= 501) return { title: "Advanced Contributor", color: "bg-purple-50 text-purple-700 border-purple-200" };
    if (score >= 101) return { title: "Contributor", color: "bg-sky-50 text-sky-700 border-sky-200" };
    return { title: "Beginner Peer", color: "bg-slate-50 text-slate-500 border-slate-200" };
  };

  const getBadgesColor = (badge: string) => {
    switch (badge) {
      case "Clinical Mentor":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "Advanced Contributor":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Active Contributor":
        return "bg-sky-100 text-sky-800 border-sky-200";
      case "Founding Educator":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Top Reviewer":
        return "bg-teal-100 text-teal-800 border-teal-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const levelInfo = getReputationLevel(user.reputation_score);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Profile Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs mb-6">
        <div className="h-28 bg-gradient-to-r from-sky-450 to-sky-600 bg-slate-50 relative">
          <div className="absolute right-6 bottom-4 flex items-center gap-1 bg-white/90 px-3 py-1 rounded-sm text-xs border border-slate-200 font-bold text-slate-700 backdrop-blur-xs">
            <Award className="w-4 h-4 text-sky-600" />
            <span>Reputation: {user.reputation_score} pts</span>
          </div>
        </div>

        <div className="px-6 pb-6 pt-2 relative">
          {/* Avatar simulation */}
          <div className="w-20 h-20 bg-sky-200 border-4 border-white text-sky-800 rounded-full flex items-center justify-center text-3xl font-extrabold absolute -top-10 left-6 shadow-md shadow-slate-100">
            {user.full_name.charAt(0)}
          </div>

          <div className="pl-0 sm:pl-24 pt-12 sm:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800">{user.full_name}</h2>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-md border ${levelInfo.color}`}>
                  {levelInfo.title}
                </span>
                {user.role === "moderator" && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-rose-100 border border-rose-200 text-rose-700 rounded-sm">
                    Staff Moderator
                  </span>
                )}
              </div>

              {/* Institutional Details */}
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  {isEditing ? (
                    <input
                      id="profile-edit-university"
                      type="text"
                      value={editedUniv}
                      onChange={(e) => setEditedUniv(e.target.value)}
                      className="px-2 py-0.5 border border-slate-200 rounded-sm bg-slate-50 text-slate-700"
                    />
                  ) : (
                    <span>{user.university}</span>
                  )}
                  <span className="text-slate-300">|</span>
                  <Calendar className="w-4 h-4 shrink-0" />
                  {isEditing ? (
                    <select
                      id="profile-edit-year"
                      value={editedYear}
                      onChange={(e) => setEditedYear(e.target.value)}
                      className="px-2 py-0.5 border border-slate-200 rounded-sm bg-slate-50 text-slate-700 text-xs"
                    >
                      <option value="Pre-clinical">Pre-clinical (Year 1-2)</option>
                      <option value="Year 3">Year 3 Clinical</option>
                      <option value="Year 4">Year 4 Clinical</option>
                      <option value="Year 5">Year 5 Clinical</option>
                      <option value="Intern / Resident">Intern / Resident</option>
                      <option value="Postgraduate Fellow">Postgraduate Fellow</option>
                    </select>
                  ) : (
                    <span>{user.academic_year || "Academic Student"}</span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 shrink-0" />
                  {isEditing ? (
                    <input
                      id="profile-edit-country"
                      type="text"
                      value={editedCountry}
                      onChange={(e) => setEditedCountry(e.target.value)}
                      className="px-2 py-0.5 border border-slate-200 rounded-sm bg-slate-50 text-slate-700"
                    />
                  ) : (
                    <span>{user.country}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Editing controls */}
            {user.role !== "guest" && (
              <div className="shrink-0">
                {isEditing ? (
                  <button
                    id="profile-save-button"
                    onClick={handleSave}
                    disabled={saveLoading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                  >
                    {saveLoading ? "Saving..." : "Save Profile Details"}
                    {!saveLoading && <Save className="w-3.5 h-3.5" />}
                  </button>
                ) : (
                  <button
                    id="profile-edit-toggle"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold shadow-xs transition"
                  >
                    <span>Edit Profile</span>
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Biography details */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Academic Biography</h4>
            {isEditing ? (
              <textarea
                id="profile-edit-biography"
                rows={3}
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
                placeholder="Share your background, field work, rotations, or study goals..."
                className="w-full text-sm border border-slate-200 p-3 rounded-lg bg-slate-50/50"
              />
            ) : (
              <p className="text-sm text-slate-600 max-w-2xl leading-relaxed whitespace-pre-line">
                {user.biography || "No biography provided. Click Edit Profile to add academic info."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats and Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Academic metrics panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Peer Contribution Statistics</h4>
          {loading ? (
            <p className="text-xs text-slate-400">Loading metrics...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>Cases Created</span>
                </div>
                <span className="text-sm font-semibold text-slate-800">{stats.casesCreated}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span>Comments & Analyses</span>
                </div>
                <span className="text-sm font-semibold text-slate-800">{stats.contributionsMade}</span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                  <Heart className="w-4 h-4 text-emerald-400" />
                  <span>Highest Helpful Picks</span>
                </div>
                <span className="text-sm font-semibold text-slate-800">{stats.helpfulCount}</span>
              </div>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-lg text-[10px] text-slate-400 leading-tight mt-4">
            <span className="font-semibold text-slate-600">Points Guideline:</span> Create Case: +5 | Receive Upvote: +2 | Author Core Highlight: +20 | Moderator Stamp: +10.
          </div>
        </div>

        {/* Badges Locker Cabinets */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Earning Badges Chest</h4>
          <div className="flex flex-wrap gap-2.5">
            {user.badges && user.badges.length > 0 ? (
              user.badges.map(badge => (
                <div 
                  key={badge} 
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border shadow-xs ${getBadgesColor(badge)}`}
                >
                  <Award className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{badge}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No prestigious badges registered yet. Create cases and upvote contributions to earn credits.</p>
            )}
          </div>

          <div className="border-t border-slate-100 mt-6 pt-5">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Available Platform Achievements</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-100 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h6 className="font-semibold text-slate-700">Active Contributor</h6>
                  <p className="text-[10px] text-slate-400 mt-0.5">Reach 100+ reputation points on peers upvoting.</p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-100 flex items-start gap-2">
                <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h6 className="font-semibold text-slate-700">Helpful Clinical Peer</h6>
                  <p className="text-[10px] text-slate-400 mt-0.5">Assigned once reaching 10 reputation credits.</p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-100 flex items-start gap-2">
                <Check className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h6 className="font-semibold text-slate-700">Clinical Mentor</h6>
                  <p className="text-[10px] text-slate-400 mt-0.5">Earn 1000+ points to gain core educational seniority.</p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-100 flex items-start gap-2">
                <Check className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <h6 className="font-semibold text-slate-700">Advanced Contributor</h6>
                  <p className="text-[10px] text-slate-400 mt-0.5">Reach over 500+ points through high quality clinical reports.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
