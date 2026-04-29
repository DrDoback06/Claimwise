import React, { useState, useEffect } from 'react';
import { Target, Trophy, Flame, Calendar, TrendingUp, Award, Zap, Clock, X, Check, Edit3 } from 'lucide-react';
import db from '../services/database';

/**
 * WritingGoals - Track daily/weekly word count goals and streaks
 */
const WritingGoals = ({ currentWordCount = 0, onClose }) => {
  const [goals, setGoals] = useState({
    dailyGoal: 1000,
    weeklyGoal: 5000,
    sessionGoal: 500
  });
  const [stats, setStats] = useState({
    todayWords: 0,
    weekWords: 0,
    streak: 0,
    bestStreak: 0,
    totalWords: 0,
    sessionsThisWeek: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadGoalsAndStats();
  }, []);

  useEffect(() => {
    // Update today's words when currentWordCount changes
    updateTodayProgress(currentWordCount);
  }, [currentWordCount]);

  const loadGoalsAndStats = async () => {
    try {
      const savedGoals = await db.get('settings', 'writingGoals');
      if (savedGoals) {
        setGoals(savedGoals.goals || goals);
        setStats(savedGoals.stats || stats);
        setHistory(savedGoals.history || []);
      }
    } catch (error) {
      console.error('Failed to load goals:', error);
    }
  };

  const saveGoalsAndStats = async (newGoals, newStats, newHistory) => {
    try {
      await db.update('settings', {
        id: 'writingGoals',
        goals: newGoals,
        stats: newStats,
        history: newHistory,
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('Failed to save goals:', error);
    }
  };

  const updateTodayProgress = async (words) => {
    const today = new Date().toDateString();
    const newHistory = [...history];
    const todayEntry = newHistory.find(h => h.date === today);
    
    if (todayEntry) {
      todayEntry.words = Math.max(todayEntry.words, words);
    } else {
      newHistory.push({ date: today, words, goalMet: false });
    }

    // Calculate streak
    let streak = 0;
    const sortedHistory = [...newHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
    for (const entry of sortedHistory) {
      if (entry.words >= goals.dailyGoal) {
        streak++;
      } else {
        break;
      }
    }

    const newStats = {
      ...stats,
      todayWords: words,
      streak,
      bestStreak: Math.max(stats.bestStreak, streak),
      totalWords: newHistory.reduce((sum, h) => sum + h.words, 0)
    };

    setStats(newStats);
    setHistory(newHistory);
    saveGoalsAndStats(goals, newStats, newHistory);
  };

  const handleGoalChange = (key, value) => {
    const newGoals = { ...goals, [key]: parseInt(value) || 0 };
    setGoals(newGoals);
    saveGoalsAndStats(newGoals, stats, history);
  };

  const dailyProgress = Math.min((stats.todayWords / goals.dailyGoal) * 100, 100);
  const weeklyProgress = Math.min((stats.weekWords / goals.weeklyGoal) * 100, 100);
  const sessionProgress = Math.min((currentWordCount / goals.sessionGoal) * 100, 100);

  const getMotivationalMessage = () => {
    if (dailyProgress >= 100) return "🎉 Daily goal crushed! You're on fire!";
    if (dailyProgress >= 75) return "🔥 Almost there! Keep pushing!";
    if (dailyProgress >= 50) return "💪 Halfway done! Great progress!";
    if (dailyProgress >= 25) return "✨ Good start! Keep the momentum!";
    return "📝 Every word counts. Let's go!";
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-slate-700 
        flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-white">Writing Goals</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
          >
            {isEditing ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Motivational Message */}
        <div className="text-center py-2 text-sm text-slate-300">
          {getMotivationalMessage()}
        </div>

        {/* Streak Display */}
        <div className="flex items-center justify-center gap-6 py-3 bg-slate-800/50 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-orange-400">
              <Flame className="w-5 h-5" />
              <span className="text-2xl font-bold">{stats.streak}</span>
            </div>
            <div className="text-xs text-slate-500">Day Streak</div>
          </div>
          <div className="w-px h-10 bg-slate-700" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-amber-400">
              <Trophy className="w-5 h-5" />
              <span className="text-2xl font-bold">{stats.bestStreak}</span>
            </div>
            <div className="text-xs text-slate-500">Best Streak</div>
          </div>
          <div className="w-px h-10 bg-slate-700" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
              <span className="text-2xl font-bold">{(stats.totalWords / 1000).toFixed(1)}k</span>
            </div>
            <div className="text-xs text-slate-500">Total Words</div>
          </div>
        </div>

        {/* Daily Goal */}
        <GoalProgress
          icon={Calendar}
          label="Daily Goal"
          current={stats.todayWords}
          goal={goals.dailyGoal}
          progress={dailyProgress}
          color="amber"
          isEditing={isEditing}
          onGoalChange={(v) => handleGoalChange('dailyGoal', v)}
        />

        {/* Session Goal */}
        <GoalProgress
          icon={Zap}
          label="Session Goal"
          current={currentWordCount}
          goal={goals.sessionGoal}
          progress={sessionProgress}
          color="cyan"
          isEditing={isEditing}
          onGoalChange={(v) => handleGoalChange('sessionGoal', v)}
        />

        {/* Weekly Goal */}
        <GoalProgress
          icon={Award}
          label="Weekly Goal"
          current={stats.weekWords}
          goal={goals.weeklyGoal}
          progress={weeklyProgress}
          color="purple"
          isEditing={isEditing}
          onGoalChange={(v) => handleGoalChange('weeklyGoal', v)}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
          <div className="text-center p-2 bg-slate-800/30 rounded-lg">
            <div className="text-lg font-bold text-white">{stats.todayWords}</div>
            <div className="text-xs text-slate-500">Today</div>
          </div>
          <div className="text-center p-2 bg-slate-800/30 rounded-lg">
            <div className="text-lg font-bold text-white">{goals.dailyGoal - stats.todayWords > 0 ? goals.dailyGoal - stats.todayWords : 0}</div>
            <div className="text-xs text-slate-500">To Goal</div>
          </div>
          <div className="text-center p-2 bg-slate-800/30 rounded-lg">
            <div className="text-lg font-bold text-white">~{Math.ceil((goals.dailyGoal - stats.todayWords) / 30)}</div>
            <div className="text-xs text-slate-500">Min Left</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GoalProgress = ({ icon: Icon, label, current, goal, progress, color, isEditing, onGoalChange }) => {
  const colorClasses = {
    amber: 'bg-amber-500',
    cyan: 'bg-cyan-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500'
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 text-${color}-400`} />
          <span className="text-sm text-slate-300">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{current.toLocaleString()}</span>
          <span className="text-slate-500">/</span>
          {isEditing ? (
            <input
              type="number"
              value={goal}
              onChange={(e) => onGoalChange(e.target.value)}
              className="w-20 px-2 py-0.5 bg-slate-800 border border-slate-600 rounded text-sm text-white text-right"
            />
          ) : (
            <span className="text-sm text-slate-400">{goal.toLocaleString()}</span>
          )}
        </div>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500 ease-out`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {progress >= 100 && (
        <div className="flex items-center gap-1 text-xs text-green-400">
          <Check className="w-3 h-3" />
          Goal achieved!
        </div>
      )}
    </div>
  );
};

export default WritingGoals;
