import React from 'react';
import { useSettings } from '../context/SettingsContext';

const SETTING_SCHEMAS = [
    {
        key: 'highlightActiveTask',
        label: 'Highlight Active Task',
        description: 'Highlight tasks that match the current time'
    },
    {
        key: 'showActiveProgressBar',
        label: 'Show Progress Bar',
        description: 'Display progress bar on active tasks'
    },
    {
        key: 'showTimeRemaining',
        label: 'Show Time Remaining',
        description: 'Display countdown for active tasks'
    },
    {
        key: 'showEndTime',
        label: 'Show End Time',
        description: 'Display task end time (e.g., "6:00 PM - 7:30 PM")'
    },
    {
        key: 'showDuration',
        label: 'Show Duration',
        description: 'Display task duration (e.g., "30 min")'
    }
];

export default function SettingsModal({ isOpen, onClose }) {
    const { settings, updateSetting } = useSettings();

    if (!isOpen) return null;

    return (
        <div className="modal-overlay active" onClick={(e) => e.target.className.includes('modal-overlay') && onClose()}>
            <div className="modal settings-modal">
                <div className="modal-header">
                    <h3>Settings</h3>
                    <button className="modal-close" onClick={onClose}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6 6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div className="modal-body">
                    <div className="settings-group">
                        <div className="settings-group-title">Task Display</div>

                        {SETTING_SCHEMAS.map(({ key, label, description }) => (
                            <div key={key} className="setting-item">
                                <div className="setting-info">
                                    <div className="setting-label">{label}</div>
                                    <div className="setting-description">{description}</div>
                                </div>
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={!!settings[key]}
                                        onChange={(e) => updateSetting(key, e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
