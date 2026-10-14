const registerForm = document.getElementById('register-form');
const registerStatus = document.getElementById('register-status');
const registerAvailability = document.getElementById('register-availability');
const registerClient = window.cilisAuth?.client;

function showRegisterStatus(message) {
  registerStatus.textContent = message;
  registerStatus.hidden = false;
}

if (registerForm && registerStatus) {
  if (!registerClient) {
    registerForm.querySelectorAll('input, button').forEach(control => { control.disabled = true; });
    registerAvailability.textContent = window.cilisAuth?.unavailableReason || 'La autenticación todavía no está configurada.';
    registerAvailability.hidden = false;
  } else {
    registerForm.querySelectorAll('input, button').forEach(control => { control.disabled = false; });
    registerForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (!registerForm.reportValidity()) return;
      const password = document.getElementById('register-password');
      const confirmation = document.getElementById('register-confirm');
      if (password.value !== confirmation.value) {
        showRegisterStatus('Las contraseñas no coinciden.');
        confirmation.focus();
        return;
      }
      const submit = registerForm.querySelector('.login-submit');
      submit.disabled = true;
      registerStatus.hidden = true;
      try {
        const { data, error } = await registerClient.auth.signUp({
          email: registerForm.elements.namedItem('email').value.trim(),
          password: password.value,
          options: {
            data: { full_name: registerForm.elements.namedItem('name').value.trim() },
            emailRedirectTo: new URL('cuenta.html', location.href).href
          }
        });
        if (error) {
          showRegisterStatus(error.code === 'weak_password'
            ? 'Elige una contraseña más segura.'
            : error.code === 'email_address_not_authorized'
              ? 'No pudimos enviar la confirmación a este correo. Inténtalo de nuevo más tarde o contáctanos.'
              : 'No pudimos completar el registro. Revisa tus datos e inténtalo de nuevo.');
          return;
        }
        if (data.session) {
          location.assign(new URL('cuenta.html', location.href));
        } else {
          showRegisterStatus('Revisa tu correo, incluida la carpeta de spam, para confirmar tu cuenta. Después podrás iniciar sesión.');
        }
      } catch (_) {
        showRegisterStatus('No se pudo conectar con el servicio. Inténtalo de nuevo.');
      } finally {
        password.value = '';
        confirmation.value = '';
        submit.disabled = false;
      }
    });
  }
}
