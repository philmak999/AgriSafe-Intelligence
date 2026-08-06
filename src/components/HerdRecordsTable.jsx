import React, { useMemo, useState } from 'react';
import { herds } from '../data/mockData';
import RiskInvestigationButton from './RiskInvestigationButton';

function mriClass(score) {
  if (score < 40) return 'red';
  if (score <= 60) return 'amber';
  return 'teal';
}

export default function HerdRecordsTable() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return herds;
    return herds.filter((h) =>
      [h.id, h.farm, h.location, h.species].some((field) =>
        field.toLowerCase().includes(q)
      )
    );
  }, [query]);

  return (
    <div className="inspector-table-card">
      <div className="panel-header">
        <span className="card-title" style={{ marginBottom: 0 }}>Herd Registry</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search farm, location, species…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <table className="inspector-table">
        <thead>
          <tr>
            <th>Herd ID</th>
            <th>Farm</th>
            <th>Location</th>
            <th>Species</th>
            <th>Head Count</th>
            <th>Vaccination</th>
            <th>Last Inspection</th>
            <th>MRI Score</th>
            <th>Risk</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((h) => (
            <tr key={h.id}>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray)' }}>{h.id}</td>
              <td style={{ fontWeight: 500 }}>{h.farm}</td>
              <td style={{ color: 'var(--gray-dark)' }}>{h.location}</td>
              <td>{h.species}</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{h.headCount.toLocaleString()}</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-dark)' }}>{h.vaccination}%</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray)' }}>{h.lastInspection}</td>
              <td><span className={`mri-cell ${mriClass(h.mri)}`}>{h.mri}</span></td>
              <td><span className={`risk-badge ${h.risk}`}>{h.risk}</span></td>
              <td><RiskInvestigationButton farmName={h.farm} /></td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={10} style={{ textAlign: 'center', color: 'var(--gray)', padding: '18px 0' }}>
                No herds match “{query}”.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
