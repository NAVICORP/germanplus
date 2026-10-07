const form = document.getElementById('searchForm');
const input = document.getElementById('searchInput');
const suggest = document.getElementById('suggest');
/* Text from the catalogue is written into the page escaped; photos added in
   the admin come as /media/<id>, the site's own as assets/products/<id>.webp. */
const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const imgOf = p => p.img || `/assets/products/${p.id}.webp`;
const catImg = c => { const p = PRODUCTS.find(x => x.id === c.img); return p ? imgOf(p) : `/assets/products/${c.img}.webp`; };
const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M12.5 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const grid = document.getElementById('productGrid');
const note = document.getElementById('resultNote');
let io;

/* ---- categories ---- */
const catsEl = document.getElementById('cats');
if (catsEl) catsEl.innerHTML = CATEGORIES.map(c => {
  const n = PRODUCTS.filter(p => p.cat === c.key).length;
  return `<a class="cat reveal" href="/c/${esc(c.key)}" data-jump="${esc(c.key)}">
    <img src="${esc(catImg(c))}" alt="" aria-hidden="true" width="180" height="180" loading="lazy" />
    <strong>${esc(c.name)}</strong>
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
  if (!grid) return;
  const all = PRODUCTS.filter(matches);
  const list = LIMIT ? all.slice(0, LIMIT) : all;
  const more = document.getElementById('moreWrap');
  if (more) more.hidden = !(LIMIT && all.length > LIMIT);
  grid.innerHTML = list.length ? list.map(p => `
    <a class="card reveal" href="/p/${esc(p.id)}" data-id="${esc(p.id)}" aria-label="View details for ${esc(p.name)}">
      <div class="card-media">
        <span class="tag">${esc(p.tag)}</span>
        <img src="${esc(imgOf(p))}" alt="${esc(p.name)}" width="820" height="620" loading="lazy" />
      </div>
      <div class="card-body">
        <h3>${esc(p.name)}</h3>
        <p class="card-cat">${esc(p.labels)}</p>
        <span class="card-more">Read More ${arrow}</span>
      </div>
    </a>`).join('')
    : `<p class="empty">No products match that search. Try another word, or email us and we will help.</p>`;

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

/* ---- category links follow the catalogue ----
   The pages carry the category links and filter tabs as written. When the
   categories are changed in the admin (added, renamed, reordered), the links
   and tabs are rebuilt from the catalogue so they always match. */
(function syncCategoryLinks() {
  const keys = CATEGORIES.map(c => c.key).join('|');
  const groups = new Set([...document.querySelectorAll('a[data-jump]')].map(a => a.parentElement));
  groups.forEach(parent => {
    const links = [...parent.querySelectorAll(':scope > a[data-jump]')];
    if (!links.length || links.map(a => a.dataset.jump).join('|') === keys) return;
    const first = links[0];
    CATEGORIES.forEach(c => {
      const a = document.createElement('a');
      a.href = '/c/' + c.key;
      a.dataset.jump = c.key;
      a.textContent = c.name;
      parent.insertBefore(a, first);
    });
    links.forEach(a => a.remove());
  });
  const tabs = document.getElementById('tabs');
  if (tabs) {
    const now = [...tabs.querySelectorAll('.tab:not([data-filter="all"])')];
    if (now.map(b => b.dataset.filter).join('|') !== keys) {
      now.forEach(b => b.remove());
      CATEGORIES.forEach(c => {
        const b = document.createElement('button');
        b.className = 'tab';
        b.dataset.filter = c.key;
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', 'false');
        b.textContent = c.name;
        tabs.appendChild(b);
      });
    }
  }
})();

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
  if (!document.getElementById('collection')) { window.location.href = '/c/' + cat; return; }
  input.value = '';
  query = '';
  suggest.hidden = true;
  const btn = document.querySelector(`.tab[data-filter="${cat}"]`);
  if (btn) btn.click(); else render();
  document.getElementById('collection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
/* Links are real pages; a plain click stays on the page and filters or opens
   the details in place. A click with a modifier key opens the page. */
const plainClick = e => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button);
document.addEventListener('click', e => {
  if (!plainClick(e)) return;
  const j = e.target.closest('[data-jump]');
  if (j) { e.preventDefault(); jumpTo(j.dataset.jump); return; }
  const o = e.target.closest('[data-open]');
  if (o && sheet) { e.preventDefault(); openSheet(o.dataset.open); }
});

/* ---- search ---- */
function renderSuggest() {
  const q = input.value.trim().toLowerCase();
  if (!q) { suggest.hidden = true; return; }
  const hits = PRODUCTS.filter(p => (p.name + ' ' + p.labels).toLowerCase().includes(q)).slice(0, 5);
  suggest.innerHTML = hits.length
    ? hits.map(p => `<a href="/p/${esc(p.id)}" data-open="${esc(p.id)}"><img src="${esc(imgOf(p))}" alt="" aria-hidden="true" /><span><strong>${esc(p.name)}</strong><small>${esc(p.labels)}</small></span></a>`).join('')
    : '<p>No products match that search.</p>';
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
  if (!grid) return;  // product pages: the form goes to /products?q=
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
  sheetImg.src = imgOf(p);
  sheetImg.alt = p.name;
  document.getElementById('sheetCat').textContent = p.labels;
  document.getElementById('sheetTitle').textContent = p.name;
  document.getElementById('sheetDesc').textContent = p.desc;
  document.getElementById('sheetSpec').innerHTML = (p.spec || []).map(s => `<li><span>${esc(s[0])}</span><span>${esc(s[1])}</span></li>`).join('');
  document.getElementById('sheetWa').href =
    `mailto:germanplusgs@gmail.com?subject=${encodeURIComponent('Enquiry: ' + p.name)}&body=${encodeURIComponent('Hello German Plus, I would like details on the ' + p.name + '.')}`;
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
if (grid) grid.addEventListener('click', e => {
  const card = e.target.closest('.card');
  if (card && plainClick(e)) { e.preventDefault(); openSheet(card.dataset.id); }
});
if (sheet) sheet.addEventListener('click', e => { if (e.target.hasAttribute('data-close')) closeSheet(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheet && !sheet.hidden) closeSheet(); });

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
  const c = params.get('cat') || document.body.dataset.cat;
  const q = params.get('q');
  if (q) { input.value = q; query = q.trim().toLowerCase(); }
  if (c) {
    const btn = document.querySelector(`.tab[data-filter="${c}"]`);
    if (btn) { document.querySelectorAll('.tab').forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-selected','false'); }); btn.classList.add('is-active'); btn.setAttribute('aria-selected','true'); activeFilter = c; }
  }
  if (c || q) render();
})();
