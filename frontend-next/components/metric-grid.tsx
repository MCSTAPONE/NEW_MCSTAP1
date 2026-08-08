type MetricItem = {
  label: string;
  value: string;
  note: string;
};

export function MetricGrid({ items }: { items: MetricItem[] }) {
  return (
    <div className="metrics">
      {items.map((item) => (
        <article key={item.label} className="metric">
          <div className="metric-label">{item.label}</div>
          <div className="metric-value">{item.value}</div>
          <div className="metric-note">{item.note}</div>
        </article>
      ))}
    </div>
  );
}
