import Link from "next/link";

import type { DashboardSection, TileItem } from "@/data/app-data";

function Tile({ item }: { item: TileItem }) {
  const content = (
    <article className="tile">
      <div>
        {item.kicker ? <div className="tile-kicker">{item.kicker}</div> : null}
        <h3 className="tile-title">{item.title}</h3>
        <p className="tile-description">{item.description}</p>
      </div>
    </article>
  );

  if (item.href) {
    return <Link href={item.href}>{content}</Link>;
  }

  return content;
}

export function SectionCard({ section }: { section: DashboardSection }) {
  return (
    <section className="card panel">
      <div className="section-title">
        <div>
          <h2>{section.title}</h2>
          <p>{section.description}</p>
        </div>
      </div>
      <div className="tile-grid">
        {section.items.map((item) => (
          <Tile key={`${section.title}-${item.title}`} item={item} />
        ))}
      </div>
    </section>
  );
}
