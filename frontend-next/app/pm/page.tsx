import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { pmSections } from "@/data/app-data";

export default function PmPage() {
  return (
    <AppShell
      title="Plant Maintenance"
      subtitle="PM workflows mapped into reusable tiles and ready for transaction-driven detail screens."
    >
      {pmSections.map((section) => (
        <SectionCard key={section.title} section={section} />
      ))}
    </AppShell>
  );
}
