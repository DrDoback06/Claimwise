/**
 * Stat Change Events Component
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock } from 'lucide-react';
import db from '../services/database';

const StatChangeEvents = ({ stat, books }) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    loadEvents();
  }, [stat]);

  const loadEvents = async () => {
    try {
      const allEvents = await db.getAll('timelineEvents') || [];
      const statEvents = allEvents.filter(evt => 
        evt.type === 'stat_change' &&
        evt.statChanges?.[stat.key]
      );
      setEvents(statEvents);
    } catch (error) {
      console.error('Error loading stat events:', error);
    }
  };

  return (
    <div className="space-y-2">
      {events.map((event, idx) => (
        <div key={idx} className="bg-slate-900 rounded p-2 text-xs border border-slate-700">
          <div className="text-white">{event.title || 'Stat Change'}</div>
          <div className="text-slate-400">{event.description}</div>
        </div>
      ))}
    </div>
  );
};

export default StatChangeEvents;
