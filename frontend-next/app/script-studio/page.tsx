import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { studioSections } from "@/data/app-data";

export default function ScriptStudioPage() {
  return (
    <AppShell
      title="Script Studio"
      subtitle="Templates, builder workflows, and script operations are organized into reusable sections."
    >
      {studioSections.map((section) => (
        <SectionCard key={section.title} section={section} />
      ))}
    </AppShell>
  );
}
