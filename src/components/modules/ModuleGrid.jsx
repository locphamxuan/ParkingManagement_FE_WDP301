import './ModuleGrid.css';

export default function ModuleGrid({ modules, compact = false, onAction }) {
  return (
    <div className={`module-grid ${compact ? 'compact' : ''}`}>
      {modules.map((module) => (
        <article className={`module-card ${module.available ? 'available' : 'locked'}`} key={module.id}>
          <div className="module-card-head">
            <div>
              <p className="module-kicker">{module.available ? 'Sẵn sàng' : 'Sắp ra mắt'}</p>
              <h3>{module.title}</h3>
            </div>
            <span className="module-badge">{module.available ? 'Mở ngay' : 'Chờ thêm'}</span>
          </div>

          <p>{module.description}</p>

          <button className="module-button" type="button" onClick={() => onAction(module)}>
            {module.actionLabel}
          </button>
        </article>
      ))}
    </div>
  );
}