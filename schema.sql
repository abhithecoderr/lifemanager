-- Create Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    level TEXT NOT NULL CHECK(level IN ('life', 'year', 'month', 'day')),
    parentId TEXT DEFAULT NULL,
    year INTEGER DEFAULT NULL,
    month INTEGER DEFAULT NULL,
    date TEXT DEFAULT NULL,
    originalDate TEXT DEFAULT NULL,
    done INTEGER DEFAULT 0 CHECK(done IN (0, 1)),
    priority INTEGER DEFAULT 0 CHECK(priority IN (0, 1)),
    startTime TEXT DEFAULT NULL,
    duration INTEGER DEFAULT NULL,
    sortOrder INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_parentId ON tasks(parentId);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);

-- Create Notes Table
CREATE TABLE IF NOT EXISTS notes (
    dateKey TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('reflection', 'doneNotes')),
    text TEXT NOT NULL DEFAULT '',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (dateKey, type)
);

-- Create History Table
CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    taskId TEXT NOT NULL,
    taskText TEXT NOT NULL,
    taskPath TEXT NOT NULL, -- JSON stringified array of task text hierarchy e.g. '["Level 1", "Level 2"]'
    taskLevel TEXT NOT NULL CHECK(taskLevel IN ('life', 'year', 'month', 'day')),
    action TEXT NOT NULL,
    scheduledDate TEXT DEFAULT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    time TEXT NOT NULL, -- 12-hour format e.g. "5:30 PM"
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_history_date ON history(date);
CREATE INDEX IF NOT EXISTS idx_history_taskId ON history(taskId);
