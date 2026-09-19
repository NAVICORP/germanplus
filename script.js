const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M12.5 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const grid = document.getElementById('productGrid');
const note = document.getElementById('resultNote');
let io;

/* ---- categories ---- */
const catsEl = document.getElementById('cats');
if (catsEl) catsEl.innerHTML = CATEGORIES.map(c => {
  const n = PRODUCTS.filter(p => p.cat === c.key).length;
  return `<a class="cat reveal" href="#collection" data-jump="${c.key}">
    <img src="assets/products/${c.img}.webp" alt="" aria-hidden="true" width="180" height="180" loading="lazy" />
    <strong>${c.name}</strong>
    <span>${n} product${n === 1 ? '' : 's'}</span>
  </a>`;
}).join('');

/* ---- product grid ---- */
let activeFilter = 'all';
let query = '';

function matches(p) {
  const inCat = activeFilter === 'all' || p.cat === activeFilter;
  if (!query) return inCat;
  const hay = (p.name + ' ' + p.labels + ' ' + p.short).toLowerCase();
  return inCat && hay.includes(query);
}

const LIMIT = parseInt(document.body.dataset.limit || '0', 10);

function render() {
  const all = PRODUCTS.filter(matches);
  const list = LIMIT ? all.slice(0, LIMIT) : all;
  const more = document.getElementById('moreWrap');
  if (more) more.hidden = !(LIMIT && all.length > LIMIT);
  grid.innerHTML = list.length ? list.map(p => `
    <button class="card reveal" data-id="${p.id}" aria-label="View details for ${p.name}">
      <div class="card-media">
        <span class="tag">${p.tag}</span>
        <img src="assets/products/${p.id}.webp" alt="${p.name}" width="820" height="620" loading="lazy" />
      </div>
      <div class="card-body">
        <h3>${p.name}</h3>
        <p class="card-cat">${p.labels}</p>
        <span class="card-more">Read More ${arrow}</span>
      </div>
    </button>`).join('')
    : `<p class="empty">No appliances match that search. Try another word, or message us on WhatsApp and we will help.</p>`;

  if (note) {
    if (query) {
      note.hidden = false;
      note.textContent = `${all.length} result${all.length === 1 ? '' : 's'} for "${query}"`;
    } else {
      note.hidden = true;
    }
  }
  observeReveals();
}
render();

/* ---- tabs ---- */
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-selected','false'); });
    btn.classList.add('is-active');
    btn.setAttribute('aria-selected','true');
    activeFilter = btn.dataset.filter;
    render();
  });
});

