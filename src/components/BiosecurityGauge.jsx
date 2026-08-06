import React from 'react';

const defaultSubIndexes = [
  { name: 'Vaccination coverage', pct: 82, color: '#1D9E75' },
  { name: 'Antibiotic compliance', pct: 76, color: '#639922' },
  { name: 'Herd density risk', pct: 55, color: '#EF9F27' },
  { name: 'Outbreak proximity', pct: 38, color: '#E24B4A' },
];

// SVG arc gauge helpers
const cx = 130;
const cy = 120;
const r = 88;
const strokeWidth = 14;

// Arc spans 210 degrees: from 195° to 345° (clockwise via bottom)
const startAngleDeg = 195;
const totalDeg = 210;

function polarToXY(angleDeg, radius) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

function arcPath(startDeg, endDeg, radius) {
  const start = polarToXY(startDeg, radius);
  const end = polarToXY(endDeg, radius);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function defaultStatusLabel(score) {
  if (score < 40) return 'Critical – high risk';
  if (score < 70) return 'Moderate – good';
  return 'Strong – low risk';
}

export default function BiosecurityGauge({ score = 73, statusLabel, subIndexes = defaultSubIndexes }) {
  const scoreAngleDeg = startAngleDeg + (score / 100) * totalDeg;

  // Danger zone: 0–30% of the arc
  const dangerEndDeg = startAngleDeg + (30 / 100) * totalDeg;
  const endAngleDeg = startAngleDeg + totalDeg;

  return (
    <div className="gauge-card">
      <div className="gauge-title">Biosecurity Index</div>

      <div className="gauge-svg-wrap">
        <svg
          width="260"
          height="148"
          viewBox="0 0 260 148"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Track (gray background arc) */}
          <path
            d={arcPath(startAngleDeg, endAngleDeg, r)}
            stroke="#E8E6DF"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />

          {/* Danger zone (red, low end) */}
          <path
            d={arcPath(startAngleDeg, dangerEndDeg, r)}
            stroke="rgba(226,75,74,0.22)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />

          {/* Score fill (teal) */}
          {score > 0 && (
            <path
              d={arcPath(startAngleDeg, scoreAngleDeg, r)}
              stroke="#1D9E75"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* Needle cap dot */}
          {(() => {
            const pt = polarToXY(scoreAngleDeg, r);
            return (
              <circle
                cx={pt.x}
                cy={pt.y}
                r={strokeWidth / 2 + 1}
                fill="#1D9E75"
                stroke="#fff"
                strokeWidth="2"
              />
            );
          })()}

          {/* Score number */}
          <text
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            fontFamily="'DM Serif Display', Georgia, serif"
            fontSize="40"
            fill="#1a1a18"
          >
            {score}
          </text>
          <text
            x={cx}
            y={cy + 28}
            textAnchor="middle"
            fontFamily="'DM Mono', monospace"
            fontSize="10"
            fill="#888780"
            letterSpacing="0.08em"
          >
            OUT OF 100
          </text>
        </svg>
      </div>

      <div className="gauge-status-label">{statusLabel ?? defaultStatusLabel(score)}</div>

      {/* Sub-index bars */}
      <div className="subindex-list">
        {subIndexes.map((idx) => (
          <div className="subindex-item" key={idx.name}>
            <div className="subindex-header">
              <span className="subindex-name">{idx.name}</span>
              <span className="subindex-pct" style={{ color: idx.color }}>
                {idx.pct}%
              </span>
            </div>
            <div className="subindex-bar-track">
              <div
                className="subindex-bar-fill"
                style={{ width: `${idx.pct}%`, background: idx.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
