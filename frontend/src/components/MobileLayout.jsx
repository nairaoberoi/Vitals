import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Home, Calendar, Activity, HeartPulse, Utensils, FileText, Settings } from "lucide-react";
import { Toaster } from "sonner";

const navItems = [
  { to: "/", label: "Home", icon: Home, exact: true, testid: "nav-home" },
  { to: "/transfusions", label: "Transfuse", icon: Calendar, testid: "nav-transfusions" },
  { to: "/ferritin", label: "Ferritin", icon: Activity, testid: "nav-ferritin" },
  { to: "/symptoms", label: "Symptoms", icon: HeartPulse, testid: "nav-symptoms" },
  { to: "/diet", label: "Diet", icon: Utensils, testid: "nav-diet" },
  { to: "/documents", label: "Docs", icon: FileText, testid: "nav-documents" },
];

export const MobileLayout = ({ title, subtitle, children, rightAction }) => {
  const location = useLocation();
  const onSettings = location.pathname === "/settings";

  return (
    <div className="mobile-shell" data-testid="mobile-shell">
      <header className="px-5 pt-7 pb-4 flex items-end justify-between" data-testid="page-header">
        <div className="min-w-0">
          {subtitle && (
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
              {subtitle}
            </div>
          )}
          <h1 className="font-display text-3xl text-foreground leading-none truncate">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {rightAction}
          {!onSettings && (
            <Link
              to="/settings"
              aria-label="Settings"
              data-testid="header-settings-link"
              className="tap-44 w-10 h-10 rounded-full grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="w-5 h-5" strokeWidth={1.5} />
            </Link>
          )}
        </div>
      </header>

      <main className="px-5 pb-6" data-testid="page-main">
        {children}
      </main>

      <nav className="bottom-nav" data-testid="bottom-nav">
        <ul className="grid grid-cols-6 gap-0">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.exact}
                data-testid={item.testid}
                className={({ isActive }) =>
                  `tap-44 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
                    isActive
                      ? "text-[#5B7C99]"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2 : 1.5} />
                    <span className="text-[10px] tracking-wide">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <Toaster position="top-center" theme="light" />
    </div>
  );
};

export default MobileLayout;
