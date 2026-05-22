import React from 'react';
import { useApp } from '../context/AppContext';
import { 
    getShortMonthName, 
    isSameDay, 
    isPastDate, 
    isPastMonth,
    generateMonthGrid
} from '../utils/date';
import GoalCard from './GoalCard';

export default function YearPanel({ onOpenTaskModal }) {
    const {
        tasks,
        viewingYear,
        setViewingYear,
        setSelectedDate,
        setViewingMonth,
        setCurrentPanel
    } = useApp();

    const currentYear = new Date().getFullYear();
    const isPastYear = viewingYear < currentYear;

    const handlePrevYear = () => {
        setViewingYear(prev => prev - 1);
    };

    const handleNextYear = () => {
        setViewingYear(prev => prev + 1);
    };

    const getDayActionCount = (dateKey) => {
        return Object.values(tasks).filter(t => t.level === 'day' && t.date === dateKey).length;
    };

    const handleDayClick = (dateKey) => {
        const [y, m, d] = dateKey.split('-').map(Number);
        setSelectedDate(new Date(y, m - 1, d));
        setViewingMonth({ year: y, month: m - 1 });
        setCurrentPanel('day');
    };

    const renderMiniCalendarDays = (monthIndex) => {
        const today = new Date();
        const grid = generateMonthGrid(viewingYear, monthIndex);

        return grid.map(cell => {
            if (cell.type === 'prev' || cell.type === 'next') {
                return (
                    <div 
                        key={`${cell.type}-${cell.day}`} 
                        className="mini-day other-month"
                    ></div>
                );
            }

            const isToday = isSameDay(new Date(viewingYear, monthIndex, cell.day), today);
            const isPast = isPastDate(viewingYear, monthIndex, cell.day);
            const hasTasks = getDayActionCount(cell.dateKey) > 0;

            let classes = 'mini-day';
            if (isToday) classes += ' today';
            else if (isPast) classes += ' past';
            if (hasTasks) classes += ' has-tasks';

            return (
                <div 
                    key={`day-${cell.day}`} 
                    className={classes}
                    onClick={() => handleDayClick(cell.dateKey)}
                >
                    {cell.day}
                </div>
            );
        });
    };

    const yearGoals = Object.values(tasks).filter(task =>
        task.level === 'year' && task.year === viewingYear
    );

    const months = Array.from({ length: 12 }, (_, i) => i);
    const today = new Date();

    return (
        <section id="year-panel" className="panel active">
            <div className="panel-content year-panel-content">
                <div className="date-selector-widget">
                    <button className="nav-arrow" onClick={handlePrevYear}>◄</button>
                    <h1 id="year-title">{viewingYear}</h1>
                    <button className="nav-arrow" onClick={handleNextYear}>►</button>
                </div>

                {/* Side-by-Side Layout */}
                <div className="year-layout">
                    {/* Left: Mini Calendars */}
                    <div className="year-calendars-column">
                        <div className="year-mini-calendars">
                            {months.map(mIndex => {
                                const isCurrent = viewingYear === today.getFullYear() && mIndex === today.getMonth();
                                const isPastM = isPastMonth(viewingYear, mIndex);

                                let miniCalClass = 'mini-calendar';
                                if (isCurrent) miniCalClass += ' current-month';
                                else if (isPastM) miniCalClass += ' past-month';

                                return (
                                    <div key={mIndex} className={miniCalClass}>
                                        <div className="mini-calendar-header">{getShortMonthName(mIndex)}</div>
                                        <div className="mini-calendar-weekdays">
                                            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                                        </div>
                                        <div className="mini-calendar-days">
                                            {renderMiniCalendarDays(mIndex)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Yearly Goals */}
                    <div className="year-goals-column">
                        <div className="section year-goals-section">
                            <div className="section-header">
                                <h2>Yearly Goals</h2>
                                {!isPastYear && (
                                    <button className="btn-add" onClick={() => onOpenTaskModal('year')}>
                                        <span className="icon">+</span> Add Goal
                                    </button>
                                )}
                            </div>
                            <div className="year-goals-grid">
                                {yearGoals.map(goal => (
                                    <GoalCard 
                                        key={goal.id} 
                                        task={goal} 
                                        childLevel="month"
                                        isPast={isPastYear}
                                        onAddSubtask={onOpenTaskModal}
                                        onEditTask={onOpenTaskModal}
                                    />
                                ))}
                                {yearGoals.length === 0 && (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">🎯</div>
                                        <div className="empty-state-text">No yearly goals set</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
