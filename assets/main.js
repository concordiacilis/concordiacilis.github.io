const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    nav.classList.toggle('is-open', open);
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
  }));
}
document.getElementById('year').textContent = new Date().getFullYear();

// Un mismo contenido alimenta la vista previa y el abstract ampliado.
const callsGrid = document.getElementById('calls-grid');
const abstractDialog = document.getElementById('abstract-dialog');
const calls = window.CILIS_CONVOCATORIAS || [];
let activeCallTrigger = null;
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function appendAbstract(container, call) {
  container.replaceChildren();
  if (!call.abstract) {
    container.append(element('h3', 'abstract-section-title', 'Abstract pendiente de publicación'));
    container.append(element('p', '', 'El texto completo todavía no está disponible en esta página. Puedes solicitarlo al equipo de CILIS y consultar las condiciones de participación.'));
    return;
  }
  const parts = call.abstract.split(/(?=Introducción:|Métodos:|Metodología:|Resultados:|Conclusiones:)/).filter(Boolean);
  parts.forEach(part => {
    const separator = part.indexOf(':');
    if (separator !== -1) {
      container.append(element('h3', 'abstract-section-title', part.slice(0, separator)));
      container.append(element('p', '', part.slice(separator + 1).trim()));
    } else container.append(element('p', '', part));
  });
  if (call.keywords) {
    container.append(element('h3', 'abstract-section-title', 'Palabras clave'));
    container.append(element('p', 'abstract-keywords', call.keywords));
  }
}
function openAbstract(call, trigger) {
  activeCallTrigger = trigger;
  document.getElementById('abstract-area').textContent = call.area;
  document.getElementById('abstract-title').textContent = call.title;
  document.getElementById('abstract-kind').textContent = call.kind;
  appendAbstract(document.getElementById('abstract-content'), call);
  const documents = document.getElementById('abstract-documents');
  documents.replaceChildren();
  const originals = [...(call.flyers || [])];
  if (call.abstractImage) originals.push({src:call.abstractImage,label:'Ver abstract original'});
  originals.forEach(original => {
    const link = element('a', 'abstract-document-link', original.label);
    link.href = original.src;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    documents.append(link);
  });
  const message = `Hola, CILIS RESEARCH. Me interesa la convocatoria «${call.title}». ¿Podrían enviarme el abstract y confirmar la disponibilidad y las condiciones para participar?`;
  document.getElementById('abstract-contact').href = `https://wa.me/593967701604?text=${encodeURIComponent(message)}`;
  abstractDialog.showModal();
  document.body.classList.add('abstract-is-open');
  abstractDialog.scrollTop = 0;
  document.getElementById('abstract-title').focus({preventScroll:true});
}
if (callsGrid && abstractDialog) {
  calls.forEach((call, index) => {
    const card = element('article', 'call-card');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-haspopup', 'dialog');
    card.setAttribute('aria-label', `${call.shortTitle}. ${call.complete ? 'Leer abstract completo' : 'Ver convocatoria; abstract pendiente de publicación'}.`);
    const top = element('div', 'call-card-top');
    top.append(element('span', 'call-area', call.area), element('span', 'call-number', String(index + 1).padStart(2, '0')));
    card.append(top);
    if (call.flyers?.length) {
      const cover = element('img', 'call-flyer');
      cover.src = call.flyers[0].src;
      cover.alt = `Flyer de la convocatoria: ${call.shortTitle}`;
      cover.width = 1080;
      cover.height = 1350;
      cover.loading = 'lazy';
      cover.decoding = 'async';
      card.append(cover);
    }
    card.append(element('p', 'call-type', call.kind), element('h3', 'call-title', call.shortTitle));
    const preview = element('div', 'call-preview');
    const previewInner = element('div', 'call-preview-inner');
    const previewText = element('div', 'call-preview-text');
    appendAbstract(previewText, call);
    previewInner.append(previewText); preview.append(previewInner);card.append(preview);
    const footer = element('div', 'call-card-footer');
    footer.append(element('span', 'call-availability', 'Consultar disponibilidad'), element('span', 'call-read', call.complete ? 'Leer abstract' : 'Ver información'));
    card.append(footer);
    card.addEventListener('click', () => {
      if (!window.getSelection().toString().trim()) openAbstract(call, card);
    });
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {event.preventDefault();openAbstract(call, card);}
    });
    callsGrid.append(card);
  });
  abstractDialog.querySelector('.abstract-close').addEventListener('click', () => abstractDialog.close());
  abstractDialog.addEventListener('click', event => {
    if (event.target !== abstractDialog) return;
    const rect = abstractDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) abstractDialog.close();
  });
  abstractDialog.addEventListener('close', () => {
    document.body.classList.remove('abstract-is-open');
    activeCallTrigger?.focus({preventScroll:true});
  });
}
