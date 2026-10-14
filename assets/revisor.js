const adminClient = window.cilisAuth?.client;
const adminStatus = document.getElementById('admin-status');
const adminContent = document.getElementById('admin-content');
const adminList = document.getElementById('admin-list');
const adminEmpty = document.getElementById('admin-empty');
const search = document.getElementById('admin-search');
let investigations = [], profiles = new Map(), reviews = new Map(), filter = 'todas', currentUserId = '';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const stateLabels = {borrador:'En redacción',pendiente:'Por revisar',en_revision:'En revisión',ajustes_solicitados:'Ajustes solicitados',resuelto:'Revisión resuelta'};
const steps = {tipo:1,datos:2,autores:3,declaraciones:4,manuscrito:5,referencias:6,asesores:7,archivos:8,resumen:9};
document.getElementById('year').textContent = new Date().getFullYear();

function currentState(item) {
  return item.estado === 'borrador' ? 'borrador' : reviews.get(item.id)?.estado || 'pendiente';
}
function render() {
  const term = search.value.trim().toLocaleLowerCase('es');
  const shown = investigations.filter(item => {
    const state = currentState(item);
    const searchable = `${item.titulo} ${item.tipo_articulo} ${profiles.get(item.propietario_id) || ''}`.toLocaleLowerCase('es');
    return (filter === 'todas' || state === filter) && (!term || searchable.includes(term));
  });
  const clients = [...profiles.entries()].filter(([id]) => id !== currentUserId).sort((a,b) => a[1].localeCompare(b[1],'es'));
  document.getElementById('count-clients').textContent = clients.length;
  document.getElementById('count-drafts').textContent = investigations.filter(item => item.estado === 'borrador').length;
  document.getElementById('count-pending').textContent = investigations.filter(item => currentState(item) === 'pendiente').length;
  document.getElementById('count-adjustments').textContent = investigations.filter(item => currentState(item) === 'ajustes_solicitados').length;
  adminList.innerHTML = shown.map(item => {
    const state = currentState(item);
    const date = new Intl.DateTimeFormat('es',{day:'numeric',month:'short',year:'numeric'}).format(new Date(item.actualizado_en));
    const title = escapeHtml(item.titulo || 'Investigación sin título');
    const email = escapeHtml(profiles.get(item.propietario_id) || 'Cliente');
    const progress = item.estado === 'borrador' ? `Paso ${steps[item.paso_actual] || 1} de 9` : 'Enviada a CILIS';
    return `<article class="research-card admin-card"><div class="research-card-main"><span class="research-type">${escapeHtml(item.tipo_articulo || 'Tipo por definir')}</span><h2><a href="revision.html?id=${encodeURIComponent(item.id)}">${title}</a></h2><p><strong>Cliente:</strong> ${email} <span aria-hidden="true">·</span> ${progress} <span aria-hidden="true">·</span> Actualizada el ${date}</p></div><div class="research-card-side"><span class="status-pill ${state}">${stateLabels[state]}</span><a href="revision.html?id=${encodeURIComponent(item.id)}">Abrir expediente <span aria-hidden="true">→</span></a></div></article>`;
  }).join('');
  adminEmpty.hidden = shown.length > 0;
  document.getElementById('clients-summary').textContent = `${clients.length} cuenta${clients.length === 1 ? '' : 's'} de cliente`;
  document.getElementById('client-list').innerHTML = clients.length ? clients.map(([id,email]) => {
    const owned = investigations.filter(item => item.propietario_id === id);
    const latest = owned[0];
    const drafts = owned.filter(item => item.estado === 'borrador').length;
    const sent = owned.length - drafts;
    const details = owned.length ? `${owned.length} investigaci${owned.length === 1 ? 'ón' : 'ones'} · ${drafts} en redacción · ${sent} enviadas` : 'Aún no tiene investigaciones';
    return `<article class="client-row"><div class="client-avatar" aria-hidden="true">${escapeHtml(email.slice(0,1).toUpperCase())}</div><div><strong>${escapeHtml(email)}</strong><p>${details}</p></div>${latest ? `<a href="revision.html?id=${encodeURIComponent(latest.id)}">Ver investigación reciente →</a>` : ''}</article>`;
  }).join('') : '<p class="review-help">Todavía no hay cuentas de cliente.</p>';
}
async function init() {
  if (!adminClient) { adminStatus.textContent = window.cilisAuth?.unavailableReason || 'No se pudo conectar con Supabase.'; return; }
  try {
    const {data:{user},error:authError} = await adminClient.auth.getUser();
    if (authError || !user) {location.replace('login.html'); return;}
    if (user.app_metadata?.cilis_role !== 'revisor_admin') {location.replace('cuenta.html'); return;}
    currentUserId = user.id;
    document.getElementById('account-email').textContent = user.email || '';
    const [researchResult,profilesResult,reviewResult] = await Promise.all([
      adminClient.from('investigaciones').select('id,propietario_id,titulo,tipo_articulo,estado,paso_actual,actualizado_en').order('actualizado_en',{ascending:false}),
      adminClient.from('perfiles').select('usuario_id,correo'),
      adminClient.from('seguimiento_revisiones').select('investigacion_id,estado')
    ]);
    if (researchResult.error || profilesResult.error || reviewResult.error) throw researchResult.error || profilesResult.error || reviewResult.error;
    investigations = researchResult.data || [];
    profiles = new Map((profilesResult.data || []).map(item => [item.usuario_id,item.correo]));
    reviews = new Map((reviewResult.data || []).map(item => [item.investigacion_id,item]));
    adminStatus.hidden = true;
    adminContent.hidden = false;
    render();
  } catch (_) { adminStatus.textContent = 'No se pudo cargar el panel. Recarga la página para intentarlo de nuevo.'; }
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click',() => {
  filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(tab => {
    tab.classList.toggle('is-active',tab === button);
    tab.setAttribute('aria-pressed',String(tab === button));
  });
  render();
}));
search.addEventListener('input',render);
document.getElementById('signout-button').addEventListener('click',async event => {
  event.currentTarget.disabled = true;
  const {error} = await adminClient.auth.signOut({scope:'local'});
  if (error) { adminStatus.hidden = false; adminStatus.textContent = 'No se pudo cerrar la sesión.'; event.currentTarget.disabled = false; }
  else location.replace('login.html');
});
init();
