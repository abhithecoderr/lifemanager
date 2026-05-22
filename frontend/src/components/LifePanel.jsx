import React from 'react';
import { useApp } from '../context/AppContext';
import GoalCard from './GoalCard';

export default function LifePanel({ onOpenTaskModal }) {
    const {
        tasks,
        setViewingYear,
        setCurrentPanel
    } = useApp();

    const getYearsWithData = () => {
        const years = new Set();
        Object.values(tasks).forEach(task => {
            if (task.year) years.add(task.year);
        });
        years.add(new Date().getFullYear());
        return Array.from(years).sort((a, b) => b - a);
    };

    const handleYearClick = (year) => {
        setViewingYear(year);
        setCurrentPanel('year');
    };

    const lifeGoals = Object.values(tasks).filter(t => t.level === 'life');
    const years = getYearsWithData();

    return (
        <section id="life-panel" className="panel active">
            <div className="panel-content">
                <div className="date-selector-widget static">
                    <h1>Life Overview</h1>
                </div>

                <div className="section">
                    <div className="section-header">
                        <h2>Life Goals</h2>
                        <button className="btn-add" onClick={() => onOpenTaskModal('life')}>
                            <span className="icon">+</span> Add Vision
                        </button>
                    </div>
                    <div id="life-goals-container">
                        {lifeGoals.map(goal => (
                            <GoalCard 
                                key={goal.id} 
                                task={goal} 
                                childLevel="year"
                                isPast={false}
                                onAddSubtask={onOpenTaskModal}
                                onEditTask={onOpenTaskModal}
                            />
                        ))}
                        {lifeGoals.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state-icon">🌟</div>
                                <div className="empty-state-text">No life visions set yet</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="section">
                    <h2>Years Overview</h2>
                    <div id="life-years-container">
                        {years.map(year => {
                            const yearGoals = Object.values(tasks).filter(g => g.level === 'year' && g.year === year);
                            const totalGoals = yearGoals.length;
                            const doneGoals = yearGoals.filter(g => g.done).length;

                            return (
                                <div 
                                    key={year} 
                                    className="life-year-card" 
                                    onClick={() => handleYearClick(year)}
                                >
                                    <div className="life-year-header">
                                        <span className="life-year-name">{year}</span>
                                        <span className="life-year-stats">
                                            <span>{doneGoals}</span>/{totalGoals} goals
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
