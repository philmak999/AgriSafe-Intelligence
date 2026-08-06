import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const labels = [
  'W1 Jan', 'W2 Jan', 'W3 Jan', 'W4 Jan',
  'W1 Feb', 'W2 Feb', 'W3 Feb', 'W4 Feb',
  'W1 Mar', 'W2 Mar', 'W3 Mar', 'W4 Mar',
];

const data = {
  labels,
  datasets: [
    {
      label: 'Ontario',
      data: [68, 71, 69, 74, 72, 75, 70, 73, 76, 74, 78, 77],
      borderColor: '#1D9E75',
      backgroundColor: 'rgba(29,158,117,0.07)',
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: '#1D9E75',
      pointBorderColor: '#fff',
      pointBorderWidth: 1.5,
      fill: true,
      tension: 0.35,
    },
    {
      label: 'NYS',
      data: [62, 65, 63, 67, 66, 70, 68, 72, 71, 73, 74, 76],
      borderColor: '#97C459',
      backgroundColor: 'rgba(151,196,89,0.05)',
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: '#97C459',
      pointBorderColor: '#fff',
      pointBorderWidth: 1.5,
      fill: true,
      tension: 0.35,
    },
    {
      label: 'Risk threshold',
      data: Array(12).fill(40),
      borderColor: 'rgba(226,75,74,0.45)',
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderDash: [5, 4],
      pointRadius: 0,
      fill: false,
      tension: 0,
    },
  ],
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
      ticks: {
        font: { family: "'DM Mono', monospace", size: 9 },
        color: '#888780',
        maxRotation: 0,
      },
    },
    y: {
      min: 20,
      max: 100,
      grid: {
        color: 'rgba(0,0,0,0.05)',
        drawBorder: false,
      },
      border: { display: false, dash: [3, 3] },
      ticks: {
        stepSize: 20,
        font: { family: "'DM Mono', monospace", size: 9 },
        color: '#888780',
      },
    },
  },
  interaction: {
    mode: 'index',
    intersect: false,
  },
};

export default function MRIChart() {
  return (
    <div className="mri-chart-card">
      <div className="chart-header">
        <div className="chart-title">Weekly MRI score — Ontario + NYS corridor</div>
      </div>

      <div className="chart-container">
        <Line data={data} options={options} />
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: '#1D9E75' }} />
          Ontario
        </div>
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: '#97C459' }} />
          NYS
        </div>
        <div className="legend-item">
          <span className="legend-swatch dashed" />
          Risk threshold (40)
        </div>
      </div>
    </div>
  );
}
