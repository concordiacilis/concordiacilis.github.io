const reviewClient = window.cilisAuth?.client;
const loading = document.getElementById('review-loading');
const app = document.getElementById('review-app');
const messageNode = document.getElementById('review-message');
const labels = {pendiente:'Por revisar',en_revision:'En revisión',ajustes_solicitados:'Ajustes solicitados',resuelto:'Revisión resuelta'};
const sectionLabels = {general:'General',tipo:'Tipo de artículo',datos:'Título y resumen',autores:'Autores',declaraciones:'Declaraciones',manuscrito:'Manuscrito',referencias:'Referencias',asesores:'Asesores',archivos:'Archivos'};
const steps = {tipo:1,datos:2,autores:3,declaraciones:4,manuscrito:5,referencias:6,asesores:7,archivos:8,resumen:9};
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const formatDate = value => value ? new Intl.DateTimeFormat('es',{day:'numeric',month:'long',year:'numeric'}).format(new Date(value)) : '—';
let user, admin = false, research, tracking, thread = [];
document.getElementById('year').textContent = new Date().getFullYear();

function notify(text,error=false) {
  messageNode.textContent = text;
  messageNode.classList.toggle('error',error);
  messageNode.hidden = !text;
}
function renderContent() {
  const c = research.contenido || {};
  const items = [
    ['Tipo de artículo',c.tipo_articulo],['Área',c.area],['Título',c.titulo],['Subtítulo',c.subtitulo],
    ['Palabras clave',c.palabras_clave],['Resumen',c.resumen],
    ['Autores',(c.autores || []).map(a => [a.nombre,a.afiliacion,a.correo,a.orcid].filter(Boolean).join(' · ')).join('\n')],
    ['Financiación',c.financiacion],['Conflictos de interés',c.conflictos],['Ética y consentimiento',c.etica],
    ['Contribuciones',c.contribuciones],['Introducción',c.introduccion],['Métodos',c.metodos],
    ['Resultados',c.resultados],['Discusión',c.discusion],['Conclusiones',c.conclusiones],
    ['Agradecimientos',c.agradecimientos],
    ['Referencias',(c.referencias || []).map((r,i) => `${i+1}. ${r.cita || ''} ${r.enlace || ''}`).join('\n')],
    ['Asesores',(c.asesores || []).map(a => [a.nombre,a.especialidad,a.correo].filter(Boolean).join(' · ')).join('\n')]
  ].filter(([,value]) => String(value || '').trim());
  document.getElementById('research-body').innerHTML = items.length
    ? items.map(([label,value]) => `<div class="review-content-block"><h3>${esc(label)}</h3><p>${esc(value)}</p></div>`).join('')
    : '<p class="review-help">El cliente aún no ha añadido contenido.</p>';
  const files = c.archivos || [];
  document.getElementById('attachment-list').innerHTML = files.length
    ? files.map((file,index) => `<li><a href="#" data-file="${index}">${esc(file.nombre)}</a></li>`).join('')
    : '<li>No hay archivos adjuntos.</li>';
}
function renderThread() {
  document.getElementById('messages-list').innerHTML = thread.length
    ? thread.map(item => `<article class="review-message-item ${item.tipo}"><div><strong>${item.tipo === 'observacion' ? 'Equipo revisor' : 'Cliente'}</strong><span>${formatDate(item.creado_en)} · ${esc(sectionLabels[item.apartado] || item.apartado)}</span></div><p>${esc(item.mensaje)}</p></article>`).join('')
    : '<p class="review-help">Todavía no hay observaciones ni respuestas.</p>';
}
function render() {
  const sent = research.estado === 'enviado';
  const state = sent ? tracking?.estado || 'pendiente' : 'borrador';
  document.getElementById('review-kicker').textContent = admin ? 'EXPEDIENTE DEL CLIENTE' : 'MI INVESTIGACIÓN';
  document.getElementById('research-title').textContent = research.titulo || 'Investigación sin título';
  document.getElementById('review-subtitle').textContent = research.tipo_articulo || 'Tipo de artículo por definir';
  const pill = document.getElementById('research-status');
  pill.textContent = sent ? labels[state] : 'En redacción';
  pill.className = `status-pill ${state}`;
  document.getElementById('created-date').textContent = formatDate(research.creado_en);
  document.getElementById('updated-date').textContent = formatDate(research.actualizado_en);
  document.getElementById('research-progress').textContent = sent ? 'Enviada a CILIS' : `Paso ${steps[research.paso_actual] || 1} de 9`;
  document.getElementById('review-state').textContent = sent ? labels[state] : 'Aún no enviada';
  document.getElementById('thread-intro').textContent = sent
    ? (admin ? 'Deja comentarios concretos por apartado. El cliente podrá responder aquí.' : 'Lee las observaciones del equipo CILIS y responde en este expediente.')
    : 'Las observaciones estarán disponibles después del envío a CILIS.';
  const stateForm = document.getElementById('review-state-form');
  stateForm.hidden = !admin || !sent;
  document.getElementById('review-state-select').value = sent ? state : 'pendiente';
  const form = document.getElementById('message-form');
  form.hidden = !sent;
  document.getElementById('message-label').textContent = admin ? 'Nueva observación' : 'Tu respuesta';
  document.getElementById('message-submit').textContent = admin ? 'Enviar observación' : 'Enviar respuesta';
  document.getElementById('section-field').hidden = !admin;
  const edit = document.getElementById('edit-research-link');
  edit.hidden = admin || (sent && state !== 'ajustes_solicitados');
  edit.textContent = !sent ? 'Continuar redacción →' : 'Editar ajustes solicitados →';
  edit.href = `redactar.html?id=${encodeURIComponent(research.id)}`;
  renderContent();
  renderThread();
}
async function init() {
  if (!reviewClient) {loading.textContent = window.cilisAuth?.unavailableReason || 'No se pudo conectar con Supabase.'; return;}
  const id = new URLSearchParams(location.search).get('id');
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {loading.textContent='El enlace de investigación no es válido.';return;}
  try {
    const {data:{user:currentUser},error:authError} = await reviewClient.auth.getUser();
    if (authError || !currentUser) {location.replace('login.html');return;}
    user = currentUser;
    admin = user.app_metadata?.cilis_role === 'revisor_admin';
    document.getElementById('account-email').textContent = user.email || '';
    const back = admin ? 'revisor.html' : 'cuenta.html';
    document.getElementById('back-link').href = back;
    document.getElementById('back-nav').href = back;
    document.getElementById('back-nav').textContent = admin ? 'Panel de revisión' : 'Mis investigaciones';
    const {data,error} = await reviewClient.from('investigaciones').select('id,propietario_id,titulo,tipo_articulo,estado,paso_actual,contenido,creado_en,actualizado_en,enviado_en').eq('id',id).single();
    if (error || !data) throw error || new Error('No encontrada');
    research = data;
    const [trackResult,threadResult,profileResult] = await Promise.all([
      reviewClient.from('seguimiento_revisiones').select('investigacion_id,estado,revisor_id,actualizado_en').eq('investigacion_id',id).maybeSingle(),
      reviewClient.from('mensajes_revision').select('id,autor_id,tipo,apartado,mensaje,creado_en').eq('investigacion_id',id).order('creado_en',{ascending:true}),
      admin ? reviewClient.from('perfiles').select('correo').eq('usuario_id',data.propietario_id).maybeSingle() : Promise.resolve({data:{correo:user.email}})
    ]);
    if (trackResult.error || threadResult.error || profileResult.error) throw trackResult.error || threadResult.error || profileResult.error;
    tracking = trackResult.data;
    thread = threadResult.data || [];
    document.getElementById('client-email').textContent = profileResult.data?.correo || 'Cliente';
    loading.hidden = true;
    app.hidden = false;
    render();
  } catch (_) {loading.textContent='No se pudo abrir el expediente. Comprueba que tienes acceso e inténtalo de nuevo.';}
}
document.getElementById('review-state-form').addEventListener('submit',async event => {
  event.preventDefault();
  if (!admin || research?.estado !== 'enviado') return;
  const state = document.getElementById('review-state-select').value;
  if (state === 'ajustes_solicitados' && !thread.some(item => item.tipo === 'observacion')) {notify('Escribe una observación antes de solicitar ajustes.',true);return;}
  const button = event.currentTarget.querySelector('button');
  button.disabled = true;
  try {
    const payload = {investigacion_id:research.id,estado:state,revisor_id:user.id,actualizado_en:new Date().toISOString()};
    const {data,error} = await reviewClient.from('seguimiento_revisiones').upsert(payload,{onConflict:'investigacion_id'}).select('investigacion_id,estado,revisor_id,actualizado_en').single();
    if (error) throw error;
    tracking = data;
    render();
    notify('Estado de revisión actualizado.');
  } catch (_) {notify('No se pudo actualizar el estado.',true);}
  finally {button.disabled = false;}
});
document.getElementById('message-form').addEventListener('submit',async event => {
  event.preventDefault();
  if (research?.estado !== 'enviado') return;
  const text = document.getElementById('message-text').value.trim();
  if (!text) return;
  const button = document.getElementById('message-submit');
  button.disabled = true;
  try {
    const {data,error} = await reviewClient.from('mensajes_revision').insert({
      investigacion_id:research.id,autor_id:user.id,tipo:admin ? 'observacion' : 'respuesta',
      apartado:admin ? document.getElementById('message-section').value : 'general',mensaje:text
    }).select('id,autor_id,tipo,apartado,mensaje,creado_en').single();
    if (error) throw error;
    thread.push(data);
    document.getElementById('message-text').value = '';
    renderThread();
    notify(admin ? 'Observación enviada al expediente.' : 'Respuesta enviada al equipo revisor.');
  } catch (_) {notify('No se pudo enviar el mensaje. Inténtalo de nuevo.',true);}
  finally {button.disabled = false;}
});
document.getElementById('attachment-list').addEventListener('click',async event => {
  const link = event.target.closest('[data-file]');
  if (!link) return;
  event.preventDefault();
  const file = research.contenido?.archivos?.[Number(link.dataset.file)];
  if (!file?.ruta) return;
  const {data,error} = await reviewClient.storage.from('investigaciones-cilis').createSignedUrl(file.ruta,60);
  if (error) notify('No se pudo abrir el archivo.',true);
  else window.open(data.signedUrl,'_blank','noopener');
});
document.getElementById('signout-button').addEventListener('click',async event => {
  event.currentTarget.disabled = true;
  const {error} = await reviewClient.auth.signOut({scope:'local'});
  if (error) {notify('No se pudo cerrar la sesión.',true);event.currentTarget.disabled=false;}
  else location.replace('login.html');
});
init();
