import React from 'react';
import RiskInvestigationButton from './RiskInvestigationButton';

export default function Timeline({ events }) {
  return (
    <div className="timeline-card">
      <div className="timeline">
        {events.map((event, i) => (
          <div className="timeline-item" key={`${event.date}-${event.farm}-${i}`}>
            <div className="timeline-rail">
              <span className={`timeline-dot ${event.severity}`} />
              {i < events.length - 1 && <span className="timeline-line" />}
            </div>

            <div className="timeline-content">
              <div className="timeline-row-top">
                <span className="timeline-date">{event.date}</span>
                <span className={`risk-badge ${event.severity}`}>{event.severity}</span>
              </div>
              <div className="timeline-row-farm">
                <div className="timeline-farm">{event.farm}</div>
                <RiskInvestigationButton farmName={event.farm} />
              </div>
              <div className="timeline-desc">{event.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
