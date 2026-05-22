export class Database {
  constructor(d1) {
    this.db = d1;
  }

  // Tasks
  async getTasks() {
    const { results } = await this.db.prepare('SELECT * FROM tasks ORDER BY sortOrder ASC').all();
    return results.map(t => ({
      ...t,
      done: t.done === 1,
      priority: t.priority === 1,
      parentId: t.parentId || null,
      year: t.year !== null ? Number(t.year) : null,
      month: t.month !== null ? Number(t.month) : null,
      duration: t.duration !== null ? Number(t.duration) : null
    }));
  }

  async insertTask(task) {
    const query = `
      INSERT INTO tasks (
        id, text, level, parentId, year, month, date, originalDate, done, priority, startTime, duration, sortOrder
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await this.db.prepare(query).bind(
      task.id,
      task.text,
      task.level,
      task.parentId || null,
      task.year !== undefined ? task.year : null,
      task.month !== undefined ? task.month : null,
      task.date || null,
      task.originalDate || null,
      task.done ? 1 : 0,
      task.priority ? 1 : 0,
      task.startTime || null,
      task.duration !== undefined ? task.duration : null,
      task.sortOrder || 0
    ).run();

    return {
      ...task,
      done: !!task.done,
      priority: !!task.priority
    };
  }

  async updateTask(id, updates) {
    const keys = Object.keys(updates);
    if (keys.length === 0) return null;

    const setClauses = [];
    const values = [];
    for (const key of keys) {
      setClauses.push(`${key} = ?`);
      let val = updates[key];
      if (key === 'done' || key === 'priority') {
        val = val ? 1 : 0;
      }
      values.push(val === undefined ? null : val);
    }
    values.push(id);

    const query = `UPDATE tasks SET ${setClauses.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
    await this.db.prepare(query).bind(...values).run();

    const updated = await this.db.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();
    if (!updated) return null;
    return {
      ...updated,
      done: updated.done === 1,
      priority: updated.priority === 1,
      parentId: updated.parentId || null,
      year: updated.year !== null ? Number(updated.year) : null,
      month: updated.month !== null ? Number(updated.month) : null,
      duration: updated.duration !== null ? Number(updated.duration) : null
    };
  }

  async deleteTaskAndChildren(id) {
    const toDelete = [id];
    let index = 0;
    while (index < toDelete.length) {
      const currentId = toDelete[index];
      const { results } = await this.db.prepare('SELECT id FROM tasks WHERE parentId = ?').bind(currentId).all();
      for (const row of results) {
        toDelete.push(row.id);
      }
      index++;
    }

    const statements = toDelete.map(taskId => 
      this.db.prepare('DELETE FROM tasks WHERE id = ?').bind(taskId)
    );
    await this.db.batch(statements);
    return true;
  }

  async bulkUpdateTasks(tasks) {
    const statements = tasks.map(task => {
      const setClauses = [];
      const values = [];
      if (task.date !== undefined) {
        setClauses.push('date = ?');
        values.push(task.date);
      }
      if (task.originalDate !== undefined) {
        setClauses.push('originalDate = ?');
        values.push(task.originalDate);
      }
      if (task.sortOrder !== undefined) {
        setClauses.push('sortOrder = ?');
        values.push(task.sortOrder);
      }
      values.push(task.id);
      return this.db.prepare(`UPDATE tasks SET ${setClauses.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`).bind(...values);
    });

    if (statements.length > 0) {
      await this.db.batch(statements);
    }
    return true;
  }

  // Notes
  async getNotes(dateKey) {
    const { results } = await this.db.prepare('SELECT * FROM notes WHERE dateKey = ?').bind(dateKey).all();
    const result = {
      reflection: '',
      doneNotes: ''
    };
    results.forEach(note => {
      if (note.type === 'reflection') {
        result.reflection = note.text;
      } else if (note.type === 'doneNotes') {
        result.doneNotes = note.text;
      }
    });
    return result;
  }

  async saveNote(dateKey, type, text) {
    if (text && text.trim()) {
      await this.db.prepare(
        'INSERT OR REPLACE INTO notes (dateKey, type, text, updatedAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
      ).bind(dateKey, type, text.trim()).run();
    } else {
      await this.db.prepare('DELETE FROM notes WHERE dateKey = ? AND type = ?').bind(dateKey, type).run();
    }
    return true;
  }

  // History
  async logHistory(entry) {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const query = `
      INSERT INTO history (taskId, taskText, taskPath, taskLevel, action, scheduledDate, date, time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await this.db.prepare(query).bind(
      entry.taskId,
      entry.taskText,
      JSON.stringify(entry.taskPath || [entry.taskText]),
      entry.taskLevel,
      entry.action,
      entry.scheduledDate || null,
      date,
      time
    ).run();
    return true;
  }

  async deleteHistory(taskId) {
    const recent = await this.db.prepare(
      "SELECT id FROM history WHERE taskId = ? AND action = 'completed' ORDER BY id DESC LIMIT 1"
    ).bind(taskId).first();

    if (recent) {
      await this.db.prepare('DELETE FROM history WHERE id = ?').bind(recent.id).run();
      return true;
    }
    return false;
  }

  async getHistory(filters = {}) {
    let query = "SELECT * FROM history WHERE action = 'completed'";
    const params = [];

    if (filters.date) {
      query += " AND date = ?";
      params.push(filters.date);
    }
    if (filters.startDate && filters.endDate) {
      query += " AND date >= ? AND date <= ?";
      params.push(filters.startDate, filters.endDate);
    }
    if (filters.taskLevel) {
      query += " AND taskLevel = ?";
      params.push(filters.taskLevel);
    }

    const limit = parseInt(filters.limit) || 100;
    query += " ORDER BY id DESC LIMIT ?";
    params.push(limit);

    const { results } = await this.db.prepare(query).bind(...params).all();
    return results.map(row => ({
      ...row,
      taskPath: JSON.parse(row.taskPath)
    }));
  }

  async getHistorySummary(date) {
    const completions = await this.db.prepare(
      "SELECT COUNT(*) as count FROM history WHERE date = ? AND action = 'completed'"
    ).bind(date).first();

    const { results } = await this.db.prepare(
      "SELECT * FROM history WHERE date = ? AND action = 'completed'"
    ).bind(date).all();

    const byHour = {};
    const formattedEntries = results.map(row => {
      const parsedPath = JSON.parse(row.taskPath);
      const hour = row.time ? row.time.split(':')[0] : '00';
      byHour[hour] = (byHour[hour] || 0) + 1;
      return {
        ...row,
        taskPath: parsedPath
      };
    });

    return {
      date,
      completedCount: completions ? completions.count : 0,
      completionsByHour: byHour,
      entries: formattedEntries
    };
  }
}
