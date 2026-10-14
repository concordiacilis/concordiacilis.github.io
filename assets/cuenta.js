const client = window.cilisAuth?.client;
const statusNode = document.getElementById('account-status');
const contentNode = document.getElementById('dashboard-content');
const listNode = document.getElementById('research-list');
const emptyNode = document.getElementById('research-empty');
const searchNode = document.getElementById('research-search');
let investigaciones = [];
let seguimientos = new Map();
let filtro = 'todas';

document.getElementById('year').textContent = new Date().getFullYear();

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

function renderizar() {
  const busqueda = searchNode.value.trim().toLocaleLowerCase('es');
  const visibles = investigaciones.filter(item =>
    (filtro === 'todas' || item.estado === filtro) &&
    (!busqueda || `${item.titulo} ${item.tipo_articulo}`.toLocaleLowerCase('es').includes(busqueda))
  );
  document.getElementById('count-total').textContent = investigaciones.length;
  document.getElementById('count-drafts').textContent = investigaciones.filter(item => item.estado === 'borrador').length;
  document.getElementById('count-sent').textContent = investigaciones.filter(item => item.estado === 'enviado').length;
  listNode.innerHTML = visibles.map(item => {
    const fecha = new Intl.DateTimeFormat('es', {day:'numeric',month:'short',year:'numeric'}).format(new Date(item.actualizado_en));
    const titulo = escapeHtml(item.titulo || 'Investigación sin título');
    const tipo = escapeHtml(item.tipo_articulo || 'Tipo por definir');
    const revision = seguimientos.get(item.id)?.estado;
    const estado = item.estado === 'borrador' ? 'Borrador' : ({pendiente:'Por revisar',en_revision:'En revisión',ajustes_solicitados:'Ajustes solicitados',resuelto:'Revisión resuelta'}[revision] || 'Enviada a CILIS');
    const destino = item.estado === 'borrador' ? `redactar.html?id=${encodeURIComponent(item.id)}` : `revision.html?id=${encodeURIComponent(item.id)}`;
    return `<article class="research-card"><div class="research-card-main"><span class="research-type">${tipo}</span><h2><a href="${destino}">${titulo}</a></h2><p>Actualizada el ${fecha}</p></div><div class="research-card-side"><span class="status-pill ${revision || item.estado}">${estado}</span><a href="${destino}">${item.estado === 'borrador' ? 'Continuar redacción' : 'Ver revisión y observaciones'} <span aria-hidden="true">→</span></a></div></article>`;
  }).join('');
  emptyNode.hidden = visibles.length > 0;
  if (!visibles.length) {
    document.getElementById('empty-title').textContent = investigaciones.length ? 'No hay resultados' : 'Todavía no tienes investigaciones';
    document.getElementById('empty-description').textContent = investigaciones.length ? 'Prueba otro filtro o término de búsqueda.' : 'Crea tu primer borrador para comenzar a redactar.';
    emptyNode.querySelector('a').hidden = investigaciones.length > 0;
  }
}

async function iniciar() {
  if (!client) {
    statusNode.textContent = window.cilisAuth?.unavailableReason || 'No se pudo conectar con la autenticación.';
    return;
  }
  try {
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) { location.replace('login.html'); return; }
    const rol = user.app_metadata?.cilis_role || 'cliente';
    // El rol se obtiene de app_metadata, que solo puede modificar el servidor.
    if (rol !== 'cliente') {
      location.replace('revisor.html');
      return;
    }
    document.getElementById('account-email').textContent = user.email || '';
    const [researchResult,reviewResult] = await Promise.all([
      client.from('investigaciones').select('id,titulo,tipo_articulo,estado,actualizado_en').order('actualizado_en', {ascending:false}),
      client.from('seguimiento_revisiones').select('investigacion_id,estado')
    ]);
    if (researchResult.error || reviewResult.error) throw researchResult.error || reviewResult.error;
    investigaciones = researchResult.data || [];
    seguimientos = new Map((reviewResult.data || []).map(item => [item.investigacion_id,item]));
    statusNode.hidden = true;
    contentNode.hidden = false;
    renderizar();
  } catch (_) {
    statusNode.textContent = 'No se pudieron cargar tus investigaciones. Recarga la página para intentarlo de nuevo.';
  }
}

document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  filtro = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(tab => {
    const activo = tab === button;
    tab.classList.toggle('is-active', activo);
    tab.setAttribute('aria-pressed', String(activo));
  });
  renderizar();
}));
searchNode.addEventListener('input', renderizar);
document.getElementById('signout-button').addEventListener('click', async event => {
  event.currentTarget.disabled = true;
  const { error } = await client.auth.signOut({scope:'local'});
  if (error) {
    statusNode.hidden = false;
    statusNode.textContent = 'No se pudo cerrar la sesión.';
    event.currentTarget.disabled = false;
  } else location.replace('login.html');
});
iniciar();
