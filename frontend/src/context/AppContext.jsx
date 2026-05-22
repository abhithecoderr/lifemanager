import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

const AppContext = createContext();

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function formatDateKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function AppProvider({ children }) {
    const [tasks, setTasks] = useState({});
    const [reflections, setReflections] = useState({});
    const [doneNotes, setDoneNotes] = useState({});
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewingMonth, setViewingMonth] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth()
    });
    const [viewingYear, setViewingYear] = useState(new Date().getFullYear());
    const [currentPanel, setCurrentPanel] = useState('day');
    const [loading, setLoading] = useState(true);

    // Load all tasks from backend
    const loadTasks = useCallback(async () => {
        try {
            const tasksRes = await fetch(`${API_BASE}/tasks`);
            const tasksList = await tasksRes.json();
            const tasksMap = {};
            tasksList.forEach(task => {
                tasksMap[task.id] = task;
            });
            setTasks(tasksMap);
        } catch (error) {
            console.error('Failed to load tasks:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    // Load notes for a specific date
    const loadNotesForDate = useCallback(async (dateKey) => {
        try {
            const res = await fetch(`${API_BASE}/notes/${dateKey}`);
            const notes = await res.json();
            setReflections(prev => ({ ...prev, [dateKey]: notes.reflection || '' }));
            setDoneNotes(prev => ({ ...prev, [dateKey]: notes.doneNotes || '' }));
        } catch (error) {
            console.error('Failed to load notes:', error);
        }
    }, []);

    // Save reflection
    const saveReflection = useCallback(async (dateKey, text) => {
        setReflections(prev => {
            const next = { ...prev };
            if (text.trim()) {
                next[dateKey] = text;
            } else {
                delete next[dateKey];
            }
            return next;
        });

        try {
            await fetch(`${API_BASE}/notes/${dateKey}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'reflection', text })
            });
        } catch (error) {
            console.error('Failed to save reflection:', error);
        }
    }, []);

    // Save done notes
    const saveDoneNotes = useCallback(async (dateKey, text) => {
        setDoneNotes(prev => {
            const next = { ...prev };
            if (text.trim()) {
                next[dateKey] = text;
            } else {
                delete next[dateKey];
            }
            return next;
        });

        try {
            await fetch(`${API_BASE}/notes/${dateKey}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'doneNotes', text })
            });
        } catch (error) {
            console.error('Failed to save done notes:', error);
        }
    }, []);

    // Create task
    const createTask = useCallback(async (text, level, timeframe, extra = {}) => {
        const task = {
            id: generateId(),
            text: text,
            level: level,
            parentId: extra.parentId || null,
            year: timeframe.year || null,
            month: timeframe.month !== undefined ? timeframe.month : null,
            date: timeframe.date || null,
            done: false,
            createdAt: Date.now(),
            priority: extra.priority || 0,
            startTime: extra.startTime || null,
            duration: extra.duration || null,
            sortOrder: extra.sortOrder || 0
        };

        setTasks(prev => ({ ...prev, [task.id]: task }));

        try {
            await fetch(`${API_BASE}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(task)
            });
        } catch (error) {
            console.error('Failed to save task:', error);
        }

        return task;
    }, []);

    // Update single task
    const updateTask = useCallback(async (taskId, updates) => {
        setTasks(prev => {
            if (!prev[taskId]) return prev;
            return {
                ...prev,
                [taskId]: { ...prev[taskId], ...updates }
            };
        });

        try {
            await fetch(`${API_BASE}/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    }, []);

    // Delete task (and local children)
    const deleteTask = useCallback(async (taskId) => {
        // Find recursive children locally to clean state
        const getChildrenRecursive = (id) => {
            let kids = Object.values(tasks).filter(t => t.parentId === id);
            let all = [...kids];
            kids.forEach(k => {
                all = [...all, ...getChildrenRecursive(k.id)];
            });
            return all;
        };

        const childrenToDelete = getChildrenRecursive(taskId);
        
        setTasks(prev => {
            const next = { ...prev };
            delete next[taskId];
            childrenToDelete.forEach(c => delete next[c.id]);
            return next;
        });

        try {
            await fetch(`${API_BASE}/tasks/${taskId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    }, [tasks]);

    // Update multiple task orders
    const updateTaskOrders = useCallback(async (taskOrders) => {
        setTasks(prev => {
            const next = { ...prev };
            taskOrders.forEach(({ id, sortOrder }) => {
                if (next[id]) {
                    next[id] = { ...next[id], sortOrder };
                }
            });
            return next;
        });

        try {
            await fetch(`${API_BASE}/tasks`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskOrders)
            });
        } catch (error) {
            console.error('Failed to update task orders:', error);
        }
    }, []);

    // Get helper function for task path (hierarchical)
    const getTaskPath = useCallback((taskId) => {
        const path = [];
        let currentId = taskId;

        while (currentId) {
            const task = tasks[currentId];
            if (!task) break;
            path.unshift(task.text);
            currentId = task.parentId;
        }
        return path;
    }, [tasks]);

    // Log history helper
    const logHistory = useCallback(async (task, action) => {
        try {
            const path = getTaskPath(task.id);
            await fetch(`${API_BASE}/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId: task.id,
                    taskText: task.text,
                    taskPath: path,
                    taskLevel: task.level,
                    action: action,
                    scheduledDate: task.date || null
                })
            });
        } catch (error) {
            console.error('Failed to log history:', error);
        }
    }, [getTaskPath]);

    // Toggle task checkbox
    const toggleTask = useCallback(async (taskId) => {
        const task = tasks[taskId];
        if (!task) return;

        const nextDone = !task.done;
        await updateTask(taskId, { done: nextDone });

        if (nextDone) {
            await logHistory(task, 'completed');
        } else {
            try {
                await fetch(`${API_BASE}/history/task/${taskId}`, {
                    method: 'DELETE'
                });
            } catch (error) {
                console.error('Failed to remove history entry:', error);
            }
        }
    }, [tasks, updateTask, logHistory]);

    // Rollover uncompleted tasks
    const rolloverTasks = useCallback(async () => {
        const currentKey = formatDateKey(selectedDate);
        const tasksToRollover = [];

        Object.values(tasks).forEach(task => {
            if (task.level === 'day' && !task.done && task.date < currentKey) {
                const originalDate = task.originalDate || task.date;
                tasksToRollover.push({ id: task.id, date: currentKey, originalDate });
            }
        });

        if (tasksToRollover.length > 0) {
            setTasks(prev => {
                const next = { ...prev };
                tasksToRollover.forEach(({ id, date, originalDate }) => {
                    if (next[id]) {
                        next[id] = { ...next[id], date, originalDate };
                    }
                });
                return next;
            });

            try {
                await fetch(`${API_BASE}/tasks`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(tasksToRollover)
                });
                console.log(`Rolled over ${tasksToRollover.length} tasks to ${currentKey}`);
            } catch (error) {
                console.error('Failed to rollover tasks:', error);
            }
        }
    }, [tasks, selectedDate]);

    return (
        <AppContext.Provider value={{
            tasks,
            reflections,
            doneNotes,
            selectedDate,
            setSelectedDate,
            viewingMonth,
            setViewingMonth,
            viewingYear,
            setViewingYear,
            currentPanel,
            setCurrentPanel,
            loading,
            loadTasks,
            loadNotesForDate,
            saveReflection,
            saveDoneNotes,
            createTask,
            updateTask,
            deleteTask,
            updateTaskOrders,
            toggleTask,
            rolloverTasks,
            getTaskPath
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    return useContext(AppContext);
}
