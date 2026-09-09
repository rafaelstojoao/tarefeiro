const API_BASE = 'api';

const taskListEl = document.getElementById('task-list');
const emptyStateEl = document.getElementById('empty-state');
const taskForm = document.getElementById('task-form');
const taskModalEl = document.getElementById('task-modal');
const taskModal = new bootstrap.Modal(taskModalEl);
const taskModalTitle = document.getElementById('task-modal-title');

const PRIORITY_LABELS = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };

async function checkSession() {
    const res = await fetch(`${API_BASE}/session.php`);
    if (!res.ok) {
        window.location.href = 'login.html';
    }
}

async function loadTasks() {
    const res = await fetch(`${API_BASE}/tasks.php`);
    if (res.status === 401) {
        window.location.href = 'login.html';
        return;
    }
    const tasks = await res.json();
    renderTasks(tasks);
}

function formatDueDate(dateStr) {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

function renderTasks(tasks) {
    taskListEl.innerHTML = '';
    emptyStateEl.hidden = tasks.length > 0;

    tasks.forEach((task) => {
        const li = document.createElement('li');
        li.className = `list-group-item task-card d-flex align-items-start gap-3 ${task.status === 'concluida' ? 'concluida' : ''}`;
        li.dataset.priority = task.priority;

        const dueDateHtml = task.due_date
            ? `<span class="badge text-bg-secondary">${formatDueDate(task.due_date)}</span>`
            : '';

        li.innerHTML = `
            <button class="btn btn-sm btn-outline-secondary rounded-circle checkbox-round p-0" data-action="toggle" data-id="${task.id}" data-status="${task.status}"></button>
            <div class="flex-grow-1" style="min-width:0;" data-action="edit" data-id="${task.id}">
                <div class="task-title">${escapeHtml(task.title)}</div>
                ${task.description ? `<div class="text-secondary small mt-1">${escapeHtml(task.description)}</div>` : ''}
                <div class="d-flex gap-2 mt-2 flex-wrap">
                    <span class="badge text-bg-secondary">${PRIORITY_LABELS[task.priority]}</span>
                    ${dueDateHtml}
                </div>
            </div>
            <button class="btn btn-sm btn-link text-secondary" data-action="delete" data-id="${task.id}">&times;</button>
        `;

        taskListEl.appendChild(li);
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

taskListEl.addEventListener('click', async (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const id = Number(target.dataset.id);

    if (action === 'toggle') {
        const newStatus = target.dataset.status === 'concluida' ? 'pendente' : 'concluida';
        await fetch(`${API_BASE}/tasks.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: newStatus }),
        });
        loadTasks();
    }

    if (action === 'delete') {
        if (!confirm('Excluir esta tarefa?')) return;
        await fetch(`${API_BASE}/tasks.php`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        loadTasks();
    }

    if (action === 'edit') {
        openEditModal(id);
    }
});

async function openEditModal(id) {
    const res = await fetch(`${API_BASE}/tasks.php`);
    const tasks = await res.json();
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    taskModalTitle.textContent = 'Editar tarefa';
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-due-date').value = task.due_date || '';
    taskModal.show();
}

document.getElementById('add-task-btn').addEventListener('click', () => {
    taskForm.reset();
    document.getElementById('task-id').value = '';
    taskModalTitle.textContent = 'Nova tarefa';
});

taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('task-id').value;
    const payload = {
        title: document.getElementById('task-title').value.trim(),
        description: document.getElementById('task-description').value.trim(),
        priority: document.getElementById('task-priority').value,
        due_date: document.getElementById('task-due-date').value,
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

document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch(`${API_BASE}/logout.php`, { method: 'POST' });
    window.location.href = 'login.html';
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js');
    });
}

checkSession();
loadTasks();
