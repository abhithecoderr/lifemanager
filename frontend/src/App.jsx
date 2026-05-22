import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SettingsProvider } from './context/SettingsContext';
import DayPanel from './components/DayPanel';
import MonthPanel from './components/MonthPanel';
import YearPanel from './components/YearPanel';
import LifePanel from './components/LifePanel';
import HistoryView from './components/HistoryView';
import TaskModal from './components/TaskModal';
import SettingsModal from './components/SettingsModal';

function MainAppContent() {
    const { 
        currentPanel, 
        setCurrentPanel, 
        rolloverTasks,
        loading 
    } = useApp();

    const [activeView, setActiveView] = useState('home'); // 'home' | 'analysis'
    const [currentTime, setCurrentTime] = useState('');
    
    // Modal states
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskModalConfig, setTaskModalConfig] = useState({
        level: 'day',
        editingTaskId: null,
        defaultParentId: null
    });
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    // Live clock update
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }));
        };
        updateClock();
        const interval = setInterval(updateClock, 60000);
        return () => clearInterval(interval);
    }, []);

    // Perform uncompleted daily tasks rollover on initial mount once loaded
    useEffect(() => {
        if (!loading) {
            rolloverTasks();
        }
    }, [loading, rolloverTasks]);

    const handleOpenTaskModal = (level, defaultParentId = null, editingTaskId = null) => {
        setTaskModalConfig({ level, defaultParentId, editingTaskId });
        setIsTaskModalOpen(true);
    };

    if (loading) {
        return (
            <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0b0d' }}>
                <div style={{ color: '#8d94a0', fontSize: '1.2rem', fontFamily: 'system-ui' }}>Loading LifeOwl...</div>
            </div>
        );
    }

    return (
        <div className="app-container">
            {/* Top Navigation */}
            <nav className="top-nav">
                <div className="nav-left">
                    <button 
                        className={`nav-icon-btn ${activeView === 'home' ? 'active' : ''}`} 
                        onClick={() => setActiveView('home')}
                        title="Home"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                    </button>
                    <button 
                        className={`nav-icon-btn ${activeView === 'analysis' ? 'active' : ''}`} 
                        onClick={() => setActiveView('analysis')}
                        title="Analysis"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                    </button>
                </div>

                <div className="nav-center">
                    {activeView === 'home' && (
                        <div className="timeframe-tabs">
                            {['day', 'month', 'year', 'life'].map(panel => (
                                <button 
                                    key={panel} 
                                    className={`timeframe-tab ${currentPanel === panel ? 'active' : ''}`}
                                    onClick={() => setCurrentPanel(panel)}
                                >
                                    {panel.charAt(0).toUpperCase() + panel.slice(1)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="nav-right">
                    <button className="nav-icon-btn btn-settings" onClick={() => setIsSettingsModalOpen(true)} title="Settings">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                    </button>
                </div>
            </nav>

            <main className="main-content">
                {/* Live Clock Display */}
                <div className="current-time-display">{currentTime}</div>

                {/* View Switching */}
                {activeView === 'analysis' ? (
                    <div id="analysis-view" className="view active">
                        <HistoryView />
                    </div>
                ) : (
                    <div id="home-view" className="view active">
                        {currentPanel === 'day' && <DayPanel onOpenTaskModal={handleOpenTaskModal} />}
                        {currentPanel === 'month' && <MonthPanel onOpenTaskModal={handleOpenTaskModal} />}
                        {currentPanel === 'year' && <YearPanel onOpenTaskModal={handleOpenTaskModal} />}
                        {currentPanel === 'life' && <LifePanel onOpenTaskModal={handleOpenTaskModal} />}
                    </div>
                )}
            </main>

            {/* Task Creation & Modification Modal */}
            <TaskModal 
                isOpen={isTaskModalOpen} 
                onClose={() => setIsTaskModalOpen(false)}
                level={taskModalConfig.level}
                defaultParentId={taskModalConfig.defaultParentId}
                editingTaskId={taskModalConfig.editingTaskId}
            />

            {/* Settings Management Modal */}
            <SettingsModal 
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />
        </div>
    );
}

export default function App() {
    return (
        <SettingsProvider>
            <AppProvider>
                <MainAppContent />
            </AppProvider>
        </SettingsProvider>
    );
}
