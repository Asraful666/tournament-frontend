export default function PageHeader({
  eyebrow = "TOURNAMENT MANAGEMENT",
  title,
  subtitle,
  actions = null,
}) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {subtitle ? <p className="subtitle">{subtitle}</p> : null}
      </div>

      {actions ? <div className="header-actions">{actions}</div> : null}
    </header>
  );
}
