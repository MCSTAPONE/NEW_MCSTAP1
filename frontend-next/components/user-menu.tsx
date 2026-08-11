"use client";

import { useEffect, useRef, useState } from "react";

type UserMenuProps = {
  username: string;
  onLogout: () => void;
};

export function UserMenu({ username, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const displayName = username || "Authenticated user";
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="user-menu" ref={containerRef}>
      <button
        className="user-menu-trigger"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span className="user-avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="user-menu-name">{displayName}</span>
        <span className="user-menu-chevron" aria-hidden="true">
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen ? (
        <div className="user-menu-dropdown" role="menu">
          <button
            className="user-menu-item"
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
          >
            <span aria-hidden="true">⎋</span>
            <span>Logout</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
