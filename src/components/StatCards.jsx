export function StatCards({ stats }) {
  return (
    <div className="stat-cards">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card">
          <span className="stat-card-value">{stat.value}</span>
          <span className="stat-card-label">{stat.label}</span>
        </div>
      ))}
    </div>
  )
}
