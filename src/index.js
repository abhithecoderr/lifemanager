import { Hono } from 'hono';
import { Database } from './db.js';

const app = new Hono().basePath('/api');

// Request middleware to initialize database client
app.use('*', async (c, next) => {
  if (!c.env.DB) {
    return c.json({ error: 'Database D1 binding "DB" not found in environment context' }, 500);
  }
  c.set('db', new Database(c.env.DB));
  await next();
});

// GET /api/tasks
app.get('/tasks', async (c) => {
  try {
    const db = c.get('db');
    const tasks = await db.getTasks();
    return c.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return c.json({ error: 'Failed to fetch tasks' }, 500);
  }
});

// POST /api/tasks
app.post('/tasks', async (c) => {
  try {
    const db = c.get('db');
    const taskData = await c.req.json();
    const inserted = await db.insertTask(taskData);
    return c.json(inserted, 201);
  } catch (error) {
    console.error('Error creating task:', error);
    return c.json({ error: 'Failed to create task' }, 500);
  }
});

// PUT /api/tasks/:id
app.put('/tasks/:id', async (c) => {
  try {
    const db = c.get('db');
    const { id } = c.req.param();
    const updates = await c.req.json();
    delete updates.id;
    delete updates._id;

    const task = await db.updateTask(id, updates);
    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }
    return c.json({ success: true, task });
  } catch (error) {
    console.error('Error updating task:', error);
    return c.json({ error: 'Failed to update task' }, 500);
  }
});

// DELETE /api/tasks/:id
app.delete('/tasks/:id', async (c) => {
  try {
    const db = c.get('db');
    const { id } = c.req.param();
    await db.deleteTaskAndChildren(id);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return c.json({ error: 'Failed to delete task' }, 500);
  }
});

// PUT /api/tasks (bulk update / rollover)
app.put('/tasks', async (c) => {
  try {
    const db = c.get('db');
    const tasks = await c.req.json();
    await db.bulkUpdateTasks(tasks);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error bulk updating tasks:', error);
    return c.json({ error: 'Failed to update tasks' }, 500);
  }
});

// GET /api/notes/:dateKey
app.get('/notes/:dateKey', async (c) => {
  try {
    const db = c.get('db');
    const { dateKey } = c.req.param();
    const notes = await db.getNotes(dateKey);
    return c.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return c.json({ error: 'Failed to fetch notes' }, 500);
  }
});

// PUT /api/notes/:dateKey
app.put('/notes/:dateKey', async (c) => {
  try {
    const db = c.get('db');
    const { dateKey } = c.req.param();
    const { type, text } = await c.req.json();

    if (!type || !['reflection', 'doneNotes'].includes(type)) {
      return c.json({ error: 'Invalid note type' }, 400);
    }

    await db.saveNote(dateKey, type, text);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error saving notes:', error);
    return c.json({ error: 'Failed to save notes' }, 500);
  }
});

// POST /api/history
app.post('/history', async (c) => {
  try {
    const db = c.get('db');
    const entry = await c.req.json();
    await db.logHistory(entry);
    return c.json({ success: true }, 201);
  } catch (error) {
    console.error('Error logging history:', error);
    return c.json({ error: 'Failed to log history' }, 500);
  }
});

// DELETE /api/history/task/:taskId
app.delete('/history/task/:taskId', async (c) => {
  try {
    const db = c.get('db');
    const { taskId } = c.req.param();
    const deleted = await db.deleteHistory(taskId);
    return c.json({ success: true, deleted });
  } catch (error) {
    console.error('Error deleting history entry:', error);
    return c.json({ error: 'Failed to delete history entry' }, 500);
  }
});

// GET /api/history
app.get('/history', async (c) => {
  try {
    const db = c.get('db');
    const { date, startDate, endDate, taskLevel, limit } = c.req.query();
    const entries = await db.getHistory({ date, startDate, endDate, taskLevel, limit });
    return c.json(entries);
  } catch (error) {
    console.error('Error fetching history:', error);
    return c.json({ error: 'Failed to fetch history' }, 500);
  }
});

// GET /api/history/summary/:date
app.get('/history/summary/:date', async (c) => {
  try {
    const db = c.get('db');
    const { date } = c.req.param();
    const summary = await db.getHistorySummary(date);
    return c.json(summary);
  } catch (error) {
    console.error('Error fetching summary:', error);
    return c.json({ error: 'Failed to fetch summary' }, 500);
  }
});

export default app;
