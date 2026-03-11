"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TAGS = [
  { id: 'trabalho', label: 'Trabalho', color: 'bg-indigo-500', hex: '#6366f1', textClass: 'text-indigo-400', borderClass: 'border-indigo-500/20', activeBorder: 'border-indigo-500/50', bgClass: 'bg-indigo-500/10' },
  { id: 'faculdade', label: 'Faculdade', color: 'bg-emerald-500', hex: '#10b981', textClass: 'text-emerald-400', borderClass: 'border-emerald-500/20', activeBorder: 'border-emerald-500/50', bgClass: 'bg-emerald-500/10' },
  { id: 'projetos', label: 'Projetos', color: 'bg-purple-500', hex: '#a855f7', textClass: 'text-purple-400', borderClass: 'border-purple-500/20', activeBorder: 'border-purple-500/50', bgClass: 'bg-purple-500/10' },
  { id: 'descompressao', label: 'Lazer', color: 'bg-orange-500', hex: '#f97316', textClass: 'text-orange-400', borderClass: 'border-orange-500/20', activeBorder: 'border-orange-500/50', bgClass: 'bg-orange-500/10' }
];

interface RecentTask {
  id: string;
  name: string;
  tagId: string;
  duration: number; // in seconds
}

interface TimelineLog {
  time: string; // "HH:00"
  [tagId: string]: string | number; // minutes per tag
}

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'timer' | 'dashboard'>('timer');
  const [taskName, setTaskName] = useState("");
  const [selectedTag, setSelectedTag] = useState(TAGS[0].id);
  const [activeTimer, setActiveTimer] = useState<string>('fluxo');
  const [isRunning, setIsRunning] = useState(false);
  
  // App state
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [timeInSeconds, setTimeInSeconds] = useState(0);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [timelineLogs, setTimelineLogs] = useState<TimelineLog[]>([]);

  // Hydrate data from the user's browser (Local Storage) on first load
  useEffect(() => {
    const today = new Date().toDateString();
    
    const storedDate = localStorage.getItem('rotina_lastDate');
    const storedTasks = localStorage.getItem('rotina_recentTasks');
    const storedTotal = localStorage.getItem('rotina_dailyTotal');
    const storedLogs = localStorage.getItem('rotina_timelineLogs');

    let parsedTasks: RecentTask[] = storedTasks ? JSON.parse(storedTasks) : [];

    // Is it still the same day?
    if (storedDate === today) {
      if (storedTotal) setDailyTotal(Number(storedTotal));
      if (storedLogs) setTimelineLogs(JSON.parse(storedLogs));
      setRecentTasks(parsedTasks);
    } else {
      // It's a new day: preserve the task labels but zero out the daily durations so you start fresh
      parsedTasks = parsedTasks.map((t) => ({ ...t, duration: 0 }));
      setRecentTasks(parsedTasks);
      setDailyTotal(0);
      setTimelineLogs([]);
      localStorage.setItem('rotina_lastDate', today);
    }
    
    setIsMounted(true);
  }, []);

  // Persist any time changes into Local Storage actively behind the scenes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('rotina_recentTasks', JSON.stringify(recentTasks));
      localStorage.setItem('rotina_dailyTotal', dailyTotal.toString());
      localStorage.setItem('rotina_timelineLogs', JSON.stringify(timelineLogs));
    }
  }, [recentTasks, dailyTotal, timelineLogs, isMounted]);

  // Remove the useEffect that auto-switched tabs. Instead, handle the switch below in toggleTimer.

  // Remove the useEffect that auto-reset time. Handled by activeTimer manually now.

  // Timer interval logic: Real-time accumulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        // Handle Countdown/Stopwatch display
        setTimeInSeconds((prev) => {
          if (activeTimer === 'fluxo') {
            return prev + 1;
          } else {
            if (prev <= 1) {
              setIsRunning(false);
              return 0; // timer finished
            }
            return prev - 1;
          }
        });
        
        setDailyTotal((prev) => prev + 1); // accumulate daily focus time
        
        // Add 1 second to the specific active task
        setRecentTasks(prevTasks => {
           return prevTasks.map(t => {
             if (t.name === taskName && t.tagId === selectedTag) {
               return { ...t, duration: t.duration + 1 };
             }
             return t;
           });
        });

        // Add 1 second (1/60th minute) to current Timeline Hour
        setTimelineLogs(prevLogs => {
           const now = new Date();
           const currentHourStr = `${now.getHours().toString().padStart(2, '0')}:00`;
           
           const existingHourIdx = prevLogs.findIndex(log => log.time === currentHourStr);
           const updatedLogs = [...prevLogs];
           
           if (existingHourIdx >= 0) {
              const currentMinutes = (updatedLogs[existingHourIdx][selectedTag] as number) || 0;
              updatedLogs[existingHourIdx] = {
                 ...updatedLogs[existingHourIdx],
                 [selectedTag]: currentMinutes + (1/60)
              };
           } else {
              // Create new hour block
              const newLog: TimelineLog = { time: currentHourStr };
              TAGS.forEach(t => newLog[t.id] = 0);
              newLog[selectedTag] = (1/60);
              updatedLogs.push(newLog);
           }
           
           // Sort strictly so the chart flows from morning to night
           return updatedLogs.sort((a, b) => a.time.localeCompare(b.time));
        });

      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, activeTimer, taskName, selectedTag]);

  const handleTimerChange = (timerId: string) => {
    if (isRunning) return;
    setActiveTimer(timerId);
    if (timerId === 'ignicao') setTimeInSeconds(10 * 60);
    else if (timerId === 'sprint') setTimeInSeconds(25 * 60);
    else setTimeInSeconds(0);
  };

  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      // Reset timer automatically on stop
      if (activeTimer === 'ignicao') setTimeInSeconds(10 * 60);
      else if (activeTimer === 'sprint') setTimeInSeconds(25 * 60);
      else setTimeInSeconds(0);
    } else {
      if (!taskName.trim()) return;
      
      const exists = recentTasks.find((t) => t.name === taskName && t.tagId === selectedTag);
      if (!exists) {
        setRecentTasks([{ id: Date.now().toString(), name: taskName, tagId: selectedTag, duration: 0 }, ...recentTasks].slice(0, 10));
      }
      setIsRunning(true);
      setActiveTab('timer'); // Force view map to timer
    }
  };

  const handleSelectRecent = (task: RecentTask) => {
    if (isRunning) return; // Prevent changing task while running
    setTaskName(task.name);
    setSelectedTag(task.tagId);
  };

  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleMoveTask = (id: string, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentTasks(prev => {
      const idx = prev.findIndex(t => t.id === id);
      if (idx === -1) return prev;
      
      const newTasks = [...prev];
      if (direction === 'up' && idx > 0) {
        [newTasks[idx - 1], newTasks[idx]] = [newTasks[idx], newTasks[idx - 1]];
      } else if (direction === 'down' && idx < prev.length - 1) {
        [newTasks[idx + 1], newTasks[idx]] = [newTasks[idx], newTasks[idx + 1]];
      }
      return newTasks;
    });
  };

  const currentTagConfig = TAGS.find(t => t.id === selectedTag) || TAGS[0];

  const formatTimeBig = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDailyTotal = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return { h, m };
  };

  const dailyFormatted = formatDailyTotal(dailyTotal);

  // Prevents Next.js Server-Side Hydration mismatches while loading the cached data
  // Must be placed after all React Hooks (useState/useEffect) to avoid violations
  if (!isMounted) return <div className="min-h-screen bg-[#09090b]"></div>;

  // --- Dashboard Data Preparation ---
  // Live grouping for Donut Chart
  const donutData = TAGS.map(tag => {
    const totalDuration = recentTasks
      .filter(t => t.tagId === tag.id)
      .reduce((sum, task) => sum + (task.duration || 0), 0);
    return { name: tag.label, value: totalDuration, fill: tag.hex, tagClass: tag.textClass };
  }).filter(d => d.value > 0);

  // Formatting strictly float minutes to integers for Bar Chart rendering
  const formattedTimelineData = timelineLogs.map(log => {
      const formattedLog: Record<string, string | number> = { time: log.time };
      TAGS.forEach(t => {
         formattedLog[t.label] = Math.max(1, Math.round(log[t.id] as number)); // Show at least 1m if there's any duration
         if ((log[t.id] as number) === 0) formattedLog[t.label] = 0;
      });
      return formattedLog;
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-200 flex flex-col items-center py-10 px-6 font-sans selection:bg-gray-800">
      
      {/* Top Navigation Tabs (Hidden when running) */}
      <div className={`w-full max-w-md flex justify-center mb-8 transition-opacity duration-500 ${isRunning ? 'opacity-0 pointer-events-none h-0 mb-0 overflow-hidden' : 'opacity-100'}`}>
        <div className="flex bg-[#121216]/80 p-1.5 rounded-2xl border border-white/[0.04]">
           <button 
             onClick={() => setActiveTab('timer')}
             className={`px-6 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === 'timer' ? 'bg-[#1e1e24] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
           >
             Timer
           </button>
           <button 
             onClick={() => setActiveTab('dashboard')}
             className={`px-6 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-[#1e1e24] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
           >
             Dashboard
           </button>
        </div>
      </div>

      {activeTab === 'timer' ? (
        <>
          {/* Header */}
          <header className={`w-full max-w-2xl mb-10 flex flex-col items-center transition-all duration-500 ${isRunning ? 'mt-12 scale-105' : 'mt-0'}`}>
            <h1 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.25em] mb-4">Visão Geral</h1>
            <p className="text-4xl font-light text-gray-100 flex items-baseline gap-2 tabular-nums">
              {dailyFormatted.h}h {dailyFormatted.m}m <span className="text-base font-normal text-gray-500 tracking-wide">focados hoje</span>
            </p>
          </header>

          {/* Main Focus Component */}
          <main className="w-full max-w-md flex flex-col items-center">
            <div className={`w-full flex flex-col gap-6 mb-10 p-6 rounded-[2rem] bg-[#121216]/80 border backdrop-blur-xl shadow-2xl transition-colors duration-500 ${isRunning ? 'border-indigo-500/10 shadow-indigo-500/5' : 'border-white/[0.04]'}`}>
              {/* Nova Tarefa & Tag Selector */}
              <div className="flex flex-col gap-5">
                <input 
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  disabled={isRunning}
                  placeholder="O que você vai focar agora?"
                  className={`w-full bg-[#09090b]/50 text-gray-100 placeholder-gray-600 rounded-2xl px-5 py-4 text-[15px] font-medium outline-none border transition-all shadow-inner ${taskName ? currentTagConfig.bgClass : ''} ${currentTagConfig.borderClass} focus:${currentTagConfig.activeBorder} ${isRunning ? 'opacity-40 cursor-not-allowed' : ''}`}
                />
                
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => !isRunning && setSelectedTag(tag.id)}
                      disabled={isRunning}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                        selectedTag === tag.id 
                          ? `${tag.bgClass} ${tag.textClass} border ${tag.activeBorder} shadow-sm` 
                          : 'text-gray-500 hover:bg-[#1a1a20] hover:text-gray-300 border border-transparent'
                      } ${isRunning ? (selectedTag !== tag.id ? 'opacity-20 cursor-not-allowed' : 'opacity-80 cursor-not-allowed') : ''}`}
                    >
                      <span className={`w-2 h-2 rounded-full shadow-sm ${tag.color} ${selectedTag === tag.id ? 'opacity-100' : 'opacity-50'}`}></span>
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Display */}
              <div className={`text-[6.5rem] leading-none font-extralight tabular-nums tracking-tighter py-4 flex justify-center drop-shadow-md transition-colors duration-300 ${isRunning ? 'text-white' : 'text-white/90'}`}>
                {formatTimeBig(timeInSeconds)}
              </div>
              
              {/* Timer Controls */}
              <div className="flex flex-col gap-4 w-full">
                <div className="flex gap-2 w-full p-1.5 bg-[#09090b]/80 rounded-2xl border border-white/[0.03]">
                  {[{ id: 'ignicao', label: 'Ignição (10m)' }, { id: 'fluxo', label: 'Fluxo' }, { id: 'sprint', label: 'Sprint (25m)' }].map((timer) => (
                    <button 
                      key={timer.id}
                      onClick={() => handleTimerChange(timer.id)}
                      disabled={isRunning}
                      className={`flex-1 py-3 px-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                        activeTimer === timer.id 
                          ? 'bg-[#1e1e24] text-gray-100 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-300'
                      } ${isRunning ? (activeTimer !== timer.id ? 'opacity-30 cursor-not-allowed' : 'opacity-80 cursor-not-allowed') : ''}`}
                    >
                      {timer.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={toggleTimer}
                  disabled={!taskName.trim() && !isRunning}
                  className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-[15px] font-bold transition-all duration-300 ${
                    isRunning
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 shadow-xl shadow-red-500/10'
                      : taskName.trim()
                      ? `${currentTagConfig.color} hover:brightness-110 text-white shadow-xl shadow-${currentTagConfig.color.replace('bg-', '')}/20`
                      : 'bg-[#1a1a20]/50 text-gray-600 cursor-not-allowed border border-white/[0.02]'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                      Parar Foco
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Começar Foco
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Histórico Recente */}
            {recentTasks.length > 0 && (
              <div className={`w-full flex flex-col gap-3 transition-opacity duration-500 ${isRunning ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] px-2 mb-1">Histórico Recente</h3>
                <div className="flex flex-col gap-2.5">
                  {recentTasks.map((task, index) => {
                    const tagConfig = TAGS.find(t => t.id === task.tagId) || TAGS[0];
                    return (
                      <div
                        key={task.id}
                        onClick={() => handleSelectRecent(task)}
                        className="group flex flex-col justify-center w-full p-4 rounded-2xl bg-[#121216]/60 border border-white/[0.04] hover:border-white/[0.1] hover:bg-[#16161a] transition-all cursor-pointer relative overflow-hidden"
                      >
                        <div className="flex justify-between items-center w-full">
                           <div className="flex items-center gap-3">
                              <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${tagConfig.color}`}></span>
                              <span className="text-[14px] font-medium text-gray-300 group-hover:text-white transition-colors">{task.name}</span>
                              {task.duration > 0 && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${tagConfig.borderClass} ${tagConfig.textClass}`}>
                                  {formatTimeBig(task.duration)}
                                </span>
                              )}
                           </div>
                           
                           {/* Default State: Tag Label */}
                           <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:opacity-0 transition-opacity duration-300 absolute right-4">
                             {tagConfig.label}
                           </span>

                           {/* Hover State: Actions */}
                           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute right-4 bg-[#16161a] pl-2 z-10">
                              <button 
                                onClick={(e) => handleMoveTask(task.id, 'up', e)}
                                disabled={index === 0}
                                className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Mover para cima"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                              </button>
                              <button 
                                onClick={(e) => handleMoveTask(task.id, 'down', e)}
                                disabled={index === recentTasks.length - 1}
                                className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Mover para baixo"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                              </button>
                              <div className="w-px h-4 bg-gray-800 mx-1"></div>
                              <button 
                                onClick={(e) => handleDeleteTask(task.id, e)}
                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Excluir"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                           </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </main>
        </>
      ) : (
        /* Dashboard View */
        <main className="w-full max-w-md flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
           {/* Dash Header */}
           <header className="w-full mb-10 mt-2 flex flex-col items-center">
            <h1 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.25em] mb-4">Total Focado Hoje</h1>
            <p className="text-5xl font-light text-white flex items-baseline gap-2 tabular-nums">
              {dailyFormatted.h}h {dailyFormatted.m}m
            </p>
          </header>

          <div className="w-full flex flex-col gap-6">
            {/* Donut Chart Card */}
            {donutData.length > 0 ? (
              <div className="w-full p-6 rounded-[2rem] bg-[#121216]/80 border border-white/[0.04] backdrop-blur-xl shadow-2xl flex flex-col items-center">
                 <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-6 w-full text-left">Distribuição</h3>
                 <div className="w-full h-48 relative">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {donutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a20', borderColor: '#27272a', borderRadius: '1rem', color: '#fff', fontSize: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                          itemStyle={{ color: '#e4e4e7' }}
                          formatter={(value: unknown) => {
                            const numValue = Number(value);
                            const h = Math.floor(numValue / 3600);
                            const m = Math.floor((numValue % 3600) / 60);
                            return [`${h}h ${m}m`, 'Tempo'];
                          }}
                        />
                      </PieChart>
                   </ResponsiveContainer>
                   {/* Center icon/text */}
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                      </svg>
                   </div>
                 </div>

                 {/* Legend */}
                 <div className="flex flex-wrap justify-center gap-4 mt-6 w-full">
                   {donutData.map((item, idx) => {
                     const h = Math.floor(item.value / 3600);
                     const m = Math.floor((item.value % 3600) / 60);
                     return (
                       <div key={idx} className="flex items-center gap-2">
                         <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.fill }}></span>
                         <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{item.name}</span>
                         <span className={`text-xs font-bold ${item.tagClass}`}>{h}h {m}m</span>
                       </div>
                     );
                   })}
                 </div>
              </div>
            ) : (
              <div className="w-full p-10 rounded-[2rem] bg-[#121216]/80 border border-white/[0.04] backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center text-center">
                 <svg className="w-12 h-12 text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <p className="text-sm font-medium text-gray-500">Nenhum tempo focado hoje.</p>
                 <p className="text-xs text-gray-600 mt-1">Sua distribuição aparecerá aqui.</p>
              </div>
            )}

            {/* Timeline Bar Chart Card */}
            {formattedTimelineData.length > 0 && (
              <div className="w-full p-6 pb-2 rounded-[2rem] bg-[#121216]/80 border border-white/[0.04] backdrop-blur-xl shadow-2xl flex flex-col items-center">
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-6 w-full text-left">Timeline de Foco</h3>
                <div className="w-full h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedTimelineData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <XAxis dataKey="time" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}m`} />
                      <Tooltip 
                          cursor={{fill: '#1a1a20'}}
                          contentStyle={{ backgroundColor: '#1a1a20', borderColor: '#27272a', borderRadius: '1rem', color: '#fff', fontSize: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                        />
                      <Bar dataKey="Trabalho" stackId="a" fill={TAGS[0].hex} radius={[0, 0, 4, 4]} maxBarSize={30} />
                      <Bar dataKey="Faculdade" stackId="a" fill={TAGS[1].hex} maxBarSize={30} />
                      <Bar dataKey="Projetos" stackId="a" fill={TAGS[2].hex} maxBarSize={30} />
                      <Bar dataKey="Lazer" stackId="a" fill={TAGS[3].hex} radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

    </div>
  );
}
