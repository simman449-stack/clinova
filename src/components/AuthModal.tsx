import React, { useState } from "react";
import { X, Mail, Lock, User as UserIcon, GraduationCap, Globe, FileText } from "lucide-react";
import { api } from "../lib/api";
import { User } from "../types";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Registration and Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [country, setCountry] = useState("");
  const [biography, setBiography] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName || !email || !university || !academicYear || !country || !password) {
          throw new Error("Please fill in all required educational fields.");
        }
        
        const res = await api.post("/api/auth/register", {
          full_name: fullName,
          email,
          university,
          academic_year: academicYear,
          country,
          password,
          biography
        });
        localStorage.setItem("clinova_token", res.token);
        onSuccess(res.user);
        onClose();
      } else {
        if (!email || !password) {
          throw new Error("Please enter your email and password.");
        }
        
        const res = await api.post("/api/auth/login", { email, password });
        localStorage.setItem("clinova_token", res.token);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Authentication attempt failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-modal-backdrop" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div id="auth-modal-container" className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="text-xl font-semibold text-slate-800">
              {isSignUp ? "Create Student Account" : "Access Clinova Portal"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isSignUp ? "Connect with your academic institution" : "Sign in to compile case analysis & reasoning"}
            </p>
          </div>
          <button 
            id="close-auth-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div id="auth-error-banner" className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          {isSignUp && (
            <>
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                  <input
                    id="auth-signup-name"
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50"
                  />
                </div>
              </div>

              {/* University */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Medical School/University *</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                  <input
                    id="auth-signup-university"
                    type="text"
                    required
                    placeholder="e.g. Johns Hopkins Medical School"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50"
                  />
                </div>
              </div>

              {/* Academic Year and Country */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Academic Year *</label>
                  <select
                    id="auth-signup-year"
                    required
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50"
                  >
                    <option value="">Select Year...</option>
                    <option value="Pre-clinical">Pre-clinical (Year 1-2)</option>
                    <option value="Year 3">Year 3 Clinical</option>
                    <option value="Year 4">Year 4 Clinical</option>
                    <option value="Year 5">Year 5 Clinical</option>
                    <option value="Intern / Resident">Intern / Resident</option>
                    <option value="Postgraduate Fellow">Postgraduate Fellow</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Country *</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                    <input
                      id="auth-signup-country"
                      type="text"
                      required
                      placeholder="e.g. Canada"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              {/* Biography */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Biography / Interests (Optional)</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                  <textarea
                    id="auth-signup-bio"
                    placeholder="Briefly state clinical rotations or topics you interest in..."
                    value={biography}
                    onChange={(e) => setBiography(e.target.value)}
                    rows={2}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50 resize-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
              <input
                id="auth-login-email"
                type="email"
                required
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Password *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
              <input
                id="auth-login-password"
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50"
              />
            </div>
            {!isSignUp && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-slate-400 italic">Demo login: student@clinova.edu / password123</span>
                <button
                  type="button"
                  onClick={() => alert("Password reset link is simulated in MVP. Reach out to medical support.")}
                  className="text-xs text-sky-600 hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          {/* Action button */}
          <button
            id="auth-modal-submit"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white rounded-lg font-medium text-sm shadow-xs transition duration-150 flex justify-center items-center gap-2 mt-4"
          >
            {loading ? "Authenticating..." : isSignUp ? "Establish Clinova Credentials" : "Sign In to Portal"}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            {isSignUp ? "Already have an educational profile?" : "New medical student on track?"}{" "}
            <button
              id="auth-modal-toggle"
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-sky-600 hover:text-sky-700 font-semibold hover:underline"
            >
              {isSignUp ? "Sign In Now" : "Register with institution details"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
