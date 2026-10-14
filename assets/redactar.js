const db = window.cilisAuth?.client;
const pasos = [
  ['tipo','Tipo de artículo','Elige el formato que mejor describe tu investigación.'],
  ['datos','Título y resumen','Presenta tu trabajo de forma clara para el equipo de CILIS.'],
  ['autores','Autores','Añade a las personas que participaron en la investigación.'],
  ['declaraciones','Declaraciones','Registra financiación, conflictos de interés y aspectos éticos.'],
  ['manuscrito','Manuscrito','Redacta las secciones principales de tu investigación.'],
  ['referencias','Referencias','Incluye las fuentes que respaldan el trabajo.'],
  ['asesores','Asesores','Indica las personas que colaboraron como asesores, si corresponde.'],
  ['archivos','Archivos','Adjunta documentos de apoyo para el equipo de CILIS.'],
  ['resumen','Revisión y envío','Revisa la información antes de compartirla con CILIS.']
];
const tipos = ['Artículo original','Revisión de literatura','Revisión sistemática','Reporte de caso','Serie de casos','Protocolo de investigación','Artículo de opinión','Otro'];
const loading = document.getElementById('editor-loading');
const app = document.getElementById('editor-app');
const fields = document.getElementById('step-fields');
const form = document.getElementById('research-form');
const message = document.getElementById('form-message');
const saveIndicator = document.getElementById('save-indicator');
let user, researchId, estado = 'borrador', paso = 0, contenido = {};
let saveTimer, saving = Promise.resolve(), dirty = false, saveError = false;

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const val = key => esc(contenido[key] || '');
const field = (key, label, kind='input', hint='', required=false, tall=false) => `<label class="field"><span>${label}${required ? ' *' : ''}</span>${kind === 'textarea' ? `<textarea data-key="${key}" ${tall ? 'class="tall"' : ''} ${required ? 'required' : ''}>${val(key)}</textarea>` : `<input data-key="${key}" type="${kind}" value="${val(key)}" ${required ? 'required' : ''}>`}${hint ? `<small>${hint}</small>` : ''}</label>`;

