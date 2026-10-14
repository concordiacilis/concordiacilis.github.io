const accountClient = window.cilisAuth?.client;
const accountStatus = document.getElementById('account-status');
const accountEmail = document.getElementById('account-email');
const accountNext = document.getElementById('account-next');
const signoutButton = document.getElementById('signout-button');

async function loadAccount() {
  if (!accountClient) {
    accountStatus.textContent = window.cilisAuth?.unavailableReason || 'La autenticación todavía no está configurada.';
    return;
  }
  try {
    const { data, error } = await accountClient.auth.getUser();
    if (error || !data.user) {
      location.replace(new URL('login.html', location.href));
      return;
    }
    accountStatus.textContent = 'Sesión iniciada como:';
    accountEmail.textContent = data.user.email || '';
    accountEmail.hidden = false;
    accountNext.hidden = false;
    signoutButton.hidden = false;
  } catch (_) {
    accountStatus.textContent = 'No se pudo comprobar tu sesión. Recarga la página e inténtalo de nuevo.';
  }
}

if (signoutButton) {
  signoutButton.addEventListener('click', async () => {
    signoutButton.disabled = true;
    try {
      const { error } = await accountClient.auth.signOut({ scope: 'local' });
      if (error) throw error;
      location.replace(new URL('login.html', location.href));
    } catch (_) {
      accountStatus.textContent = 'No se pudo cerrar la sesión. Inténtalo de nuevo.';
      signoutButton.disabled = false;
    }
  });
}

loadAccount();
