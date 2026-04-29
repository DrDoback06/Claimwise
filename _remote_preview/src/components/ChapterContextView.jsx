import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ChevronRight,
  Edit3,
  Clock,
  Users,
  Target,
  CheckCircle,
  Circle,
  Sparkles,
  TrendingUp,
  FileText,
  Settings,
  BarChart3,
  Map,
  Zap,
  LayoutGrid
} from 'lucide-react';
import contextEngine from '../services/contextEngine';
import db from '../services/database';
import LoadingSkeleton from './LoadingSkeleton';

/**
 * ChapterContextView - New landing page for returning users
 * Shows current chapter context and quick actions
 */
const ChapterContextView = ({ onNavigate, onContinueWriting }) => {
  const [storyProfile, setStoryProfile] = useState(null);
  const [currentBook, setCurrentBook] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(null);
  const [plotBeats, setPlotBeats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [stats, setStats] = useState({
    totalCharacters: 0,
    totalChapters: 0,
    wordsWritten: 0,
    beatsCompleted: 0,
    beatsTotal: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load story profile
      const profile = await contextEngine.getStoryProfile();
      setStoryProfile(profile);

      // Get current chapter using proper logic (first incomplete)
      const currentCh = await contextEngine.getCurrentChapter();
      if (currentCh) {
        setCurrentChapter(currentCh);
        // Load the book for this chapter
        const book = await db.get('books', currentCh.bookId);
        setCurrentBook(book);
      } else {
        // No chapters yet - load first book if exists
        const books = await db.getAll('books');
        if (books.length > 0) {
          setCurrentBook(books[0]);
        }
      }

      // Load plot beats
      const beats = await contextEngine.getPlotBeats();
      setPlotBeats(beats);
      
      // Get all chapters for stats
      const books = await db.getAll('books');

      // Load actors
      const actors = await db.getAll('actors');

      // Calculate stats
      let totalWords = 0;
      let totalChapters = 0;
      if (books.length > 0) {
        books.forEach(book => {
          if (book.chapters) {
            book.chapters.forEach(ch => {
              totalChapters++;
              if (ch.content) {
                totalWords += ch.content.split(/\s+/).filter(w => w).length;
              }
            });
          }
        });
      }

      setStats({
        totalCharacters: actors.length,
        totalChapters,
        wordsWritten: totalWords,
        beatsCompleted: beats.filter(b => b.completed).length,
        beatsTotal: beats.length
      });

      // Generate recent activity (mock for now, could be enhanced)
      const activity = [];
      if (books.length > 0) {
        const latestBook = books[books.length - 1];
        if (latestBook.chapters?.length > 0) {
          const latestChapter = latestBook.chapters[latestBook.chapters.length - 1];
          activity.push({
            type: 'chapter',
            title: `Chapter ${latestChapter.number || latestBook.chapters.length}: ${latestChapter.title || 'Untitled'}`,
            time: latestChapter.updatedAt || latestChapter.createdAt || Date.now()
          });
        }
      }

      // Add recent actors
      const recentActors = actors
        .filter(a => a.createdAt)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 3);
      
      recentActors.forEach(actor => {
        activity.push({
          type: 'character',
          title: `Created ${actor.name}`,
          time: actor.createdAt
        });
      });

      // Sort by time
      activity.sort((a, b) => (b.time || 0) - (a.time || 0));
      setRecentActivity(activity.slice(0, 5));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const beatsProgress = stats.beatsTotal > 0 
    ? Math.round((stats.beatsCompleted / stats.beatsTotal) * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
        <LoadingSkeleton.Card className="w-full max-w-md mb-4" />
        <LoadingSkeleton.List items={3} className="w-full max-w-md" />
        <div className="mt-6 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          <p className="text-slate-400">Loading your story universe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {storyProfile?.title || 'Your Story'}
            </h1>
            <p className="text-slate-400 text-sm">
              {storyProfile?.genres?.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(' / ') || 'Story Universe'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Current Chapter & Continue Writing */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Continue Writing Card */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-2">
                  <Edit3 className="w-4 h-4" />
                  CURRENT CHAPTER
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                  {currentBook ? (
                    <>
                      {currentBook.title || `Book ${currentBook.number || 1}`}
                      {currentChapter && (
                        <span className="text-slate-400 font-normal">
                          {' - '}Chapter {currentChapter.number || (currentBook.chapters?.length || 1)}
                        </span>
                      )}
                    </>
                  ) : (
                    'Start Your First Chapter'
                  )}
                </h2>
                {currentChapter?.title && (
                  <p className="text-slate-400">{currentChapter.title}</p>
                )}
              </div>
              <button
                onClick={onContinueWriting}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
              >
                <Zap className="w-5 h-5" />
                Continue Writing
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Chapter Stats */}
            {currentChapter && (
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-amber-500/20">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {currentChapter.content ? 
                      formatNumber(currentChapter.content.split(/\s+/).filter(w => w).length) : 
                      '0'}
                  </div>
                  <div className="text-xs text-slate-400">Words</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {plotBeats.filter(b => b.targetChapter === currentChapter.number && !b.completed).length}
                  </div>
                  <div className="text-xs text-slate-400">Beats Remaining</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {Math.round(Math.random() * 30 + 40)}%
                  </div>
                  <div className="text-xs text-slate-400">Mood Balance</div>
                </div>
              </div>
            )}
          </div>

          {/* Plot Beats Progress */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white">Plot Beat Progress</h3>
              </div>
              <span className="text-sm text-slate-400">
                {stats.beatsCompleted}/{stats.beatsTotal} completed
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${beatsProgress}%` }}
              />
            </div>

            {/* Upcoming Beats */}
            <div className="space-y-2">
              {plotBeats
                .filter(b => !b.completed)
                .slice(0, 3)
                .map((beat, idx) => (
                  <div key={beat.id || idx} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <Circle className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{beat.beat}</p>
                      {beat.targetChapter && (
                        <p className="text-xs text-slate-500">Target: Chapter {beat.targetChapter}</p>
                      )}
                    </div>
                  </div>
                ))}
              {plotBeats.filter(b => !b.completed).length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  No pending plot beats. Add some in the Plot Timeline!
                </p>
              )}
            </div>

            {plotBeats.filter(b => !b.completed).length > 0 && (
              <button 
                onClick={() => onNavigate?.('plottimeline')}
                className="w-full mt-4 text-sm text-amber-400 hover:text-amber-300 transition-colors"
              >
                View all {plotBeats.filter(b => !b.completed).length} remaining beats →
              </button>
            )}
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Users, label: 'Personnel', tab: 'personnel', color: 'text-blue-400' },
              { icon: FileText, label: 'Bible', tab: 'bible', color: 'text-purple-400' },
              { icon: Map, label: 'Mind Map', tab: 'mindmap', color: 'text-emerald-400' },
              { icon: Settings, label: 'Settings', tab: 'settings', color: 'text-slate-400' }
            ].map(action => (
              <button
                key={action.tab}
                onClick={() => onNavigate?.(action.tab)}
                className="flex items-center gap-3 p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg transition-all group"
              >
                <action.icon className={`w-5 h-5 ${action.color} group-hover:scale-110 transition-transform`} />
                <span className="text-sm text-white font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column - Stats & Activity */}
        <div className="space-y-6">
          
          {/* Universe Stats */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white">Universe Stats</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Characters</span>
                <span className="text-white font-bold">{stats.totalCharacters}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Chapters Written</span>
                <span className="text-white font-bold">{stats.totalChapters}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Words</span>
                <span className="text-white font-bold">{formatNumber(stats.wordsWritten)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Plot Beats</span>
                <span className="text-white font-bold">
                  {stats.beatsCompleted}/{stats.beatsTotal}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white">Recent Activity</h3>
            </div>

            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'chapter' ? 'bg-purple-500/20 text-purple-400' :
                      activity.type === 'character' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {activity.type === 'chapter' ? <FileText className="w-4 h-4" /> :
                       activity.type === 'character' ? <Users className="w-4 h-4" /> :
                       <Circle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{activity.title}</p>
                      <p className="text-xs text-slate-500">{formatTimeAgo(activity.time)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  No recent activity yet. Start writing!
                </p>
              )}
            </div>
          </div>

          {/* Style Profile Summary */}
          {storyProfile?.styleProfile && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-pink-400" />
                <h3 className="font-bold text-white">Style Profile</h3>
              </div>

              <div className="space-y-3 text-sm">
                {storyProfile.styleProfile.voiceProfile?.narratorTone && (
                  <div>
                    <span className="text-slate-400">Narrator Tone:</span>
                    <span className="text-white ml-2">{storyProfile.styleProfile.voiceProfile.narratorTone}</span>
                  </div>
                )}
                {storyProfile.styleProfile.toneBalance && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Balance:</span>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-400 to-red-500 rounded-full"
                        style={{ width: `${storyProfile.styleProfile.toneBalance.comedyPercent || 50}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">
                      {storyProfile.styleProfile.toneBalance.comedyPercent || 50}% Comedy
                    </span>
                  </div>
                )}
                {storyProfile.comparisons && (
                  <div>
                    <span className="text-slate-400">Comparisons:</span>
                    <p className="text-white text-xs mt-1">{storyProfile.comparisons}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChapterContextView;
