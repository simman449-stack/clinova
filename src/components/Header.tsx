import { useState, useEffect } from "react";
import { Award, Bell, Shield, LogOut, User as UserIcon, Plus, BookOpen, LogIn } from "lucide-react";
import { api } from "../lib/api";
import { User, Notification } from "../types";

interface HeaderProps {
  currentUser: User;
  activeView: string;
  onSetView: (view: string) => void;
  onLogout: () => void;
  onAuthTrigger: () => void;
  onSelectCase: (caseId: string) => void;
}

export default function Header({ 
  currentUser, 
  activeView, 
  onSetView, 
  onLogout, 
  onAuthTrigger, 
  onSelectCase 
}: HeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Poll notifications periodically representing live sync
  const loadNotifications = async () => {
    if (!currentUser || currentUser.role === "guest") return;
    try {
      const data = await api.get("/api/notifications");
      setNotifications(data);
    } catch (e) {
      console.error("Notifications poll silent error", e);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000); // 10s poll
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleMarkAllRead = async () => {
    try {
      await api.post("/api/notifications/read-all", {});
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = (notif: Notification) => {
    setShowNotifications(false);
    // Parse case id from message link
    if (notif.link) {
      const match = notif.link.match(/\/cases\/(.+)/);
      if (match && match[1]) {
        onSelectCase(match[1]);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getReputationLevel = (score: number) => {
    if (score >= 1000) return "Clinical Mentor";
    if (score >= 501) return "Advanced Contributor";
    if (score >= 101) return "Contributor";
    return "Beginner";
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Portal Name Branding */}
        <div 
          onClick={() => onSetView("feed")} 
          className="flex items-center gap-2 cursor-pointer font-sans"
        >
          <div className="w-9 h-9 bg-sky-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm tracking-wide">
            C
          </div>
          <div>
            <span className="text-lg font-bold text-slate-800 tracking-tight">Clinova</span>
            <span className="block text-[10px] text-sky-600 font-semibold uppercase tracking-wider leading-none">
              Clinical Reasoning Peer-Ed
            </span>
          </div>
        </div>

        {/* Global Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            id="nav-feed-button"
            onClick={() => onSetView("feed")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeView === "feed"
                ? "bg-sky-50 text-sky-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            <BookOpen className="w-4 h-4 text-slate-400" />
            <span>Browse Case Files</span>
          </button>

          {currentUser.role !== "guest" && (
            <button
              id="nav-create-button"
              onClick={() => onSetView("create-case")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeView === "create-case"
                  ? "bg-sky-50 text-sky-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <Plus className="w-4 h-4 text-slate-400" />
              <span>Share Clinical Case</span>
            </button>
          )}

          <button
            id="nav-profile-button"
            onClick={() => onSetView("profile")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeView === "profile"
                ? "bg-sky-50 text-sky-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            <UserIcon className="w-4 h-4 text-slate-400" />
            <span>My Profile Cabinets</span>
          </button>

          {(currentUser.role === "moderator" || currentUser.role === "admin") && (
            <button
              id="nav-moderator-button"
              onClick={() => onSetView("moderator")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition ${
                activeView === "moderator"
                  ? "bg-rose-50 text-rose-700 border border-rose-100"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Shield className="w-4 h-4 text-rose-500" />
              <span>Mod Control</span>
            </button>
          )}
        </nav>

        {/* User context information area */}
        <div className="flex items-center gap-3">
          
          {currentUser.role !== "guest" ? (
            <>
              {/* In-app Notifications Dropdown Trigger */}
              <div id="notif-dropdown-wrapper" className="relative">
                <button
                  id="header-notif-bell"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-250 rounded-xl shadow-lg overflow-hidden py-1 z-50">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-5 font-semibold text-xs text-slate-705">
                      <span>Peer Notifications</span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead} 
                          className="text-sky-600 hover:underline font-bold text-[10px]"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div 
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3 text-[11px] hover:bg-slate-50 cursor-pointer transition ${
                              !n.is_read ? "bg-sky-50/40 font-medium" : "text-slate-500"
                            }`}
                          >
                            <p className="line-clamp-2 leading-normal">{n.message}</p>
                            <span className="text-[9px] text-slate-400 mt-1 block">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="p-4 text-center text-[11px] text-slate-450 italic">No historical notification files.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User badge display and metadata */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="text-right">
                  <span className="block text-xs font-bold text-slate-800 truncate max-w-[120px]">{currentUser.full_name}</span>
                  <div className="flex items-center justify-end gap-1">
                    <Award className="w-3 h-3 text-sky-600" />
                    <span className="text-[10px] text-slate-500 font-bold">
                      {getReputationLevel(currentUser.reputation_score)} [{currentUser.reputation_score}]
                    </span>
                  </div>
                </div>
              </div>

              {/* Log Out */}
              <button
                id="header-logout-button"
                onClick={onLogout}
                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                title="Log Out of Portal"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-slate-350 text-xs hidden lg:inline-block">Academic Guest Mode</span>
              <button
                id="header-login-btn"
                onClick={onAuthTrigger}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs hover:shadow-sm transition flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Join & Author</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Quick Rail Nav menu */}
      <div className="md:hidden border-t border-slate-100 flex justify-around py-1 bg-slate-50 text-slate-500 text-[10px]">
        <button 
          onClick={() => onSetView("feed")} 
          className={`flex-1 py-1 flex flex-col items-center gap-0.5 font-semibold ${activeView === "feed" ? "text-sky-600" : ""}`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Feed</span>
        </button>
        {currentUser.role !== "guest" && (
          <button 
            onClick={() => onSetView("create-case")} 
            className={`flex-1 py-1 flex flex-col items-center gap-0.5 font-semibold ${activeView === "create-case" ? "text-sky-600" : ""}`}
          >
            <Plus className="w-4 h-4" />
            <span>Share</span>
          </button>
        )}
        <button 
          onClick={() => onSetView("profile")} 
          className={`flex-1 py-1 flex flex-col items-center gap-0.5 font-semibold ${activeView === "profile" ? "text-sky-600" : ""}`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Profile</span>
        </button>
        {(currentUser.role === "moderator" || currentUser.role === "admin") && (
          <button 
            onClick={() => onSetView("moderator")} 
            className={`flex-1 py-1 flex flex-col items-center gap-0.5 font-semibold ${activeView === "moderator" ? "text-rose-600" : ""}`}
          >
            <Shield className="w-4 h-4" />
            <span>Mod</span>
          </button>
        )}
      </div>
    </header>
  );
}
