type ProgressItem = {
  module: string;
  percent: number;
};

export function ProgressList({ items }: { items: ProgressItem[] }) {
  return (
    <div className="progress-list">
      {items.map((item) => (
        <article key={item.module} className="progress-row">
          <div className="progress-header">
            <span>{item.module}</span>
            <span>{item.percent}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${item.percent}%` }} />
          </div>
        </article>
      ))}
    </div>
  );
}
