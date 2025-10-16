import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Circle, Plus, Trash2, Calendar, TrendingUp, 
  Book, Star, Target, Award, Zap, Edit2, Save, X, Clock,
  Sun, Moon, Coffee, Heart, Sparkles, Trophy
} from 'lucide-react';

interface Goal {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  createdAt: string;
}

interface DiaryEntry {
  id: string;
  content: string;
  mood: string;
  highlights: string[];
  gratitude: string[];
  timestamp: string;
}

interface DailyData {
  date: string;
  goals: Goal[];
  diary: DiaryEntry | null;
  completedCount: number;
  totalGoals: number;
}

interface HistoricalData {
  [date: string]: DailyData;
}

export default function DailyJournalPage() {
  const [currentDate, setCurrentDate] = useState(new Date().toDateString());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [goalPriority, setGoalPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [goalCategory, setGoalCategory] = useState('Personal');
  
  const [diaryContent, setDiaryContent] = useState('');
  const [mood, setMood] = useState('😊');
  const [highlights, setHighlights] = useState<string[]>([]);
  const [newHighlight, setNewHighlight] = useState('');
  const [gratitude, setGratitude] = useState<string[]>([]);
  const [newGratitude, setNewGratitude] = useState('');
  
  const [historicalData, setHistoricalData] = useState<HistoricalData>({});
  const [showHistory, setShowHistory] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const moods = ['😊', '😃', '😎', '🤔', '😴', '😢', '😤', '🥳', '😌', '🤗'];
  const categories = ['Personal', 'Work', 'Health', 'Learning', 'Finance', 'Social'];

  // Load data on mount
  useEffect(() => {
    const today = new Date().toDateString();
    const savedData = localStorage.getItem('dailyJournalData');
    
    if (savedData) {
      const parsed: HistoricalData = JSON.parse(savedData);
      setHistoricalData(parsed);
      
      // Check if we need to reset for a new day
      if (parsed[today]) {
        setGoals(parsed[today].goals);
        if (parsed[today].diary) {
          setDiaryContent(parsed[today].diary.content);
          setMood(parsed[today].diary.mood);
          setHighlights(parsed[today].diary.highlights);
          setGratitude(parsed[today].diary.gratitude);
        }
      }
    }
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    const today = new Date().toDateString();
    
    const todayData: DailyData = {
      date: today,
      goals: goals,
      diary: diaryContent || highlights.length > 0 || gratitude.length > 0 ? {
        id: Date.now().toString(),
        content: diaryContent,
        mood: mood,
        highlights: highlights,
        gratitude: gratitude,
        timestamp: new Date().toISOString()
      } : null,
      completedCount: goals.filter(g => g.completed).length,
      totalGoals: goals.length
    };

    const updatedHistory = {
      ...historicalData,
      [today]: todayData
    };

    setHistoricalData(updatedHistory);
    localStorage.setItem('dailyJournalData', JSON.stringify(updatedHistory));
  }, [goals, diaryContent, mood, highlights, gratitude]);

  // Check for day change
  useEffect(() => {
    const interval = setInterval(() => {
      const today = new Date().toDateString();
      if (today !== currentDate) {
        setCurrentDate(today);
        // Reset for new day
        if (!historicalData[today]) {
          setGoals([]);
          setDiaryContent('');
          setHighlights([]);
          setGratitude([]);
          setMood('😊');
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [currentDate, historicalData]);

  const addGoal = () => {
    if (!newGoal.trim()) return;

    const goal: Goal = {
      id: Date.now().toString(),
      text: newGoal,
      completed: false,
      priority: goalPriority,
      category: goalCategory,
      createdAt: new Date().toISOString()
    };

    setGoals([...goals, goal]);
    setNewGoal('');
  };

  const toggleGoal = (id: string) => {
    setGoals(goals.map(g => 
      g.id === id ? { ...g, completed: !g.completed } : g
    ));
  };

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const startEditGoal = (goal: Goal) => {
    setEditingGoal(goal.id);
    setEditText(goal.text);
  };

  const saveEditGoal = () => {
    if (!editText.trim() || !editingGoal) return;
    
    setGoals(goals.map(g => 
      g.id === editingGoal ? { ...g, text: editText } : g
    ));
    setEditingGoal(null);
    setEditText('');
  };

  const addHighlight = () => {
    if (!newHighlight.trim()) return;
    setHighlights([...highlights, newHighlight]);
    setNewHighlight('');
  };

  const addGratitude = () => {
    if (!newGratitude.trim()) return;
    setGratitude([...gratitude, newGratitude]);
    setNewGratitude('');
  };

  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  const removeGratitude = (index: number) => {
    setGratitude(gratitude.filter((_, i) => i !== index));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'from-red-500 to-pink-500';
      case 'medium': return 'from-amber-500 to-orange-500';
      case 'low': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const completionPercentage = goals.length > 0 
    ? Math.round((goals.filter(g => g.completed).length / goals.length) * 100)
    : 0;

  const getStreakDays = () => {
    const dates = Object.keys(historicalData).sort().reverse();
    let streak = 0;
    const today = new Date();
    
    for (const date of dates) {
      const entryDate = new Date(date);
      const diffDays = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak && historicalData[date].totalGoals > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Book className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Daily Journal & Goals</h1>
                <p className="text-white/70 text-lg flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>{new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHistory(!showHistory)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2"
            >
              <Clock className="w-5 h-5" />
              <span>{showHistory ? 'Hide History' : 'View History'}</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{goals.filter(g => g.completed).length}/{goals.length}</p>
                <p className="text-white/70 text-sm">Goals Complete</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{completionPercentage}%</p>
                <p className="text-white/70 text-sm">Completion</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{getStreakDays()}</p>
                <p className="text-white/70 text-sm">Day Streak</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{mood}</p>
                <p className="text-white/70 text-sm">Today's Mood</p>
              </div>
            </div>
          </div>
        </div>

        {/* History View */}
        {showHistory && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 mb-10 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6">History</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.keys(historicalData).sort().reverse().map(date => {
                const data = historicalData[date];
                return (
                  <div key={date} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">{date}</h3>
                      <div className="flex items-center space-x-4 text-sm text-white/70">
                        <span>{data.completedCount}/{data.totalGoals} goals</span>
                        {data.diary && <span>{data.diary.mood}</span>}
                      </div>
                    </div>
                    {data.diary && data.diary.content && (
                      <p className="text-white/60 text-sm line-clamp-2">{data.diary.content}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Goals Section */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-white/20">
                <div className="flex items-center space-x-3 mb-4">
                  <Trophy className="w-6 h-6 text-amber-400" />
                  <h2 className="text-2xl font-bold text-white">Today's Goals</h2>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-white/70">Progress</span>
                    <span className="text-sm font-semibold text-white">{completionPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Add Goal Form */}
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                    placeholder="What do you want to achieve today?"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  <div className="flex items-center space-x-3">
                    <select
                      value={goalPriority}
                      onChange={(e) => setGoalPriority(e.target.value as any)}
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                    
                    <select
                      value={goalCategory}
                      onChange={(e) => setGoalCategory(e.target.value)}
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    
                    <button
                      onClick={addGoal}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Goals List */}
              <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                {goals.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-12 h-12 text-white/40 mx-auto mb-3" />
                    <p className="text-white/60">No goals yet. Add your first goal!</p>
                  </div>
                ) : (
                  goals.map((goal) => (
                    <div
                      key={goal.id}
                      className={`group flex items-center space-x-3 p-4 rounded-xl border transition-all duration-300 ${
                        goal.completed 
                          ? 'bg-emerald-500/10 border-emerald-500/30' 
                          : 'bg-white/5 border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <button
                        onClick={() => toggleGoal(goal.id)}
                        className="flex-shrink-0"
                      >
                        {goal.completed ? (
                          <CheckCircle className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <Circle className="w-6 h-6 text-white/40 hover:text-white/70" />
                        )}
                      </button>

                      {editingGoal === goal.id ? (
                        <div className="flex-1 flex items-center space-x-2">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && saveEditGoal()}
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                            autoFocus
                          />
                          <button
                            onClick={saveEditGoal}
                            className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingGoal(null)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <p className={`text-white ${goal.completed ? 'line-through opacity-60' : ''}`}>
                              {goal.text}
                            </p>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${getPriorityColor(goal.priority)}`}>
                                {goal.priority}
                              </span>
                              <span className="text-xs text-white/50">{goal.category}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEditGoal(goal)}
                              className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteGoal(goal.id)}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Diary Section */}
          <div className="space-y-6">
            {/* Mood Selector */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                <h2 className="text-2xl font-bold text-white">How are you feeling?</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {moods.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={`text-4xl p-3 rounded-xl transition-all duration-300 ${
                      mood === m 
                        ? 'bg-white/20 scale-110 shadow-lg' 
                        : 'bg-white/5 hover:bg-white/10 hover:scale-105'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Diary Entry */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <Book className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-white">Daily Reflection</h2>
              </div>
              <textarea
                value={diaryContent}
                onChange={(e) => setDiaryContent(e.target.value)}
                placeholder="Write about your day, thoughts, feelings, or anything on your mind..."
                className="w-full h-48 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
              <div className="mt-3 text-sm text-white/50">
                {diaryContent.length} characters
              </div>
            </div>

            {/* Highlights */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <Sun className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-bold text-white">Today's Highlights</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newHighlight}
                    onChange={(e) => setNewHighlight(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addHighlight()}
                    placeholder="What made today special?"
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-yellow-500"
                  />
                  <button
                    onClick={addHighlight}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-2 rounded-xl hover:from-yellow-600 hover:to-orange-600"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                      <span className="text-white/90">✨ {highlight}</span>
                      <button
                        onClick={() => removeHighlight(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gratitude */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <Heart className="w-6 h-6 text-pink-400" />
                <h2 className="text-xl font-bold text-white">Grateful For</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newGratitude}
                    onChange={(e) => setNewGratitude(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addGratitude()}
                    placeholder="What are you thankful for?"
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-pink-500"
                  />
                  <button
                    onClick={addGratitude}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-2 rounded-xl hover:from-pink-600 hover:to-rose-600"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {gratitude.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                      <span className="text-white/90">💖 {item}</span>
                      <button
                        onClick={() => removeGratitude(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}