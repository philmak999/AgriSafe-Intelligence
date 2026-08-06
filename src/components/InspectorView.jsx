import React from 'react';
import PathogenFrequencyChart from './PathogenFrequencyChart';

const queue = [
  {
    facility: 'Batavia Poultry Plant',
    location: 'Batavia NYS',
    mri: 33,
    lastInspection: 'Mar 25',
    pathogen: 'Campylobacter',
    status: 'FAIL',
  },
  {
    facility: 'Syracuse Packing Co.',
    location: 'Syracuse NYS',
    mri: 48,
    lastInspection: 'Mar 26',
    pathogen: 'Listeria',
    status: 'REVIEW',
  },
  {
    facility: 'Rochester Cold Storage',
    location: 'Rochester NYS',
    mri: 71,
    lastInspection: 'Mar 24',
    pathogen: 'Full audit',
    status: 'PASS',
  },
  {
    facility: 'Albany Meat Processing',
    location: 'Albany NYS',
    mri: 77,
    lastInspection: 'Mar 27',
    pathogen: 'E. coli, Salmonella',
    status: 'PASS',
  },
  {
    facility: 'Buffalo Export Facility',
    location: 'Buffalo NYS',
    mri: 79,
    lastInspection: 'Mar 23',
    pathogen: 'Salmonella',
    status: 'PASS',
  },
];

function getMriClass(score) {
  if (score < 40) return 'red';
  if (score <= 60) return 'amber';
  return 'teal';
}

export default function InspectorView() {
  return (
    <>
      {/* Inspection Queue Table */}
      <div className="inspector-table-card">
        <div className="panel-header">
          <span className="card-title" style={{ marginBottom: 0 }}>
            Inspection Queue
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--gray)',
            }}
          >
            {queue.length} facilities
          </span>
        </div>

        <table className="inspector-table">
          <thead>
            <tr>
              <th>Facility</th>
              <th>Location</th>
              <th>Upstream MRI</th>
              <th>Last Inspection</th>
              <th>Pathogen Screen</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((row) => (
              <tr key={row.facility}>
                <td style={{ fontWeight: 500 }}>{row.facility}</td>
                <td style={{ color: 'var(--gray-dark)' }}>{row.location}</td>
                <td>
                  <span className={`mri-cell ${getMriClass(row.mri)}`}>
                    {row.mri}
                  </span>
                </td>
                <td
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--gray)',
                  }}
                >
                  {row.lastInspection}
                </td>
                <td
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--gray-dark)',
                  }}
                >
                  {row.pathogen}
                </td>
                <td>
                  <span className={`status-tag ${row.status}`}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pathogen Frequency Chart */}
      <PathogenFrequencyChart />
    </>
  );
}
