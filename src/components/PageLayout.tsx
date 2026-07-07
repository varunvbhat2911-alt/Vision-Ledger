import { useState, useRef, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  Leaf,
  ShieldCheck,
  History,
  User,
  LogOut,
  Settings,
  FileCheck,
  Moon,
  Sun,
  Bell,
  CheckCheck,
  Trash2,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";

const navLinks = [
  { to: "/", label: "Home", icon: Leaf },
  { to: "/verify", label: "Verify", icon: ShieldCheck },
  { to: "/history", label: "Audit Log", icon: History },
];

export default function PageLayout() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  const [avatarOpen, setAvatarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            to={user ? "/dashboard" : "/"}
            className="flex items-center gap-2 font-heading text-xl font-semibold text-primary transition-colors hover:text-accent cursor-pointer"
          >
            <Leaf className="h-6 w-6" aria-hidden="true" />
            VisionLedger
          </Link>

          <div className="flex items-center gap-1">
            {/* Desktop Nav Links */}
            <nav aria-label="Main navigation" className="hidden sm:block">
              <ul className="flex items-center gap-1">
                {navLinks.map(({ to, label, icon: Icon }) => {
                  const isActive = location.pathname === to;
                  return (
                    <li key={to}>
                      <Link
                        to={to}
                        className={`inline-flex items-center gap-1.5 rounded-btn px-3 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer ${
                          isActive
                            ? "bg-primary text-on-primary"
                            : "text-foreground/70 hover:bg-muted hover:text-foreground"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center h-9 w-9 rounded-btn text-foreground/60 transition-colors hover:bg-muted hover:text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            {user ? (
              <>
                {/* Notification Bell */}
                <div ref={notifRef} className="relative">
                  <button
                    type="button"
                    onClick={() => { setNotifOpen(!notifOpen); setAvatarOpen(false); }}
                    className="relative inline-flex items-center justify-center h-9 w-9 rounded-btn text-foreground/60 transition-colors hover:bg-muted hover:text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-sm">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Panel */}
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-card border border-border bg-surface shadow-xl">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <span className="font-heading text-sm font-semibold text-foreground">Notifications</span>
                        <div className="flex items-center gap-2">
                          {notifications.length > 0 && (
                            <>
                              <button
                                onClick={markAllAsRead}
                                className="text-xs text-foreground/40 hover:text-foreground transition-colors cursor-pointer"
                              >
                                <CheckCheck className="h-4 w-4" />
                              </button>
                              <button
                                onClick={clearAll}
                                className="text-xs text-foreground/40 hover:text-error transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-foreground/40">
                            <Bell className="mx-auto mb-2 h-6 w-6 opacity-30" />
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => markAsRead(n.id)}
                              className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 cursor-pointer ${
                                !n.read ? "bg-accent/[0.03]" : ""
                              }`}
                            >
                              <span className="mt-0.5 shrink-0 text-lg">
                                {n.icon || "📌"}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm truncate ${!n.read ? "font-semibold text-foreground" : "text-foreground/70"}`}>
                                  {n.title}
                                </p>
                                {n.description && (
                                  <p className="mt-0.5 text-xs text-foreground/40 truncate">{n.description}</p>
                                )}
                                <p className="mt-0.5 text-[10px] text-foreground/30">
                                  {new Date(n.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                              {!n.read && (
                                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar Dropdown */}
                <div ref={avatarRef} className="relative">
                  <button
                    type="button"
                    onClick={() => { setAvatarOpen(!avatarOpen); setNotifOpen(false); }}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary transition-colors hover:bg-primary/20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="User menu"
                  >
                    {initials}
                  </button>

                  {avatarOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-card border border-border bg-surface shadow-xl">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                        <p className="text-xs text-foreground/40 truncate">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/dashboard"
                          onClick={() => setAvatarOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/70 transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                        >
                          <LayoutDashboard className="h-4 w-4" /> Dashboard
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setAvatarOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/70 transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                        >
                          <User className="h-4 w-4" /> User Profile
                        </Link>
                        <Link
                          to="/history"
                          onClick={() => setAvatarOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/70 transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                        >
                          <FileCheck className="h-4 w-4" /> My Verifications
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            toggleTheme();
                            setAvatarOpen(false);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground/70 transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                        >
                          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                          {theme === "light" ? "Dark Mode" : "Light Mode"}
                        </button>
                      </div>
                      <div className="border-t border-border py-1">
                        <Link
                          to="/profile"
                          onClick={() => setAvatarOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/70 transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                        >
                          <Settings className="h-4 w-4" /> Account Settings
                        </Link>
                        <button
                          type="button"
                          onClick={async () => {
                            setAvatarOpen(false);
                            await signOut();
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground/70 transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 rounded-btn px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-1.5 rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-accent/90 cursor-pointer"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface-alt py-6 text-center text-sm text-foreground/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p>&copy; {new Date().getFullYear()} VisionLedger — AI-Powered Proof of Reality. Built for transparency across industries.</p>
        </div>
      </footer>
    </div>
  );
}