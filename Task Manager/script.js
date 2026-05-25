/* ============================================================
   StudyFlow – Smart Task Manager  |  script.js
   ============================================================ */

// ── State ──────────────────────────────────────────────────
let tasks = [];           // Array of task objects
let currentFilter = 'all'; // 'all' | 'pending' | 'completed'

// ── On Page Load ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();   // Load saved tasks
  loadTheme();         // Restore dark/light mode
  renderTasks();       // Draw the task list
  updateStats();       // Refresh statistics

  // Allow pressing Enter in the input field to add a task
  document.getElementById('taskInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask();
  });
});

// ── Add Task ───────────────────────────────────────────────
function addTask() {
  const input    = document.getElementById('taskInput');
  const category = document.getElementById('categorySelect').value;
  const priority = document.getElementById('prioritySelect').value;
  const name     = input.value.trim();

  // Validate: don't add empty tasks
  if (!name) {
    input.focus();
    input.classList.add('border-danger');
    setTimeout(() => input.classList.remove('border-danger'), 1500);
    return;
  }

  // Build task object
  const task = {
    id:        Date.now(),               // Unique ID based on timestamp
    name:      name,
    category:  category,
    priority:  priority,
    completed: false,
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  tasks.push(task);         // Add to array
  saveToStorage();          // Persist to localStorage
  renderTasks();            // Re-draw list
  updateStats();            // Update stats & progress bar

  input.value = '';         // Clear input
  input.focus();

  showToast('✅ Task added successfully!', 'bg-primary');
}

// ── Toggle Complete ─────────────────────────────────────────
function toggleComplete(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveToStorage();
    renderTasks();
    updateStats();

    const msg = task.completed ? '🎉 Task marked as done!' : '🔄 Task marked as pending.';
    showToast(msg, task.completed ? 'bg-success' : 'bg-secondary');
  }
}

// ── Delete Task ─────────────────────────────────────────────
function deleteTask(id) {
  // Animate the item out before removing
  const el = document.getElementById('task-' + id);
  if (el) {
    el.classList.add('removing');
    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== id);
      saveToStorage();
      renderTasks();
      updateStats();
    }, 280); // Match CSS animation duration
  }
  showToast('🗑️ Task deleted.', 'bg-danger');
}

// ── Clear Completed ─────────────────────────────────────────
function clearCompleted() {
  const count = tasks.filter(t => t.completed).length;
  if (count === 0) {
    showToast('ℹ️ No completed tasks to clear.', 'bg-secondary');
    return;
  }
  tasks = tasks.filter(t => !t.completed);
  saveToStorage();
  renderTasks();
  updateStats();
  showToast(`🧹 Cleared ${count} completed task(s).`, 'bg-warning');
}

// ── Filter Tasks ────────────────────────────────────────────
function filterTasks(type, btn) {
  currentFilter = type;

  // Update active button styling
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  renderTasks();
}

// ── Render Task List ────────────────────────────────────────
function renderTasks() {
  const list       = document.getElementById('taskList');
  const emptyState = document.getElementById('emptyState');

  // Apply current filter
  let visible = tasks;
  if (currentFilter === 'pending')   visible = tasks.filter(t => !t.completed);
  if (currentFilter === 'completed') visible = tasks.filter(t => t.completed);

  // Show empty state when nothing to display
  if (visible.length === 0) {
    list.innerHTML = '';
    emptyState.classList.add('visible');
    return;
  }
  emptyState.classList.remove('visible');

  // Build HTML for each visible task
  list.innerHTML = visible.map(task => buildTaskHTML(task)).join('');
}

// ── Build Single Task HTML ──────────────────────────────────
function buildTaskHTML(task) {
  const completedClass = task.completed ? 'completed' : '';
  const checked        = task.completed ? 'checked' : '';
  const priorityClass  = `badge-priority-${task.priority}`;

  return `
    <div class="task-item ${completedClass}" id="task-${task.id}">

      <!-- Checkbox to toggle completion -->
      <input
        type="checkbox"
        class="task-checkbox"
        ${checked}
        onchange="toggleComplete(${task.id})"
        title="Mark as ${task.completed ? 'pending' : 'complete'}"
      />

      <!-- Task details -->
      <div class="task-body">
        <div class="task-name">${escapeHTML(task.name)}</div>
        <div class="task-meta">
          <span class="badge-cat">${task.category}</span>
          <span class="badge-cat ${priorityClass}">${task.priority}</span>
          <span class="task-time"><i class="bi bi-clock me-1"></i>${task.createdAt}</span>
        </div>
      </div>

      <!-- Delete button -->
      <div class="task-actions">
        <button class="btn-icon btn-icon-del" onclick="deleteTask(${task.id})" title="Delete task">
          <i class="bi bi-trash3-fill"></i>
        </button>
      </div>

    </div>
  `;
}

// ── Update Stats & Progress Bar ─────────────────────────────
function updateStats() {
  const total   = tasks.length;
  const done    = tasks.filter(t => t.completed).length;
  const pending = total - done;
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;

  // Update stat cards
  document.getElementById('statTotal').textContent   = total;
  document.getElementById('statDone').textContent    = done;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statPercent').textContent = pct + '%';

  // Update progress bar
  const bar = document.getElementById('progressBar');
  bar.style.width         = pct + '%';
  bar.setAttribute('aria-valuenow', pct);

  // Update progress percentage label
  document.getElementById('progressPct').textContent = pct + '%';

  // Update navbar badge
  document.getElementById('navCount').textContent = total;
}

// ── Toast Notification ──────────────────────────────────────
function showToast(message, bgClass = 'bg-primary') {
  const toastEl  = document.getElementById('liveToast');
  const toastMsg = document.getElementById('toastMsg');

  // Remove previous color classes then add new one
  toastEl.className = 'toast align-items-center border-0 text-white ' + bgClass;
  toastMsg.textContent = message;

  // Show using Bootstrap's Toast API
  const toast = new bootstrap.Toast(toastEl, { delay: 2800 });
  toast.show();
}

// ── Dark Mode Toggle ────────────────────────────────────────
document.getElementById('darkToggle').addEventListener('click', () => {
  const html     = document.documentElement;
  const isDark   = html.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';

  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('sf-theme', newTheme);

  // Swap icon
  const icon = document.getElementById('darkIcon');
  icon.className = isDark ? 'bi bi-moon-stars-fill' : 'bi bi-sun-fill';
});

// ── Persist Theme on Load ───────────────────────────────────
function loadTheme() {
  const saved = localStorage.getItem('sf-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);

  const icon = document.getElementById('darkIcon');
  icon.className = saved === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
}

// ── localStorage Helpers ────────────────────────────────────
function saveToStorage() {
  localStorage.setItem('sf-tasks', JSON.stringify(tasks));
}

function loadFromStorage() {
  const saved = localStorage.getItem('sf-tasks');
  tasks = saved ? JSON.parse(saved) : [];
}

// ── Security: Escape HTML in user input ────────────────────
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}