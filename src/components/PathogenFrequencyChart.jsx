import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const pathogenData = {
  labels: ['Campylobacter', 'Salmonella', 'Listeria', 'E. coli', 'Other'],
  datasets: [
    {
      label: 'Detections',
      data: [8, 5, 4, 3, 2],
      backgroundColor: '#1D9E75',
      borderRadius: 5,
      borderSkipped: false,
      barThickness: 22,
    },
  ],
};

const pathogenOptions = {
  indexAxis: 'y',
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
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(0,0,0,0.05)' },
      border: { display: false },
      ticks: {
        font: { family: "'DM Mono', monospace", size: 9 },
        color: '#888780',
        stepSize: 2,
      },
    },
    y: {
      grid: { display: false },
      border: { display: false },
      ticks: {
        font: { family: "'DM Mono', monospace", size: 10 },
        color: '#5F5E5A',
      },
    },
  },
};

export default function PathogenFrequencyChart({ title = 'Pathogen Detections — Q1 2026' }) {
  return (
    <div className="pathogen-bar-card">
      <div className="panel-header">
        <span className="card-title" style={{ marginBottom: 0 }}>{title}</span>
      </div>
      <div className="pathogen-chart-container">
        <Bar data={pathogenData} options={pathogenOptions} />
      </div>
    </div>
  );
}
