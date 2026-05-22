import React, { useState, useEffect } from 'react';
import { useApp, formatDateKey } from '../context/AppContext';
import { time24ToParts, partsToTime24 } from '../utils/time';

export default function TaskModal({ isOpen, onClose, level, editingTaskId, defaultParentId }) {
    const { 
        tasks, 
        selectedDate, 
        viewingMonth, 
        viewingYear, 
        currentPanel,
        createTask, 
        updateTask 
    } = useApp();

    const [text, setText] = useState('');
    const [priority, setPriority] = useState(0);
    const [parentId, setParentId] = useState('');
    
    // Time states
    const [startHour, setStartHour] = useState('');
    const [startMin, setStartMin] = useState('00');
    const [startAmpm, setStartAmpm] = useState('AM');
    const [duration, setDuration] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        if (editingTaskId && tasks[editingTaskId]) {
            const task = tasks[editingTaskId];
            setText(task.text || '');
            setPriority(task.priority || 0);
            setParentId(task.parentId || '');

            const { h, m, p } = time24ToParts(task.startTime);
            setStartHour(h || '');
            setStartMin(m || '00');
            setStartAmpm(p || 'AM');
            setDuration(task.duration || '');
        } else {
            setText('');
            setPriority(0);
            setParentId(defaultParentId || '');

            // Default time to current rounded time
            const now = new Date();
            let hours = now.getHours();
            const minutes = now.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            
            const roundedMin = Math.round(minutes / 5) * 5;
            const minStr = String(roundedMin === 60 ? 0 : roundedMin).padStart(2, '0');

            setStartHour(String(hours));
            setStartMin(minStr);
            setStartAmpm(ampm);
            setDuration('');
        }
    }, [isOpen, editingTaskId, defaultParentId, tasks]);

    if (!isOpen) return null;

    // Helpers to populate parents selector
    const getParentOptions = () => {
        if (level === 'day') {
            const dateKey = formatDateKey(selectedDate);
            const dayActions = Object.values(tasks).filter(t => t.level === 'day' && t.date === dateKey && t.id !== editingTaskId);
            const monthGoals = Object.values(tasks).filter(t => t.level === 'month' && t.year === viewingMonth.year && t.month === viewingMonth.month);

            return [
                ...dayActions.map(a => ({ id: a.id, label: `[Action] ${a.text}` })),
                ...monthGoals.map(g => ({ id: g.id, label: `[Goal] ${g.text}` }))
            ];
        }
        if (level === 'month') {
            const yearGoals = Object.values(tasks).filter(t => t.level === 'year' && t.year === viewingMonth.year);
            return yearGoals.map(g => ({ id: g.id, label: g.text }));
        }
        if (level === 'year') {
            const lifeGoals = Object.values(tasks).filter(t => t.level === 'life');
            return lifeGoals.map(g => ({ id: g.id, label: g.text }));
        }
        return [];
    };

    // Suggestions backlog (only for uncompleted day tasks belonging to current month goals with no date set)
    const getSuggestions = () => {
        if (level !== 'day' || editingTaskId) return [];
        const monthGoals = Object.values(tasks).filter(t => t.level === 'month' && t.year === viewingMonth.year && t.month === viewingMonth.month);
        const goalIds = monthGoals.map(g => g.id);

        return Object.values(tasks).filter(task =>
            task.level === 'day' &&
            task.parentId &&
            goalIds.includes(task.parentId) &&
            !task.date &&
            !task.done
        );
    };

    const handleConfirm = async () => {
        if (!text.trim()) return;

        const startTime = partsToTime24(startHour, startMin, startAmpm);
        const finalDuration = parseInt(duration) || null;

        let timeframe = {};
        switch (level) {
            case 'life':
                timeframe = {};
                break;
            case 'year':
                timeframe = { year: viewingYear };
                break;
            case 'month':
                timeframe = { year: viewingMonth.year, month: viewingMonth.month };
                break;
            case 'day':
                if (currentPanel === 'month') {
                    timeframe = {
                        year: viewingMonth.year,
                        month: viewingMonth.month,
                        date: null
                    };
                } else {
                    const dateKey = formatDateKey(selectedDate);
                    timeframe = {
                        year: selectedDate.getFullYear(),
                        month: selectedDate.getMonth(),
                        date: dateKey
                    };
                }
                break;
        }

        if (editingTaskId) {
            await updateTask(editingTaskId, {
                text: text.trim(),
                parentId: parentId || null,
                priority,
                startTime,
                duration: finalDuration
            });
        } else {
            await createTask(text.trim(), level, timeframe, {
                parentId: parentId || null,
                priority,
                startTime,
                duration: finalDuration
            });
        }

        onClose();
    };

    const handleClearTime = () => {
        setStartHour('');
        setStartMin('00');
        setStartAmpm('AM');
        setDuration('');
    };

    const handleSuggestionClick = async (suggestionId) => {
        const dateKey = formatDateKey(selectedDate);
        await updateTask(suggestionId, { date: dateKey });
        onClose();
    };

    const actionLabel = editingTaskId ? 'Edit' : 'Add';
    const levelLabels = { life: 'Life Vision', year: 'Yearly Goal', month: 'Monthly Goal', day: 'Daily Action' };
    const modalTitle = `${actionLabel} ${levelLabels[level] || 'Task'}`;

    const parentOptions = getParentOptions();
    const suggestions = getSuggestions();

    const hoursOptions = ["12", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
    const minsOptions = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

    return (
        <div className="modal-overlay active" onClick={(e) => e.target.className.includes('modal-overlay') && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h3>{modalTitle}</h3>
                    <button className="modal-close" onClick={onClose}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6 6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div className="modal-body">
                    <input 
                        type="text" 
                        className="task-input" 
                        placeholder="What do you want to accomplish?"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
                        autoFocus
                    />

                    <div className="modal-row">
                        <div className="input-group">
                            <label>Priority</label>
                            <select value={priority} onChange={(e) => setPriority(parseInt(e.target.value))}>
                                <option value="0">Normal</option>
                                <option value="1">High Priority</option>
                            </select>
                        </div>

                        {level === 'day' && (
                            <div className="modal-row-inner" style={{ display: 'flex' }}>
                                <div className="input-group">
                                    <label>Start Time</label>
                                    <div className="time-picker-custom">
                                        <select value={startHour} onChange={(e) => setStartHour(e.target.value)} title="Hour">
                                            <option value="">Time</option>
                                            {hoursOptions.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                        <select value={startMin} onChange={(e) => setStartMin(e.target.value)} title="Minutes">
                                            {minsOptions.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                        <select value={startAmpm} onChange={(e) => setStartAmpm(e.target.value)} title="AM/PM">
                                            <option value="AM">AM</option>
                                            <option value="PM">PM</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>Duration (min)</label>
                                    <input 
                                        type="number" 
                                        placeholder="30"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                    />
                                </div>
                                <button type="button" className="btn-clear-time" onClick={handleClearTime} title="Remove scheduled time">
                                    ✕ Clear
                                </button>
                            </div>
                        )}
                    </div>

                    {suggestions.length > 0 && (
                        <div className="suggestion-selector show">
                            <label>Available Goal Actions</label>
                            <div className="suggestion-list">
                                {suggestions.map(s => {
                                    const parent = tasks[s.parentId];
                                    return (
                                        <div 
                                            key={s.id} 
                                            className="suggestion-item" 
                                            onClick={() => handleSuggestionClick(s.id)}
                                        >
                                            <div className="suggestion-item-content">
                                                <div className="suggestion-item-text">{s.text}</div>
                                                <div className="suggestion-item-parent">↳ {parent ? parent.text : 'Goal'}</div>
                                            </div>
                                            <span className="suggestion-item-plus">+</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {level !== 'life' && (
                        <div className="parent-selector show">
                            <label>Link to parent goal (optional):</label>
                            <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
                                <option value="">— Standalone —</option>
                                {parentOptions.map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-confirm" onClick={handleConfirm}>
                        {editingTaskId ? 'Update' : 'Add'}
                    </button>
                </div>
            </div>
        </div>
    );
}
