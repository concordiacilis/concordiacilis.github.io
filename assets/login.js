const loginForm = document.getElementById('login-form');
const loginStatus = document.getElementById('login-status');
const loginAvailability = document.getElementById('login-availability');
const passwordInput = document.getElementById('login-password');
const passwordToggle = document.querySelector('.login-password-toggle');
const loginClient = window.cilisAuth?.client;

function showLoginStatus(message) {
  loginStatus.textContent = message;
  loginStatus.hidden = false;
}

if (passwordInput && passwordToggle) {
  passwordToggle.addEventListener('click', () => {
    const visible = passwordInput.type === 'password';
    passwordInput.type = visible ? 'text' : 'password';
    passwordToggle.textContent = visible ? 'Ocultar' : 'Mostrar';
    passwordToggle.setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
    passwordToggle.setAttribute('aria-pressed', String(visible));
  });
}

if (loginForm && loginStatus) {
  if (!loginClient) {
    loginForm.querySelectorAll('input, button').forEach(control => { control.disabled = true; });
    loginAvailability.textContent = window.cilisAuth?.unavailableReason || 'La autenticación todavía no está configurada.';
  } else {
    loginForm.querySelectorAll('input, button').forEach(control => { control.disabled = false; });
    loginAvailability.hidden = true;
    loginClient.auth.getUser().then(({ data }) => {
      if (data.user) location.replace(new URL('cuenta.html', location.href));
    }).catch(() => {});

    loginForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (!loginForm.reportValidity()) return;
      const submit = loginForm.querySelector('.login-submit');
      submit.disabled = true;
      loginStatus.hidden = true;
      try {
        const { error } = await loginClient.auth.signInWithPassword({
          email: loginForm.elements.namedItem('email').value.trim(),
          password: passwordInput.value
        });
        if (error) {
          showLoginStatus(error.code === 'email_not_confirmed'
            ? 'Confirma tu correo electrónico antes de iniciar sesión.'
            : 'No pudimos iniciar sesión. Comprueba tu correo y contraseña.');
          return;
        }
        location.assign(new URL('cuenta.html', location.href));
      } catch (_) {
        showLoginStatus('No se pudo conectar con el servicio. Inténtalo de nuevo.');
      } finally {
        passwordInput.value = '';
        submit.disabled = false;
      }
    });
  }
}
