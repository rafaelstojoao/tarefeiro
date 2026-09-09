document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorMsg = document.getElementById('error-msg');
    errorMsg.textContent = '';

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    try {
        const res = await fetch('api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();

        if (!res.ok) {
            errorMsg.textContent = data.error || 'Erro ao entrar';
            return;
        }

        window.location.href = 'index.html';
    } catch (err) {
        errorMsg.textContent = 'Erro de conexão com o servidor';
    }
});
