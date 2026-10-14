const authConfig = window.CILIS_AUTH || {};
let authClient = null;
let authUnavailableReason = 'La autenticación todavía no está configurada.';

if (authConfig.url && authConfig.publishableKey) {
  try {
    const projectUrl = new URL(authConfig.url);
    const publicKey = authConfig.publishableKey.trim();
    if (projectUrl.protocol !== 'https:' || !projectUrl.hostname.endsWith('.supabase.co') || projectUrl.pathname !== '/' || !/^(sb_publishable_.+|eyJ.+)$/.test(publicKey)) {
      throw new Error('Configuración pública de Supabase inválida.');
    }
    if (!window.supabase?.createClient) {
      throw new Error('No se pudo cargar el cliente de Supabase.');
    }
    authClient = window.supabase.createClient(projectUrl.origin, publicKey);
    authUnavailableReason = '';
  } catch (error) {
    authUnavailableReason = error.message;
  }
}

window.cilisAuth = Object.freeze({
  client: authClient,
  unavailableReason: authUnavailableReason
});
