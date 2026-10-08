const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');
if (menuToggle && navigation) {
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    navigation.classList.toggle('is-open', open);
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    navigation.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menú');
  }));
}
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

if (document.body.classList.contains('page-home')) {
  if (location.hash === '#nosotros') location.replace('nosotros.html');
  if (location.hash === '#academy') location.replace('academy.html');
}

const prefersLessMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('a[data-page-transition]').forEach(link => {
  link.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = new URL(link.href);
    if (target.origin !== location.origin || target.pathname === location.pathname || prefersLessMotion.matches) return;
    event.preventDefault();
    document.body.classList.add('page-leaving');
    window.setTimeout(() => { location.href = target.href; }, 260);
  });
});
