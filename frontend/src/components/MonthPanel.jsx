import React from 'react';
import { useApp } from '../context/AppContext';
import { 
    getMonthName, 
    isSameDay, 
    isPastDate, 
    isPastMonth,
    generateMonthGrid
} from '../utils/date';
import GoalCard from './GoalCard';

export default function MonthPanel({ onOpenTaskModal }) {
    const {
        tasks,
        viewingMonth,
        setViewingMonth,
        setSelectedDate,
        setCurrentPanel
    } = useApp();

    const { year, month } = viewingMonth;

    const handlePrevMonth = () => {
        if (month === 0) {
            setViewingMonth({ year: year - 1, month: 11 });
        } else {
            setViewingMonth({ year, month: month - 1 });
        }
    };

    const handleNextMonth = () => {
        if (month === 11) {
            setViewingMonth({ year: year + 1, month: 0 });
        } else {
            setViewingMonth({ year, month: month + 1 });
        }
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

    // Render calendar days
    const renderCalendarDays = () => {
        const today = new Date();
        const grid = generateMonthGrid(year, month);

        return grid.map(cell => {
            const hasTasks = getDayActionCount(cell.dateKey) > 0;
            
            if (cell.type === 'prev' || cell.type === 'next') {
                return (
                    <div 
                        key={`${cell.type}-${cell.day}`} 
                        className={`calendar-day other-month ${hasTasks ? 'has-tasks' : ''}`}
                        onClick={() => handleDayClick(cell.dateKey)}
                    >
                        {cell.day}
                    </div>
                );
            }

            const isToday = isSameDay(new Date(year, month, cell.day), today);
            const isPast = isPastDate(year, month, cell.day);

            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            else if (isPast) classes += ' past';
            if (hasTasks) classes += ' has-tasks';

            return (
                <div 
                    key={`curr-${cell.day}`} 
                    className={classes}
                    onClick={() => handleDayClick(cell.dateKey)}
                >
                    {cell.day}
                </div>
            );
        });
    };

    const monthGoals = Object.values(tasks).filter(task =>
        task.level === 'month' && task.year === year && task.month === month
    );
    const isCurrentPastMonth = isPastMonth(year, month);

    return (
        <section id="month-panel" className="panel active">
            <div className="panel-content month-panel-content">
                <div className="date-selector-widget">
                    <button className="nav-arrow" onClick={handlePrevMonth}>◄</button>
                    <h1 id="month-title">{`${getMonthName(month)} ${year}`}</h1>
                    <button className="nav-arrow" onClick={handleNextMonth}>►</button>
                </div>

                {/* Calendar First */}
                <div className="month-calendar-section">
                    <div className="month-calendar">
                        <div className="calendar-weekdays">
                            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                        </div>
                        <div className="calendar-days">
                            {renderCalendarDays()}
                        </div>
                    </div>
                </div>

                {/* Monthly Goals Grid */}
                <div className="section month-goals-section">
                    <div className="section-header">
                        <h2>Monthly Goals</h2>
                        {!isCurrentPastMonth && (
                            <button className="btn-add" onClick={() => onOpenTaskModal('month')}>
                                <span className="icon">+</span> Add Goal
                            </button>
                        )}
                    </div>
                    <div className="month-goals-grid">
                        {monthGoals.map(goal => (
                            <GoalCard 
                                key={goal.id} 
                                task={goal} 
                                childLevel="day"
                                isPast={isCurrentPastMonth}
                                onAddSubtask={onOpenTaskModal}
                                onEditTask={onOpenTaskModal}
                            />
                        ))}
                        {monthGoals.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state-icon">🎯</div>
                                <div className="empty-state-text">No goals for this month</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