function jumpTo(cat) {
  if (!document.getElementById('collection')) { window.location.href = 'products.html?cat=' + cat; return; }
  input.value = '';
  query = '';
  suggest.hidden = true;
  const btn = document.querySelector(`.tab[data-filter="${cat}"]`);
  if (btn) btn.click(); else render();
  document.getElementById('collection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
document.addEventListener('click', e => {
  const j = e.target.closest('[data-jump]');
  if (j) { e.preventDefault(); jumpTo(j.dataset.jump); return; }
  const o = e.target.closest('[data-open]');
  if (o) { e.preventDefault(); openSheet(o.dataset.open); }
});

/* ---- search ---- */
function renderSuggest() {
  const q = input.value.trim().toLowerCase();
  if (!q) { suggest.hidden = true; return; }
  const hits = PRODUCTS.filter(p => (p.name + ' ' + p.labels).toLowerCase().includes(q)).slice(0, 5);
  suggest.innerHTML = hits.length
    ? hits.map(p => `<a href="#collection" data-open="${p.id}"><img src="assets/products/${p.id}.webp" alt="" aria-hidden="true" /><span><strong>${p.name}</strong><small>${p.labels}</small></span></a>`).join('')
    : '<p>No appliances match that search.</p>';
  suggest.hidden = false;
}
input.addEventListener('input', () => {
  renderSuggest();
  query = input.value.trim().toLowerCase();
  render();
});
input.addEventListener('focus', renderSuggest);
document.addEventListener('click', e => {
  if (!form.contains(e.target)) suggest.hidden = true;
});
form.addEventListener('submit', e => {
  e.preventDefault();
  query = input.value.trim().toLowerCase();
  suggest.hidden = true;
  input.blur();
  render();
  document.getElementById('collection').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/* ---- detail sheet ---- */
const sheet = document.getElementById('sheet');
const sheetImg = document.getElementById('sheetImg');
let lastFocus = null;

function openSheet(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  lastFocus = document.activeElement;
  sheetImg.src = `assets/products/${p.id}.webp`;
  sheetImg.alt = p.name;
  document.getElementById('sheetCat').textContent = p.labels;
  document.getElementById('sheetTitle').textContent = p.name;
  document.getElementById('sheetDesc').textContent = p.desc;
  document.getElementById('sheetSpec').innerHTML = p.spec.map(s => `<li><span>${s[0]}</span><span>${s[1]}</span></li>`).join('');
  document.getElementById('sheetWa').href =
    `https://wa.me/${WA}?text=${encodeURIComponent('Hello German Plus, I would like details on the ' + p.name + '.')}`;
  sheet.hidden = false;
  document.body.style.overflow = 'hidden';
  document.body.classList.add('sheet-open');
  sheet.querySelector('.sheet-close').focus();
}
function closeSheet() {
  sheet.hidden = true;
  document.body.style.overflow = '';
  document.body.classList.remove('sheet-open');
  if (lastFocus) lastFocus.focus();
}
grid.addEventListener('click', e => {
  const card = e.target.closest('.card');
  if (card) openSheet(card.dataset.id);
});
sheet.addEventListener('click', e => { if (e.target.hasAttribute('data-close')) closeSheet(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });

/* ---- hero slider ---- */
const slidesEl = document.getElementById('slides');
if (slidesEl) {
const slideCount = slidesEl.children.length;
const dots = document.getElementById('dots');
let index = 0, timer;

dots.innerHTML = Array.from({ length: slideCount }, (_, i) =>
  `<button role="tab" aria-label="Slide ${i + 1}"${i === 0 ? ' class="is-active" aria-selected="true"' : ' aria-selected="false"'}></button>`).join('');

function go(i) {
  index = (i + slideCount) % slideCount;
  slidesEl.style.transform = `translateX(-${index * 100}%)`;
  [...dots.children].forEach((d, n) => {
    d.classList.toggle('is-active', n === index);
    d.setAttribute('aria-selected', String(n === index));
  });
}
function auto() {
  clearInterval(timer);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  timer = setInterval(() => go(index + 1), 6000);
}
dots.addEventListener('click', e => {
  const i = [...dots.children].indexOf(e.target);
  if (i > -1) { go(i); auto(); }
});
document.querySelector('.sl-next').addEventListener('click', () => { go(index + 1); auto(); });
document.querySelector('.sl-prev').addEventListener('click', () => { go(index - 1); auto(); });
auto();

let touchX = null;
slidesEl.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
slidesEl.addEventListener('touchend', e => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 45) { go(index + (dx < 0 ? 1 : -1)); auto(); }
  touchX = null;
}, { passive: true });
}

/* ---- mobile nav ---- */
const menuBtn = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');
menuBtn.addEventListener('click', () => {
  const open = menuBtn.getAttribute('aria-expanded') === 'true';
  menuBtn.setAttribute('aria-expanded', String(!open));
  mobileNav.hidden = open;
});
mobileNav.addEventListener('click', e => {
  if (e.target.tagName === 'A') {
    mobileNav.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
  }
});

/* ---- reveal ---- */
function observeReveals() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-in'));
    return;
  }
  if (!io) {
    io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
  }
  document.querySelectorAll('.reveal:not(.is-in)').forEach(el => io.observe(el));
}
observeReveals();

document.getElementById('yr').textContent = new Date().getFullYear();

/* ---- deep links ---- */
(() => {
  const params = new URLSearchParams(location.search);
  const c = params.get('cat');
  const q = params.get('q');
  if (q) { input.value = q; query = q.trim().toLowerCase(); }
  if (c) {
    const btn = document.querySelector(`.tab[data-filter="${c}"]`);
    if (btn) { document.querySelectorAll('.tab').forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-selected','false'); }); btn.classList.add('is-active'); btn.setAttribute('aria-selected','true'); activeFilter = c; }
  }
  if (c || q) render();
})();
