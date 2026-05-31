interface Props {
  title: string
  value: string | number
  subtitle?: string
  color?: 'green' | 'blue' | 'orange' | 'red'
}

export default function StatCard({ title, value, subtitle, color = 'green' }: Props) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card-body">
        <p className="stat-card-title">{title}</p>
        <p className="stat-card-value">{value}</p>
        {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
      </div>
    </div>
  )
}
