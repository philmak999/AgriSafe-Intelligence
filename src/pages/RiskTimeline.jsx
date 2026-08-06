import React from 'react';
import Timeline from '../components/Timeline';
import { riskTimelineEvents } from '../data/mockData';

export default function RiskTimeline() {
  return <Timeline events={riskTimelineEvents} />;
}
