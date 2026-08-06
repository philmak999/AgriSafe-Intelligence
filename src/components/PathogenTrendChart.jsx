import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const labels = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

const series = [
  { label: 'Campylobacter', data: [4, 5, 7, 6, 9, 8], color: '#E24B4A' },
  { label: 'Salmonella', data: [3, 4, 4, 5, 4, 5], color: '#EF9F27' },
  { label: 'Listeria', data: [2, 2, 3, 3, 4, 4], color: '#639922' },
  { label: 'E. coli', data: [1, 2, 2, 2, 3, 3], color: '#1D9E75' },
];

const data = {
  labels,
  datasets: series.map((s) => ({
    label: s.label,
    data: s.data,
    borderColor: s.color,
    backgroundColor: s.color,
    borderWidth: 2,
    pointRadius: 3,
    pointBackgroundColor: s.color,
    pointBorderColor: '#fff',
    pointBorderWidth: 1.5,
    tension: 0.35,
    fill: false,
  })),
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1a1a18',
      titleColor: 'rgba(255,255,255,0.55)',
      bodyColor: '#fff',
      titleFont: { family: "'DM Mono', monospace", size: 10 },
      bodyFont: { family: "'DM Mono', monospace", size: 11 },
      padding: 10,
      cornerRadius: 8,
      displayColors: true,
      boxWidth: 8,
      boxHeight: 8,
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { font: { family: "'DM Mono', monospace", size: 9 }, color: '#888780' },
    },
    y: {
      min: 0,
      grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
      border: { display: false },
      ticks: { stepSize: 2, font: { family: "'DM Mono', monospace", size: 9 }, color: '#888780' },
    },
  },
  interaction: { mode: 'index', intersect: false },
};

export default function PathogenTrendChart() {
  return (
    <div className="mri-chart-card">
      <div className="chart-header">
        <div className="chart-title">Monthly detections by pathogen — NYS corridor</div>
      </div>

      <div className="chart-container">
        <Line data={data} options={options} />
      </div>

      <div className="chart-legend">
        {series.map((s) => (
          <div className="legend-item" key={s.label}>
            <span className="legend-swatch" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}
