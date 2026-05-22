import React from 'react';
import { useApp } from '../context/AppContext';

export default function GoalCard({ 
    task, 
    childLevel, 
    isPast, 
    onAddSubtask, 
    onEditTask, 
    isNested = false, 
    depth = 0 
}) {
    const { tasks, toggleTask, deleteTask } = useApp();

    const getChildren = (parentId) => {
        return Object.values(tasks).filter(t => t.parentId === parentId);
    };

    const getProgress = (taskId) => {
        const children = getChildren(taskId);
        if (children.length === 0) return null;
        const done = children.filter(c => c.done).length;
        return Math.round((done / children.length) * 100);
    };

    const handleCheckboxClick = async (e, id) => {
        e.stopPropagation();
        await toggleTask(id);
    };

    const handleDeleteClick = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this goal and all its sub-tasks?")) {
            await deleteTask(id);
        }
    };

    const handleEditClick = (e, id) => {
        e.stopPropagation();
        onEditTask(task.level, task.parentId, id);
    };

    const children = getChildren(task.id);
    const progress = getProgress(task.id);

    return (
        <div className={`goal-card ${isNested ? 'nested' : ''} ${task.done ? 'done' : ''}`} data-id={task.id}>
            <div className="goal-header">
                <div 
                    className={`goal-checkbox ${task.done ? 'checked' : ''}`}
                    onClick={(e) => handleCheckboxClick(e, task.id)}
                ></div>
                <div className="goal-content">
                    <div className="goal-text">{task.text}</div>
                    
                    {/* Render Meta details: progress bar for root cards, simple text stats for nested ones */}
                    {isNested ? (
                        children.length > 0 && (
                            <div className="goal-meta">
                                {progress !== null && <span className="nested-progress">{progress}%</span>}
                                <span>{children.length} sub-tasks</span>
                            </div>
                        )
                    ) : (
                        <div className="goal-meta">
                            {progress !== null && (
                                <div className="goal-progress">
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <span className="progress-text">{progress}%</span>
                                </div>
                            )}
                            <span>{children.length} sub-tasks</span>
                        </div>
                    )}
                </div>
                
                <div className="goal-actions">
                    {!isNested && (
                        <button className="goal-action-btn edit" onClick={(e) => handleEditClick(e, task.id)} title="Edit goal">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                            </svg>
                        </button>
                    )}
                    <button className="goal-action-btn delete" onClick={(e) => handleDeleteClick(e, task.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6 6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Recursively render nested child GoalCards */}
            {children.length > 0 && (
                <div className={`goal-children depth-${depth}`}>
                    {children.map(child => (
                        <GoalCard 
                            key={child.id} 
                            task={child} 
                            childLevel={childLevel}
                            isPast={isPast}
                            onAddSubtask={onAddSubtask}
                            onEditTask={onEditTask}
                            isNested={true}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}

            {childLevel && !isPast && !isNested && (
                <button className="add-subtask-btn" onClick={() => onAddSubtask(childLevel, task.id)}>
                    + Add {childLevel} action
                </button>
            )}
        </div>
    );
}
