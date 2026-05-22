import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

export default function HistoryView() {
    const [history, setHistory] = useState([]);
    const [notesByDate, setNotesByDate] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const loadHistory = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const res = await fetch(`${API_BASE}/history?limit=50`);
            const historyList = await res.json();
            setHistory(historyList);

            if (historyList.length > 0) {
                // Group by date
                const uniqueDates = Array.from(new Set(historyList.map(entry => entry.date)));
                
                // Load notes for each date
                const promises = uniqueDates.map(async (date) => {
                    try {
                        const notesRes = await fetch(`${API_BASE}/notes/${date}`);
                        const notes = await notesRes.json();
                        return { date, notes };
                    } catch {
                        return { date, notes: {} };
                    }
                });

                const results = await Promise.all(promises);
                const notesMap = {};
                results.forEach(({ date, notes }) => {
                    notesMap[date] = notes;
                });
                setNotesByDate(notesMap);
            }
        } catch (err) {
            console.error('Failed to load history:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    // Group entries by date
    const grouped = {};
    history.forEach(entry => {
        if (!grouped[entry.date]) grouped[entry.date] = [];
        grouped[entry.date].push(entry);
    });

    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    return (
        <div className="panel-content">
            <div className="date-selector-widget static">
                <h1>Completion History</h1>
            </div>

            <div className="section">
                {!loading && !error && (
                    <div className="section-header">
                        <h2>Recent Activity</h2>
                        <button className="btn-add" onClick={loadHistory}>
                            <span className="icon">↻</span> Refresh
                        </button>
                    </div>
                )}

                <div id="history-container" className="history-list">
                    {loading && (
                        <div className="empty-state">
                            <div className="empty-state-icon">⏳</div>
                            <div className="empty-state-text">Loading history...</div>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="empty-state">
                            <div className="empty-state-icon">❌</div>
                            <div className="empty-state-text">Failed to load history</div>
                        </div>
                    )}

                    {!loading && !error && history.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon">📜</div>
                            <div className="empty-state-text">
                                No completion history yet.<br/>Start completing tasks to see them here!
                            </div>
                        </div>
                    )}

                    {!loading && !error && history.length > 0 && sortedDates.map(date => {
                        const entries = grouped[date];
                        const notes = notesByDate[date] || {};
                        const dateObj = new Date(date + 'T00:00:00');
                        const dateLabel = dateObj.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric'
                        });

                        const hasNotes = notes.doneNotes || notes.reflection;

                        return (
                            <div key={date} className="history-date-group">
                                <div className="history-date-header">
                                    <span className="history-date">{dateLabel}</span>
                                    <span className="history-count">{entries.length} completed</span>
                                </div>
                                <div className="history-entries">
                                    {entries.map(entry => {
                                        const parentPath = entry.taskPath && entry.taskPath.length > 1
                                            ? entry.taskPath.slice(0, -1).join(' › ') + ' › '
                                            : '';

                                        return (
                                            <div key={entry._id || entry.id} className="history-entry">
                                                <span className="history-time">{entry.time || ''}</span>
                                                <span className="history-checkmark">✓</span>
                                                <span className="history-text">
                                                    {parentPath && <span className="history-path">{parentPath}</span>}
                                                    {entry.taskText}
                                                </span>
                                                <span className="history-level">{entry.taskLevel}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                {hasNotes && (
                                    <div className="history-notes">
                                        {notes.doneNotes && (
                                            <div className="history-note-section">
                                                <div className="history-note-label">📝 What Got Done</div>
                                                <div className="history-note-content">{notes.doneNotes}</div>
                                            </div>
                                        )}
                                        {notes.reflection && (
                                            <div className="history-note-section">
                                                <div className="history-note-label">💭 Reflection</div>
                                                <div className="history-note-content">{notes.reflection}</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
