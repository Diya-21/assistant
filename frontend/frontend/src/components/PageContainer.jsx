export default function PageContainer({ title, subtitle, children }) {
  return (
    <div className="page-container">
      <div className="page-content">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
