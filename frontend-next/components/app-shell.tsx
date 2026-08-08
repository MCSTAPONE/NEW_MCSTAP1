 "use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { menuLinks } from "@/data/app-data";
import { getAccessToken, getStoredUser, logout } from "@/lib/auth";

type AppShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AppShell({
  title,
  subtitle,
  children
}: AppShellProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<string>("");

  useEffect(() => {
    setUser(getStoredUser()?.username ?? "");
  }, []);

  async function handleLogout() {
    const token = getAccessToken();
    if (token) {
      await logout(token);
    }

    window.location.href = "/login";
  }

  return (
    <div className="page-shell">
      <div className="page-frame">
        <div className="app-layout">
          <aside className="sidebar">
            <div className="sidebar-inner">
              <div>
                
                <h2 className="sidebar-title">MC STAP 1</h2>
                
              </div>

              <nav className="sidebar-nav" aria-label="Main navigation">
                {menuLinks.map((link) => {
                  if (link.children && link.children.length > 0) {
                    const isGroupActive = pathname.startsWith(link.href);

                    return (
                      <div key={link.href} className="sidebar-group">
                        <div className={`sidebar-link sidebar-group-label${isGroupActive ? " active" : ""}`}>
                          <span className="sidebar-icon" aria-hidden="true">
                            {link.icon}
                          </span>
                          <span>{link.label}</span>
                        </div>
                        <div className="sidebar-subnav">
                          {link.children.map((child) => {
                            const isChildActive =
                              pathname === child.href || pathname.startsWith(`${child.href}/`);

                            return (
                              <Link
                                key={child.href}
                                className={`sidebar-sublink${isChildActive ? " active" : ""}`}
                                href={child.href}
                              >
                                <span className="sidebar-subicon" aria-hidden="true">
                                  {child.icon}
                                </span>
                                <span>{child.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  const isActive =
                    link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

                  return (
                    <Link
                      key={link.href}
                      className={`sidebar-link${isActive ? " active" : ""}`}
                      href={link.href}
                    >
                      <span className="sidebar-icon" aria-hidden="true">
                        {link.icon}
                      </span>
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          <div className="main-column">
            <header className="topbar">
              <div>
                <p className="eyebrow">Workspace</p>
                <h2 className="topbar-title">{title}</h2>               
              </div>
              <div className="topbar-actions">
                <span className="pill">
                  <span aria-hidden="true">👤</span>
                  <span>{user || "Authenticated user"}</span>
                </span>
                <button className="button-link button-logout" type="button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </header>
            <main className="content-stack">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