function showMessage(text, error=false) {
  message.textContent = text;
  message.classList.toggle('error', error);
  message.hidden = !text;
}
function renderRepeat(key, labels) {
  const entries = Array.isArray(contenido[key]) ? contenido[key] : [];
  return `<div class="repeat-list" data-repeat="${key}">${entries.map((entry,index) => `<div class="repeat-item"><div class="repeat-item-head"><strong>${key === 'autores' ? 'Autor' : key === 'asesores' ? 'Asesor' : 'Referencia'} ${index + 1}</strong><button type="button" data-remove="${key}" data-index="${index}">Quitar</button></div><div class="field-grid">${labels.map(([prop,label,kind]) => `<label class="field"><span>${label}</span><input type="${kind || 'text'}" data-array="${key}" data-index="${index}" data-prop="${prop}" value="${esc(entry[prop])}"></label>`).join('')}</div></div>`).join('')}</div><button type="button" class="platform-secondary" data-add="${key}">+ Añadir ${key === 'autores' ? 'autor' : key === 'asesores' ? 'asesor' : 'referencia'}</button>`;
}
function renderFields() {
  const key = pasos[paso][0];
  switch (key) {
    case 'tipo':
      return `<div class="editor-panel"><div class="editor-note">CILIS acompaña la redacción y revisión de investigaciones. Esta plataforma no publica artículos.</div><label class="field"><span>Tipo de artículo *</span><select data-key="tipo_articulo" required><option value="">Selecciona un tipo</option>${tipos.map(tipo => `<option value="${esc(tipo)}" ${contenido.tipo_articulo === tipo ? 'selected' : ''}>${esc(tipo)}</option>`).join('')}</select></label>${field('area','Área de investigación','input','Por ejemplo, salud pública, medicina clínica o innovación.')}</div>`;
    case 'datos':
      return `<div class="editor-panel">${field('titulo','Título de la investigación','input','Usa un título preciso que describa el estudio.',true)}${field('subtitulo','Subtítulo (opcional)')}${field('palabras_clave','Palabras clave','input','Sepáralas por comas.')}${field('resumen','Resumen','textarea','Expón el objetivo, los métodos, los resultados y la conclusión.',true,true)}</div>`;
    case 'autores':
      return `<div class="editor-panel"><div class="editor-note">Incluye al menos un autor. Los datos se conservan en tu borrador privado.</div>${renderRepeat('autores',[['nombre','Nombre completo'],['correo','Correo electrónico','email'],['afiliacion','Institución o afiliación'],['orcid','ORCID (opcional)']])}</div>`;
    case 'declaraciones':
      return `<div class="editor-panel">${field('financiacion','Financiación','textarea','Indica las fuentes de apoyo o escribe “Ninguna”.')}${field('conflictos','Conflictos de interés','textarea','Declara cualquier relación relevante o escribe “Ninguno”.')}${field('etica','Aprobación ética y consentimiento','textarea','Describe la aprobación del comité o explica por qué no aplica.')}${field('contribuciones','Contribución de los autores','textarea','Resume la participación de cada autor.')}</div>`;
    case 'manuscrito':
      return `<div class="editor-panel"><div class="editor-note">Puedes guardar y continuar después. Usa párrafos separados por líneas en blanco.</div>${field('introduccion','Introducción','textarea','Contexto, problema y objetivo de la investigación.',true,true)}${field('metodos','Métodos','textarea','Diseño, participantes, procedimientos y análisis.',false,true)}${field('resultados','Resultados','textarea','Hallazgos principales.',false,true)}${field('discusion','Discusión','textarea','Interpretación, limitaciones e implicaciones.',false,true)}${field('conclusiones','Conclusiones','textarea','Respuesta al objetivo del estudio.',false,true)}${field('agradecimientos','Agradecimientos (opcional)','textarea')}</div>`;
    case 'referencias':
      return `<div class="editor-panel"><p class="editor-note">Añade las referencias en el estilo que estés utilizando. Incluye DOI o enlace si está disponible.</p>${renderRepeat('referencias',[['cita','Referencia completa'],['enlace','DOI o URL','url']])}</div>`;
    case 'asesores':
      return `<div class="editor-panel"><p class="editor-note">Este apartado es opcional. Los asesores pueden ser colaboradores metodológicos o científicos.</p>${renderRepeat('asesores',[['nombre','Nombre completo'],['correo','Correo electrónico','email'],['especialidad','Especialidad o función']])}</div>`;
    case 'archivos':
      return `<div class="editor-panel"><div class="editor-note">Se aceptan PDF, Word, JPG y PNG, hasta 10 MB por archivo. Los archivos son privados.</div><div class="file-drop"><strong>Selecciona tus anexos</strong><input id="file-input" type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" multiple></div><ul class="file-list">${(contenido.archivos || []).map((file,index) => `<li><a href="#" data-download="${index}">${esc(file.nombre)}</a><button type="button" data-file-remove="${index}">Quitar</button></li>`).join('')}</ul></div>`;
    case 'resumen': {
      const autores = (contenido.autores || []).map(a => a.nombre).filter(Boolean).join(', ') || 'Pendiente';
      return `<div class="editor-panel"><div class="editor-note">Al enviar, CILIS podrá revisar tu investigación de forma privada. El envío no implica publicación ni aceptación editorial.</div><dl class="review-list"><dt>Tipo de artículo</dt><dd>${esc(contenido.tipo_articulo || 'Pendiente')}</dd><dt>Título</dt><dd>${esc(contenido.titulo || 'Pendiente')}</dd><dt>Autores</dt><dd>${esc(autores)}</dd><dt>Resumen</dt><dd>${esc(contenido.resumen || 'Pendiente')}</dd><dt>Archivos</dt><dd>${(contenido.archivos || []).length}</dd></dl>${estado === 'borrador' ? '<p class="login-availability">Antes de enviar, se comprobarán los campos esenciales.</p>' : '<p class="platform-message">Esta investigación ya fue enviada a CILIS. Puedes consultarla, pero el borrador está cerrado.</p>'}</div>`;
    }
  }
}
function render() {
  const [key,title,description] = pasos[paso];
  document.getElementById('step-eyebrow').textContent = `PASO ${String(paso+1).padStart(2,'0')}`;
  document.getElementById('step-title').textContent = title;
  document.getElementById('step-description').textContent = description;
  document.getElementById('step-counter').textContent = `${String(paso+1).padStart(2,'0')} / ${String(pasos.length).padStart(2,'0')}`;
  document.getElementById('sidebar-progress').textContent = `Paso ${paso+1} de ${pasos.length}`;
  document.getElementById('sidebar-title').textContent = contenido.titulo || 'Nueva investigación';
  document.getElementById('editor-status-pill').textContent = estado === 'enviado' ? 'Enviada a CILIS' : 'Borrador';
  document.getElementById('editor-status-pill').className = `status-pill ${estado}`;
  document.getElementById('editor-steps').innerHTML = pasos.map(([slug,label],index) => `<button type="button" data-step="${index}" class="${index === paso ? 'is-active' : ''}" ${index === paso ? 'aria-current="step"' : ''}><span>${index+1}</span>${label}</button>`).join('');
  fields.innerHTML = renderFields();
  if (estado === 'enviado') fields.querySelectorAll('input,textarea,select,button[data-add],button[data-remove],button[data-file-remove]').forEach(control => control.disabled = true);
  document.getElementById('previous-button').disabled = paso === 0;
  document.getElementById('save-button').hidden = estado === 'enviado';
  document.getElementById('next-button').textContent = paso === pasos.length-1 ? (estado === 'enviado' ? 'Enviada a CILIS' : 'Enviar a CILIS →') : 'Guardar y continuar →';
  document.getElementById('next-button').disabled = estado === 'enviado' && paso === pasos.length-1;
  showMessage('');
}
function markDirty() {
  if (estado === 'enviado') return;
  dirty = true;
  saveIndicator.textContent = 'Cambios sin guardar';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { save().catch(() => {}); }, 850);
}
async function save() {
  if (estado === 'enviado' || !dirty && researchId) return saving;
  clearTimeout(saveTimer);
  const snapshot = structuredClone(contenido);
  const stepSnapshot = pasos[paso][0];
  dirty = false;
  saving = saving.catch(() => {}).then(async () => {
    saveIndicator.textContent = 'Guardando...';
    const payload = {tipo_articulo:snapshot.tipo_articulo || '',titulo:snapshot.titulo || '',paso_actual:stepSnapshot,contenido:snapshot,actualizado_en:new Date().toISOString()};
    let result;
    if (!researchId) result = await db.from('investigaciones').insert({...payload,propietario_id:user.id}).select('id').single();
    else result = await db.from('investigaciones').update(payload).eq('id',researchId).eq('estado','borrador').select('id').single();
    if (result.error) throw result.error;
    if (!researchId) {
      researchId = result.data.id;
      history.replaceState(null,'',`redactar.html?id=${encodeURIComponent(researchId)}`);
    }
    saveError = false;
    saveIndicator.textContent = dirty ? 'Cambios sin guardar' : 'Guardado';
  }).catch(error => {
    dirty = true;
    saveError = true;
    saveIndicator.textContent = 'Error al guardar';
    showMessage('No se pudo guardar el borrador. Comprueba tu conexión e inténtalo de nuevo.', true);
    throw error;
  });
  return saving;
}
async function goTo(index) {
  if (index < 0 || index >= pasos.length) return;
  if (estado === 'enviado') {
    paso = index;
    render();
    window.scrollTo({top:0,behavior:'smooth'});
    return;
  }
  const anterior = paso;
  paso = index;
  dirty = true;
  try { await save(); render(); window.scrollTo({top:0,behavior:'smooth'}); }
  catch (_) { paso = anterior; }
}
function validateSend() {
  if (!contenido.tipo_articulo) return 'Selecciona un tipo de artículo.';
  if (!contenido.titulo?.trim()) return 'Escribe el título de la investigación.';
  if (!contenido.resumen?.trim()) return 'Escribe el resumen.';
  if (!(contenido.autores || []).some(a => a.nombre?.trim())) return 'Añade al menos un autor con nombre.';
  if (!contenido.introduccion?.trim()) return 'Escribe la introducción del manuscrito.';
  return '';
}
async function sendResearch() {
  const validation = validateSend();
  if (validation) { showMessage(validation,true); return; }
  try {
    await save();
    const {data,error} = await db.from('investigaciones').update({estado:'enviado',enviado_en:new Date().toISOString(),actualizado_en:new Date().toISOString()}).eq('id',researchId).eq('estado','borrador').select('id').single();
    if (error || !data) throw error || new Error('No se pudo enviar');
    estado = 'enviado';
    render();
    showMessage('Investigación enviada a CILIS. Ya puedes consultarla desde tu panel.');
    saveIndicator.textContent = 'Enviada';
  } catch (_) { showMessage('No se pudo enviar la investigación. Vuelve a intentarlo.', true); }
}
form.addEventListener('input', event => {
  const el = event.target;
  if (el.dataset.key) { contenido[el.dataset.key] = el.value; markDirty(); }
  if (el.dataset.array) {
    const index = Number(el.dataset.index);
    contenido[el.dataset.array][index][el.dataset.prop] = el.value;
    markDirty();
  }
  if (el.dataset.key === 'titulo') document.getElementById('sidebar-title').textContent = el.value || 'Nueva investigación';
});
form.addEventListener('change', event => {
  if (event.target.dataset.key) { contenido[event.target.dataset.key] = event.target.value; markDirty(); }
  if (event.target.id === 'file-input') uploadFiles(event.target.files);
});
form.addEventListener('click', async event => {
  const add = event.target.closest('[data-add]');
  const remove = event.target.closest('[data-remove]');
  const fileRemove = event.target.closest('[data-file-remove]');
  const download = event.target.closest('[data-download]');
  if (add) {
    const key = add.dataset.add;
    contenido[key] ||= [];
    contenido[key].push({});
    markDirty();
    render();
  }
  if (remove) {
    contenido[remove.dataset.remove].splice(Number(remove.dataset.index),1);
    markDirty();
    render();
  }
  if (fileRemove) {
    const item = contenido.archivos[Number(fileRemove.dataset.fileRemove)];
    try {
      const {error} = await db.storage.from('investigaciones-cilis').remove([item.ruta]);
      if (error) throw error;
      contenido.archivos.splice(Number(fileRemove.dataset.fileRemove),1);
      markDirty();
      render();
    } catch (_) { showMessage('No se pudo quitar el archivo.',true); }
  }
  if (download) {
    event.preventDefault();
    const item = contenido.archivos[Number(download.dataset.download)];
    const {data,error} = await db.storage.from('investigaciones-cilis').createSignedUrl(item.ruta,60);
    if (error) showMessage('No se pudo abrir el archivo.',true);
    else window.open(data.signedUrl,'_blank','noopener');
  }
});
async function uploadFiles(fileList) {
  if (estado === 'enviado') return;
  const allowed = ['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png'];
  try {
    if (!researchId) { dirty = true; await save(); }
    for (const file of fileList) {
      if (!allowed.includes(file.type) || file.size > 10485760) {
        showMessage(`El archivo ${file.name} no tiene un formato permitido o supera 10 MB.`,true);
        continue;
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-100);
      const ruta = `${user.id}/${researchId}/${crypto.randomUUID()}-${safeName}`;
      saveIndicator.textContent = 'Subiendo archivo...';
      const {error} = await db.storage.from('investigaciones-cilis').upload(ruta,file,{contentType:file.type,upsert:false});
      if (error) throw error;
      contenido.archivos ||= [];
      contenido.archivos.push({nombre:file.name,ruta,tamano:file.size});
      markDirty();
      await save();
    }
    render();
  } catch (_) { showMessage('No se pudo subir el archivo. Inténtalo de nuevo.',true); }
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (paso === pasos.length-1) await sendResearch();
  else await goTo(paso+1);
});
document.getElementById('previous-button').addEventListener('click', () => goTo(paso-1));
document.getElementById('save-button').addEventListener('click', async () => {
  try { await save(); showMessage('Borrador guardado.'); }
  catch (_) { /* Error ya visible. */ }
});
document.getElementById('editor-steps').addEventListener('click', event => {
  const button = event.target.closest('[data-step]');
  if (button) goTo(Number(button.dataset.step));
});
window.addEventListener('beforeunload', event => {
  if (dirty || saveError) { event.preventDefault(); event.returnValue = ''; }
});
async function init() {
  if (!db) { loading.textContent = window.cilisAuth?.unavailableReason || 'No se pudo conectar con la autenticación.'; return; }
  try {
    const {data:{user:currentUser},error:authError} = await db.auth.getUser();
    if (authError || !currentUser) { location.replace('login.html'); return; }
    if ((currentUser.app_metadata?.cilis_role || 'cliente') !== 'cliente') { location.replace('cuenta.html'); return; }
    user = currentUser;
    const id = new URLSearchParams(location.search).get('id');
    if (id) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error('ID inválido');
      const {data,error} = await db.from('investigaciones').select('id,estado,paso_actual,contenido').eq('id',id).single();
      if (error || !data) throw error || new Error('Investigación no encontrada');
      researchId = data.id;
      estado = data.estado;
      contenido = data.contenido || {};
      paso = Math.max(0,pasos.findIndex(item => item[0] === data.paso_actual));
    }
    loading.hidden = true;
    app.hidden = false;
    saveIndicator.textContent = researchId ? 'Guardado' : 'Nuevo borrador';
    render();
  } catch (_) { loading.textContent = 'No se pudo abrir la investigación. Comprueba que existe y que tienes acceso desde tu cuenta.'; }
}
init();
