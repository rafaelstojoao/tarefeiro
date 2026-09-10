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

document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch(`${API_BASE}/logout.php`, { method: 'POST' });
    window.location.href = 'login.html';
});

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

const notifBtn = document.getElementById('notif-btn');

async function updateNotifButton() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        notifBtn.hidden = true;
        return;
    }
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    notifBtn.classList.toggle('btn-outline-secondary', !subscription);
    notifBtn.classList.toggle('btn-warning', !!subscription);
    notifBtn.title = subscription ? 'Avisos ativados (toque para desativar)' : 'Ativar avisos';
}

async function enablePush() {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        alert('Permissão de notificação negada. Ative nas configurações do navegador para receber avisos.');
        return;
    }

    const keyRes = await fetch(`${API_BASE}/push_public_key.php`);
    const { publicKey } = await keyRes.json();

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await fetch(`${API_BASE}/push_subscribe.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
    });

    await updateNotifButton();
}

async function disablePush() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    await fetch(`${API_BASE}/push_unsubscribe.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    await subscription.unsubscribe();
    await updateNotifButton();
}

notifBtn.addEventListener('click', async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
        await disablePush();
    } else {
        await enablePush();
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        await navigator.serviceWorker.register('sw.js');
        updateNotifButton();
    });
} else {
    notifBtn.hidden = true;
}

checkSession();
loadTasks();
