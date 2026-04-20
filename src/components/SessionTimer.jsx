import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, RotateCcw, Target, Coffee, Zap } from 'lucide-react';

/**
 * SessionTimer - Pomodoro-style writing timer with focus sessions
 */
const SessionTimer = ({ onSessionComplete, compact = false }) => {
  const [mode, setMode] = useState('idle'); // 'idle', 'focus', 'break', 'paused'
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // 25 minutes default
  const [sessionType, setSessionType] = useState('focus'); // 'focus', 'short-break', 'long-break'
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const intervalRef = useRef(null);

  const sessionConfigs = {
    'focus': { duration: 25 * 60, label: 'Focus', icon: Zap, color: 'amber' },
    'short-break': { duration: 5 * 60, label: 'Short Break', icon: Coffee, color: 'green' },
    'long-break': { duration: 15 * 60, label: 'Long Break', icon: Coffee, color: 'blue' }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (mode === 'focus' || mode === 'break') {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSessionEnd();
            return 0;
          }
          if (mode === 'focus') {
            setTotalFocusTime(t => t + 1);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mode]);

  const handleSessionEnd = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // Play notification sound (if available)
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleRkAQJ7b2qJdEgBIqNvXmEoAAFW33NKJNwAAYMHd0HkpAABqyN7MaRsAAHTP38ZZDgAAfNXgwEoFAACE2uG6OwAAAIze4rQzAAAAld/jsiwAAACc4OOsJgAAAKLh5KYhAAAAp+LloCAAAACr4+WbHgAAAK7k5ZgdAAAAseXmlhwAAAC05eaUGwAAALfm5pIaAAAAuefmkBkAAAC85+aPGQAAAL/o5o4YAAAA');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {}

    if (sessionType === 'focus') {
      setCompletedSessions(prev => prev + 1);
      onSessionComplete?.({ type: 'focus', duration: sessionConfigs['focus'].duration });
      
      // Suggest break
      const nextBreak = (completedSessions + 1) % 4 === 0 ? 'long-break' : 'short-break';
      setSessionType(nextBreak);
      setTimeRemaining(sessionConfigs[nextBreak].duration);
    } else {
      setSessionType('focus');
      setTimeRemaining(sessionConfigs['focus'].duration);
    }
    
    setMode('idle');
  };

  const startSession = () => {
    setMode(sessionType === 'focus' ? 'focus' : 'break');
  };

  const pauseSession = () => {
    setMode('paused');
  };

  const resumeSession = () => {
    setMode(sessionType === 'focus' ? 'focus' : 'break');
  };

  const resetSession = () => {
    setMode('idle');
    setTimeRemaining(sessionConfigs[sessionType].duration);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const config = sessionConfigs[sessionType];
  const progress = ((config.duration - timeRemaining) / config.duration) * 100;
  const Icon = config.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-${config.color}-500/20 border border-${config.color}-500/30`}>
          <Icon className={`w-3.5 h-3.5 text-${config.color}-400`} />
          <span className={`text-sm font-mono font-medium text-${config.color}-400`}>
            {formatTime(timeRemaining)}
          </span>
        </div>
        {mode === 'idle' || mode === 'paused' ? (
          <button
            onClick={mode === 'paused' ? resumeSession : startSession}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
          >
            <Play className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={pauseSession}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
          >
            <Pause className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className={`px-4 py-3 bg-gradient-to-r from-${config.color}-500/20 to-${config.color}-600/20 
        border-b border-slate-700 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Clock className={`w-5 h-5 text-${config.color}-400`} />
          <h3 className="font-bold text-white">Focus Timer</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{completedSessions} sessions</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Timer Display */}
        <div className="relative flex items-center justify-center py-6">
          {/* Progress Ring */}
          <svg className="absolute w-40 h-40 -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-slate-800"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeDasharray={440}
              strokeDashoffset={440 - (440 * progress) / 100}
              strokeLinecap="round"
              className={`text-${config.color}-500 transition-all duration-1000`}
            />
          </svg>
          
          <div className="text-center z-10">
            <div className={`text-4xl font-mono font-bold text-${config.color}-400`}>
              {formatTime(timeRemaining)}
            </div>
            <div className="text-sm text-slate-400 mt-1 flex items-center justify-center gap-1">
              <Icon className="w-4 h-4" />
              {config.label}
            </div>
          </div>
        </div>

        {/* Session Type Selector */}
        {mode === 'idle' && (
          <div className="flex items-center justify-center gap-2">
            {Object.entries(sessionConfigs).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => {
                  setSessionType(key);
                  setTimeRemaining(cfg.duration);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${sessionType === key 
                    ? `bg-${cfg.color}-500/20 text-${cfg.color}-400 border border-${cfg.color}-500/30` 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {mode === 'idle' && (
            <button
              onClick={startSession}
              className={`flex items-center gap-2 px-6 py-2.5 bg-${config.color}-600 hover:bg-${config.color}-500 
                rounded-lg text-white font-medium transition-colors`}
            >
              <Play className="w-4 h-4" />
              Start {config.label}
            </button>
          )}
          
          {(mode === 'focus' || mode === 'break') && (
            <>
              <button
                onClick={pauseSession}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 
                  rounded-lg text-white transition-colors"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
              <button
                onClick={resetSession}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
          
          {mode === 'paused' && (
            <>
              <button
                onClick={resumeSession}
                className={`flex items-center gap-2 px-6 py-2.5 bg-${config.color}-600 hover:bg-${config.color}-500 
                  rounded-lg text-white font-medium transition-colors`}
              >
                <Play className="w-4 h-4" />
                Resume
              </button>
              <button
                onClick={resetSession}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-3 text-center">
          <div className="p-2 bg-slate-800/30 rounded-lg">
            <div className="text-lg font-bold text-white">{completedSessions}</div>
            <div className="text-xs text-slate-500">Sessions Today</div>
          </div>
          <div className="p-2 bg-slate-800/30 rounded-lg">
            <div className="text-lg font-bold text-white">{Math.floor(totalFocusTime / 60)}m</div>
            <div className="text-xs text-slate-500">Focus Time</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionTimer;
