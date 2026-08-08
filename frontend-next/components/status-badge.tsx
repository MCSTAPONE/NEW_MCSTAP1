import type { ReactNode } from "react";

type BadgeTone = "success" | "warning" | "danger" | "info";

export function StatusBadge({
  tone,
  children
}: {
  tone: BadgeTone;
  children: ReactNode;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
