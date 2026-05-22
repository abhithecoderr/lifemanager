import React, { useState, useEffect } from 'react';
import { useApp, formatDateKey } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
    getDayName, 
    getMonthName, 
    isSameDay, 
} from '../utils/date';
import { 
    formatTime12h, 
    calculateEndTime, 
    formatDurationReadable, 
    formatRemainingTime, 
    timeToMinutes 
} from '../utils/time';

export default function DayPanel({ onOpenTaskModal }) {
    const {
        tasks,
        reflections,
        doneNotes,
        selectedDate,
        setSelectedDate,
        toggleTask,
        deleteTask,
        updateTask,
        updateTaskOrders,
        saveReflection,
        saveDoneNotes,
        loadNotesForDate
    } = useApp();

    const { settings } = useSettings();

    const dateKey = formatDateKey(selectedDate);
    const isToday = isSameDay(selectedDate, new Date());
    const isPast = !isToday && selectedDate < new Date().setHours(0, 0, 0, 0);

    // Auto-save notes states
    const [localDoneNotes, setLocalDoneNotes] = useState('');
    const [localReflection, setLocalReflection] = useState('');
    const [ticker, setTicker] = useState(Date.now());

    // Update notes when selectedDate or notes change
    useEffect(() => {
        loadNotesForDate(dateKey);
    }, [selectedDate, loadNotesForDate, dateKey]);

    useEffect(() => {
        setLocalDoneNotes(doneNotes[dateKey] || '');
        setLocalReflection(reflections[dateKey] || '');
    }, [doneNotes, reflections, dateKey]);

    // Debounced Done Notes saving
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localDoneNotes !== (doneNotes[dateKey] || '')) {
                saveDoneNotes(dateKey, localDoneNotes);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [localDoneNotes, dateKey, doneNotes, saveDoneNotes]);

    // Debounced Reflections saving
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localReflection !== (reflections[dateKey] || '')) {
                saveReflection(dateKey, localReflection);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [localReflection, dateKey, reflections, saveReflection]);

    // Time ticker for active progress updates
    useEffect(() => {
        const interval = setInterval(() => setTicker(Date.now()), 15000);
        return () => clearInterval(interval);
    }, []);

    const handlePrevDay = () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() - 1);
        setSelectedDate(next);
    };

    const handleNextDay = () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        setSelectedDate(next);
    };

    const handleUnschedule = async (taskId) => {
        await updateTask(taskId, { date: null });
    };

    // Filter and sort actions
    const getActions = () => {
        let list;
        if (isPast) {
            list = Object.values(tasks).filter(task =>
                task.level === 'day' && (task.originalDate === dateKey || task.date === dateKey)
            );
        } else {
            list = Object.values(tasks).filter(task =>
                task.level === 'day' && task.date === dateKey && !task.done
            );
        }

        // Sort: scheduled by startTime first, then by sortOrder
        return list.sort((a, b) => {
            if (a.startTime && !b.startTime) return -1;
            if (!a.startTime && b.startTime) return 1;
            if (a.startTime && b.startTime) {
                return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
            }
            return (a.sortOrder || 0) - (b.sortOrder || 0);
        });
    };

    const actionsToShow = getActions();
    const completedTasks = Object.values(tasks).filter(t => t.level === 'day' && t.date === dateKey && t.done);

    // Grouping: Identify root day actions vs nested day actions
    const rootActions = [];
    const nestedByParent = {};

    actionsToShow.forEach(action => {
        if (action.parentId) {
            const parent = tasks[action.parentId];
            if (parent && parent.level === 'day') {
                if (!nestedByParent[action.parentId]) nestedByParent[action.parentId] = [];
                nestedByParent[action.parentId].push(action);
            } else {
                rootActions.push(action);
            }
        } else {
            rootActions.push(action);
        }
    });

    // Group roots by parent Monthly Goal or Standalone
    const groupedRoots = {};
    const standalone = [];

    rootActions.forEach(action => {
        if (action.parentId) {
            const parent = tasks[action.parentId];
            const parentName = parent ? parent.text : 'Unknown Goal';
            if (!groupedRoots[action.parentId]) {
                groupedRoots[action.parentId] = { name: parentName, actions: [] };
            }
            groupedRoots[action.parentId].actions.push(action);
        } else {
            standalone.push(action);
        }
    });

    // Compute the visual list of all root-level actions in exact rendering order
    const visualRootActions = [];
    Object.values(groupedRoots).forEach(group => {
        visualRootActions.push(...group.actions);
    });
    visualRootActions.push(...standalone);

    const onDragEnd = async (result) => {
        if (!result.destination) return;
        const sourceIndex = result.source.index;
        const destIndex = result.destination.index;
        if (sourceIndex === destIndex) return;

        const reordered = Array.from(visualRootActions);
        const [removed] = reordered.splice(sourceIndex, 1);
        reordered.splice(destIndex, 0, removed);

        // Update sortOrder for all root items in this list to match their new indexes
        const taskOrders = reordered.map((item, index) => ({
            id: item.id,
            sortOrder: index
        }));

        await updateTaskOrders(taskOrders);
    };

    const renderActionItem = (action, isRoot = false, index = null) => {
        const isHighPriority = action.priority === 1;
        let timeHtml = null;
        let isActive = false;
        let progressPercent = 0;

        const showProgressBar = settings.showActiveProgressBar ?? false;
        const showTimeRemaining = settings.showTimeRemaining ?? false;
        const showEndTime = settings.showEndTime ?? true;
        const showDuration = settings.showDuration ?? false;
        const highlightActiveTask = settings.highlightActiveTask ?? true;

        if (action.startTime && !action.done) {
            const now = new Date();
            const currentMins = now.getHours() * 60 + now.getMinutes();
            const startMins = timeToMinutes(action.startTime);
            const endMins = startMins + (action.duration || 0);
            let minsLeft = 0;

            if (currentMins >= startMins && currentMins < endMins) {
                isActive = true;
                progressPercent = ((currentMins - startMins) / action.duration) * 100;
                minsLeft = endMins - currentMins;
            }

            const start12 = formatTime12h(action.startTime);
            let timeString = start12;

            if (action.duration) {
                const end24 = calculateEndTime(action.startTime, action.duration);
                const end12 = formatTime12h(end24);

                let durationText = '';
                if (showDuration) {
                    if (isActive && showTimeRemaining) {
                        durationText = formatRemainingTime(minsLeft);
                    } else {
                        durationText = formatDurationReadable(action.duration);
                    }
                }

                if (showEndTime) {
                    timeString = `${start12} - ${end12}`;
                    if (durationText) {
                        timeString += ` (${durationText.replace(/[()]/g, '')})`;
                    }
                } else if (durationText) {
                    timeString = `${start12} ${durationText}`;
                }
            }

            timeHtml = <div className="action-time-display" dangerouslySetInnerHTML={{ __html: timeString }}></div>;
        }

        const children = nestedByParent[action.id] || [];
        const canUnschedule = action.parentId && tasks[action.parentId]?.level === 'month';

        const renderContent = (provided, snapshot) => (
            <div 
                ref={provided?.innerRef}
                {...provided?.draggableProps}
                className={`action-item-container ${snapshot?.isDragging ? 'dragging' : ''}`} 
                data-id={action.id}
            >
                <div className={`action-item ${action.done ? 'done' : ''} ${isHighPriority ? 'high-priority' : ''} ${isActive && highlightActiveTask ? 'is-active' : ''}`} data-id={action.id}>
                    {isActive && showProgressBar && (
                        <div className="active-progress-bar" style={{ width: `${progressPercent}%` }}></div>
                    )}
                    <span 
                        className="drag-handle" 
                        title="Drag to reorder"
                        {...provided?.dragHandleProps}
                    >
                        ⋮⋮
                    </span>
                    <div 
                        className={`action-checkbox ${action.done ? 'checked' : ''} ${isPast ? 'disabled' : ''}`}
                        onClick={() => !isPast && toggleTask(action.id)}
                    ></div>
                    <div className="action-content">
                        <span className="action-text">{action.text}</span>
                    </div>
                    {timeHtml}
                    <button className="action-add-subtask" onClick={() => onOpenTaskModal('day', action.id)} title="Add sub-task">+</button>
                    <button className="action-edit" onClick={() => onOpenTaskModal('day', action.parentId, action.id)} title="Edit task">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                        </svg>
                    </button>
                    {canUnschedule ? (
                        <button className="action-unschedule" onClick={() => handleUnschedule(action.id)} title="Unschedule from today">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6 6 18M6 6l12 12"/>
                            </svg>
                        </button>
                    ) : (
                        <button className="action-delete" onClick={() => deleteTask(action.id)} title="Delete task">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6 6 18M6 6l12 12"/>
                            </svg>
                        </button>
                    )}
                </div>
                {children.length > 0 && (
                    <div className="action-children">
                        {children.map(child => renderActionItem(child, false))}
                    </div>
                )}
            </div>
        );

        if (isRoot && !isPast) {
            return (
                <Draggable key={action.id} draggableId={action.id} index={index}>
                    {(provided, snapshot) => renderContent(provided, snapshot)}
                </Draggable>
            );
        } else {
            const mockProvided = {
                innerRef: null,
                draggableProps: {},
                dragHandleProps: {}
            };
            return (
                <div key={action.id}>
                    {renderContent(mockProvided, { isDragging: false })}
                </div>
            );
        }
    };

    return (
        <section id="day-panel" className="panel active">
            <div className="panel-content">
                <div className="date-selector-widget">
                    <button className="nav-arrow" onClick={handlePrevDay}>◄</button>
                    <h1 id="day-title">
                        {`${getDayName(selectedDate)}, ${getMonthName(selectedDate.getMonth())} ${selectedDate.getDate()}`}
                        {isToday && <span className="today-tag">Today</span>}
                    </h1>
                    <button className="nav-arrow" onClick={handleNextDay}>►</button>
                </div>

                <div className="section">
                    <div className="section-header">
                        <h2>Today's Actions</h2>
                        {!isPast && (
                            <button className="btn-add" onClick={() => onOpenTaskModal('day')}>
                                <span className="icon">+</span> Add
                            </button>
                        )}
                    </div>
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="day-actions">
                            {(provided) => (
                                <div 
                                    id="day-actions-container"
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                >
                                    {/* Grouped root actions (from goals) */}
                                    {Object.entries(groupedRoots).map(([parentId, group]) => (
                                        <div key={parentId} className="day-group">
                                            <div className="day-group-header">↳ {group.name}</div>
                                            {group.actions.map(action => renderActionItem(action, true, visualRootActions.indexOf(action)))}
                                        </div>
                                    ))}

                                    {/* Standalone roots */}
                                    {standalone.length > 0 && (
                                        <div className="standalone-section">
                                            <div className="standalone-header">Standalone</div>
                                            {standalone.map(action => renderActionItem(action, true, visualRootActions.indexOf(action)))}
                                        </div>
                                    )}

                                    {actionsToShow.length === 0 && (
                                        <div className="empty-state">
                                            <div className="empty-state-icon">📝</div>
                                            <div className="empty-state-text">No pending actions</div>
                                        </div>
                                    )}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>

                <div className="section">
                    <h2>What Got Done</h2>
                    <div id="done-tasks-container">
                        {completedTasks.length > 0 && (
                            <div className="done-tasks-list">
                                {completedTasks.map(task => {
                                    // Get parent label
                                    const parentTask = task.parentId ? tasks[task.parentId] : null;
                                    return (
                                        <div key={task.id} className="done-task-item" data-id={task.id}>
                                            <div className="done-task-left">
                                                <span className="checkmark">✓</span>
                                                <div className="done-task-content">
                                                    {parentTask && <span className="done-task-parent">{parentTask.text}</span>}
                                                    <span className="done-text">{task.text}</span>
                                                </div>
                                            </div>
                                            <button className="done-task-undo" onClick={() => toggleTask(task.id)} title="Move back to pending">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M18 6 6 18M6 6l12 12"/>
                                                </svg>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <textarea 
                        className="notes-textarea" 
                        placeholder="Any additional notes about what you accomplished..."
                        value={localDoneNotes}
                        onChange={(e) => setLocalDoneNotes(e.target.value)}
                    ></textarea>
                </div>

                <div className="section">
                    <h2>Reflect</h2>
                    <textarea 
                        className="notes-textarea" 
                        placeholder="How do you feel about today?"
                        value={localReflection}
                        onChange={(e) => setLocalReflection(e.target.value)}
                    ></textarea>
                </div>
            </div>
        </section>
    );
}
