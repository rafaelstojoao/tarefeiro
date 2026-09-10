const API_BASE = 'api';

const PRIORITY_LABELS = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };

async function checkSession() {
    const res = await fetch(`${API_BASE}/session.php`);
    if (!res.ok) {
        window.location.href = 'login.html';
    }
}

async function fetchTasks() {
    const res = await fetch(`${API_BASE}/tasks.php`);
    if (res.status === 401) {
        window.location.href = 'login.html';
        return [];
    }
    return res.json();
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDueDate(dateStr) {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

async function toggleTaskStatus(id, currentStatus) {
    const newStatus = currentStatus === 'concluida' ? 'pendente' : 'concluida';
    await fetch(`${API_BASE}/tasks.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
    });
}

async function deleteTask(id) {
    // POST em vez de DELETE: a hospedagem não processa o verbo DELETE corretamente em scripts PHP
    await fetch(`${API_BASE}/delete_task.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
    });
}

document.getElementById('logout-btn')?.addEventListener('click', async () => {
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
    if (!notifBtn) return;
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

notifBtn?.addEventListener('click', async () => {
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
} else if (notifBtn) {
    notifBtn.hidden = true;
}
