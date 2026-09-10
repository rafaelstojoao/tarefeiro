const calGrid = document.getElementById('calendar-grid');
const calMonthLabel = document.getElementById('cal-month-label');
const selectedDayLabel = document.getElementById('selected-day-label');
const dayTaskListEl = document.getElementById('day-task-list');
const dayEmptyStateEl = document.getElementById('day-empty-state');
const taskForm = document.getElementById('task-form');
const taskModalEl = document.getElementById('task-modal');
const taskModal = new bootstrap.Modal(taskModalEl);
const taskModalTitle = document.getElementById('task-modal-title');

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function toDateStr(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const today = new Date();
let viewMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = toDateStr(today);
let allTasks = [];
let tasksByDate = {};

function groupTasksByDate(tasks) {
    const map = {};
    tasks.forEach((task) => {
        if (!task.due_date) return;
        if (!map[task.due_date]) map[task.due_date] = [];
        map[task.due_date].push(task);
    });
    return map;
}

async function loadCalendar() {
    allTasks = await fetchTasks();
    tasksByDate = groupTasksByDate(allTasks);
    renderGrid();
    renderDayList();
}

function renderGrid() {
    calMonthLabel.textContent = `${MONTH_NAMES[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`;
    calGrid.innerHTML = '';

    const firstWeekday = viewMonth.getDay();
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const todayStr = toDateStr(today);

    for (let i = 0; i < firstWeekday; i++) {
        const blank = document.createElement('div');
        blank.className = 'calendar-day calendar-day-blank';
        if (i === 0 || i === 6) blank.classList.add('is-weekend');
        calGrid.appendChild(blank);
    }

    const maxChips = 2;

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const weekday = (firstWeekday + day - 1) % 7;
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'calendar-day';
        if (weekday === 0 || weekday === 6) cell.classList.add('is-weekend');
        if (dateStr === todayStr) cell.classList.add('is-today');
        if (dateStr === selectedDate) cell.classList.add('is-selected');

        const tasksOnDay = tasksByDate[dateStr] || [];
        const chipsHtml = tasksOnDay
            .slice(0, maxChips)
            .map((t) => `<div class="calendar-task-chip priority-${t.priority}">${escapeHtml(t.title)}</div>`)
            .join('');
        const moreHtml = tasksOnDay.length > maxChips
            ? `<div class="calendar-more">+${tasksOnDay.length - maxChips} mais</div>`
            : '';

        cell.innerHTML = `<span class="calendar-day-num">${day}</span>${chipsHtml}${moreHtml}`;
        cell.addEventListener('click', () => {
            selectedDate = dateStr;
            renderGrid();
            renderDayList();
        });

        calGrid.appendChild(cell);
    }
}

function renderDayList() {
    const [year, month, day] = selectedDate.split('-');
    const todayStr = toDateStr(today);
    selectedDayLabel.textContent = selectedDate === todayStr
        ? 'Hoje'
        : `${day}/${month}/${year}`;

    const tasks = tasksByDate[selectedDate] || [];
    dayTaskListEl.innerHTML = '';
    dayEmptyStateEl.hidden = tasks.length > 0;

    tasks.forEach((task) => {
        const li = document.createElement('li');
        li.className = `list-group-item task-card d-flex align-items-start gap-3 ${task.status === 'concluida' ? 'concluida' : ''}`;
        li.dataset.priority = task.priority;

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
                    ${task.due_time ? `<span class="badge text-bg-secondary">${task.due_time.slice(0, 5)}</span>` : ''}
                    ${reminderHtml}
                </div>
            </div>
            <button class="btn btn-sm btn-link text-secondary" data-action="delete" data-id="${task.id}">&times;</button>
        `;

        dayTaskListEl.appendChild(li);
    });
}

dayTaskListEl.addEventListener('click', async (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const id = Number(target.dataset.id);

    if (action === 'toggle') {
        await toggleTaskStatus(id, target.dataset.status);
        loadCalendar();
    }

    if (action === 'delete') {
        if (!confirm('Excluir esta tarefa?')) return;
        await deleteTask(id);
        loadCalendar();
    }

    if (action === 'edit') {
        openEditModal(id);
    }
});

function openEditModal(id) {
    const task = allTasks.find((t) => t.id === id);
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
    document.getElementById('task-due-date').value = selectedDate;
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
    loadCalendar();
});

document.getElementById('cal-prev').addEventListener('click', () => {
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
    renderGrid();
});

document.getElementById('cal-next').addEventListener('click', () => {
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    renderGrid();
});

checkSession();
loadCalendar();
