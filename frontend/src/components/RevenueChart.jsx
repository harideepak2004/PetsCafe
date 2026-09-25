import { money } from "../lib/format";

/** Small 7-day revenue bar chart (pure SVG, no chart library). */
export default function RevenueChart({ data }) {
  const max = Math.max(1, ...data.map((d) => Number(d.revenue)));
  const total = data.reduce((sum, d) => sum + Number(d.revenue), 0);
  const W = 100 / data.length;

  return (
    <div className="chart">
      <div className="chart-head">
        <div>
          <div className="card-title">Revenue · last 7 days</div>
          <div className="chart-total">{money(total)}</div>
        </div>
      </div>
      {total === 0 && <p className="chart-empty muted small">No sales yet this week.</p>}
      <div className="chart-bars" role="img" aria-label={`Revenue over the last 7 days, total ${money(total)}`}>
        {data.map((d) => {
          const value = Number(d.revenue);
          const day = new Date(`${d.date}T00:00:00`);
          return (
            <div className="bar-col" key={d.date} style={{ width: `${W}%` }}>
              <div className="bar-tip">{money(value)} · {d.orders} orders</div>
              <div className="bar-track">
                <div className="bar" style={{ height: `${Math.max(value ? 4 : 0, (value / max) * 100)}%` }} />
              </div>
              <span className="bar-label">{day.toLocaleDateString("en-IN", { weekday: "short" })}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
