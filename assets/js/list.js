const taskListEl = document.getElementById('task-list');
const emptyStateEl = document.getElementById('empty-state');
const taskForm = document.getElementById('task-form');
const taskModalEl = document.getElementById('task-modal');
const taskModal = new bootstrap.Modal(taskModalEl);
const taskModalTitle = document.getElementById('task-modal-title');

async function loadTasks() {
    const tasks = await fetchTasks();
    renderTasks(tasks);
}

function renderTasks(tasks) {
    taskListEl.innerHTML = '';
    emptyStateEl.hidden = tasks.length > 0;

    tasks.forEach((task) => {
        taskListEl.appendChild(buildTaskCard(task));
    });
}

function buildTaskCard(task) {
    const li = document.createElement('li');
    li.className = `list-group-item task-card d-flex align-items-start gap-3 ${task.status === 'concluida' ? 'concluida' : ''}`;
    li.dataset.priority = task.priority;

    const dueDateHtml = task.due_date
        ? `<span class="badge text-bg-secondary">${formatDueDate(task.due_date)}${task.due_time ? ' ' + task.due_time.slice(0, 5) : ''}</span>`
        : '';

    const reminderHtml = task.reminder_amount
        ? `<span class="badge text-bg-secondary">🔔 ${task.reminder_amount} ${task.reminder_unit} antes</span>`
        : '';

    li.innerHTML = `
        <button class="btn btn-sm btn-outline-secondary rounded-circle checkbox-round p-0" data-action="toggle" data-id="${task.id}" data-status="${task.status}"></button>
        <div class="flex-grow-1" style="min-width:0;" data-action="edit" data-id="${task.id}">
            <div class="task-title">${escapeHtml(task.title)}</div>
            ${task.description ? `<div class="text-secondary small mt-1">${escapeHtml(task.description)}</div>` : ''}
            <div class="d-flex gap-2 mt-2 flex-wrap">
                <span class="badge text-bg-secondary">${PRIORITY_LABELS[task.priority]}</span>
                ${dueDateHtml}
                ${reminderHtml}
            </div>
        </div>
        <button class="btn btn-sm btn-link text-secondary" data-action="delete" data-id="${task.id}">&times;</button>
    `;

    return li;
}

taskListEl.addEventListener('click', async (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const id = Number(target.dataset.id);

    if (action === 'toggle') {
        await toggleTaskStatus(id, target.dataset.status);
        loadTasks();
    }

    if (action === 'delete') {
        if (!confirm('Excluir esta tarefa?')) return;
        await deleteTask(id);
        loadTasks();
    }

    if (action === 'edit') {
        openEditModal(id);
    }
});

async function openEditModal(id) {
    const tasks = await fetchTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    taskModalTitle.textContent = 'Editar tarefa';
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-due-date').value = task.due_date || '';
    document.getElementById('task-due-time').value = task.due_time ? task.due_time.slice(0, 5) : '';

    const reminderToggle = document.getElementById('task-reminder-toggle');
    reminderToggle.checked = !!task.reminder_amount;
    document.getElementById('task-reminder-fields').hidden = !task.reminder_amount;
    document.getElementById('task-reminder-amount').value = task.reminder_amount || 30;
    document.getElementById('task-reminder-unit').value = task.reminder_unit || 'minutos';

    taskModal.show();
}

document.getElementById('task-reminder-toggle').addEventListener('change', (e) => {
    document.getElementById('task-reminder-fields').hidden = !e.target.checked;
});

document.getElementById('add-task-btn').addEventListener('click', () => {
    taskForm.reset();
    document.getElementById('task-id').value = '';
    document.getElementById('task-reminder-fields').hidden = true;
    taskModalTitle.textContent = 'Nova tarefa';
});

taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('task-id').value;
    const reminderOn = document.getElementById('task-reminder-toggle').checked;

    const payload = {
        title: document.getElementById('task-title').value.trim(),
        description: document.getElementById('task-description').value.trim(),
        priority: document.getElementById('task-priority').value,
        due_date: document.getElementById('task-due-date').value,
        due_time: document.getElementById('task-due-time').value,
        reminder_amount: reminderOn ? Number(document.getElementById('task-reminder-amount').value) : null,
        reminder_unit: reminderOn ? document.getElementById('task-reminder-unit').value : null,
    };

    if (id) {
        payload.id = Number(id);
        await fetch(`${API_BASE}/tasks.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } else {
        await fetch(`${API_BASE}/tasks.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    }

    taskModal.hide();
    loadTasks();
});

checkSession();
loadTasks();
