const WA = '233506690190';

const PRODUCTS = [
  {
    id: 'microwave-25l',
    name: 'GP Microwave Digital 25L',
    cat: 'cooking',
    tag: 'Cooking',
    labels: 'Kitchen Appliances, Microwaves',
    short: 'Digital 25 litre microwave with preset cooking programmes.',
    desc: 'A 25 litre digital microwave built for daily family cooking. Touch controls, preset programmes and a clear interior light, finished in matte black so it sits quietly on an open counter.',
    spec: [['Capacity', '25 litres'], ['Control', 'Digital touch panel'], ['Programmes', 'Preset auto cook'], ['Finish', 'Matte black']]
  },
  {
    id: 'air-fryer-6-5l',
    name: 'GP Air Fryer 6.5L',
    cat: 'cooking',
    tag: 'Cooking',
    labels: 'Kitchen Appliances, Air Fryers',
    short: 'Large 6.5 litre basket with a viewing window and steel trim.',
    desc: 'A 6.5 litre air fryer sized for a full family meal in one basket. Rapid hot air circulation, a viewing window on the drawer and a brushed steel front that wipes clean.',
    spec: [['Capacity', '6.5 litres'], ['Drawer', 'Viewing window'], ['Body', 'Steel and matte black'], ['Use', 'Fry, roast, bake']]
  },
  {
    id: 'food-processor',
    name: 'GP Food Processor',
    cat: 'prep',
    tag: 'Food Preparation',
    labels: 'Kitchen Appliances, Food Processors',
    short: 'Multi jar processor for blending, milling and food prep.',
    desc: 'A complete food preparation set: a large blending jar, a processing bowl with blade and a compact mill jar, all driven from one stainless steel motor base with dial and preset controls.',
    spec: [['Jars', 'Blend, process, mill'], ['Base', 'Stainless steel'], ['Control', 'Dial and presets'], ['Use', 'Daily food prep']]
  },
  {
    id: 'blender',
    name: 'GP Blender',
    cat: 'prep',
    tag: 'Food Preparation',
    labels: 'Kitchen Appliances, Blenders',
    short: 'Compact counter blender with a clear jar and dial control.',
    desc: 'A compact everyday blender with a clear measuring jar, sealed lid and a single dial for speed and pulse. Small enough to stay on the counter, strong enough for daily smoothies and sauces.',
    spec: [['Jar', 'Clear, measured'], ['Control', 'Dial with pulse'], ['Finish', 'White and black'], ['Use', 'Smoothies and sauces']]
  },
  {
    id: 'slow-juicer',
    name: 'GP Slow Juicer',
    cat: 'prep',
    tag: 'Food Preparation',
    labels: 'Kitchen Appliances, Juicers',
    short: 'Cold press juicer with separate juice and pulp containers.',
    desc: 'A slow cold press juicer that turns fruit and vegetables gently, keeping more of the pulp and flavour in the glass. Wide feed chute, separate juice and pulp containers and a simple two part cleanup.',
    spec: [['Method', 'Cold press'], ['Containers', 'Juice and pulp'], ['Feed', 'Wide chute'], ['Finish', 'Gloss red']]
  },
  {
    id: 'kettle-2-5l',
    name: 'GP Kettle 2.5L (HO-2585)',
    cat: 'beverage',
    tag: 'Beverage',
    labels: 'Kitchen Appliances, Jugs & Kettles',
    short: 'Insulated 2.5 litre electric kettle that holds heat after boiling.',
    desc: 'A 2.5 litre electric kettle with an insulated flask body, so water stays hot long after it boils. Push top pour, concealed element and a champagne gold finish.',
    spec: [['Capacity', '2.5 litres'], ['Body', 'Insulated flask'], ['Model', 'HO-2585'], ['Finish', 'Champagne gold']]
  },
  {
    id: 'steam-iron',
    name: 'GP Steam Iron V35',
    cat: 'home',
    tag: 'Home Care',
    labels: 'Home Appliances, Dry & Steam Irons',
    short: 'Steam iron with variable control and a large water tank.',
    desc: 'A steam iron with a non stick soleplate, variable steam and temperature dial, burst and spray functions and a generous water tank, so a full basket of shirts takes one fill.',
    spec: [['Model', 'V35'], ['Steam', 'Variable with burst'], ['Soleplate', 'Non stick, glide'], ['Extras', 'Spray function']]
  }
];

const CATEGORIES = [
  { key: 'cooking',  name: 'Cooking',          img: 'microwave-25l' },
  { key: 'prep',     name: 'Food Preparation', img: 'food-processor' },
  { key: 'beverage', name: 'Beverage',         img: 'kettle-2-5l' },
  { key: 'home',     name: 'Home Care',        img: 'steam-iron' }
];

const form = document.getElementById('searchForm');
const input = document.getElementById('searchInput');
const suggest = document.getElementById('suggest');
const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M12.5 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const grid = document.getElementById('productGrid');
const note = document.getElementById('resultNote');
let io;

/* ---- categories ---- */
document.getElementById('cats').innerHTML = CATEGORIES.map(c => {
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

function render() {
  const list = PRODUCTS.filter(matches);
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

  if (query) {
    note.hidden = false;
    note.textContent = `${list.length} result${list.length === 1 ? '' : 's'} for "${query}"`;
  } else {
    note.hidden = true;
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
