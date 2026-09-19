const WA = '233245466925';

const PRODUCTS = [
  {
    id: 'microwave-25l',
    name: 'GP Microwave Digital 25L',
    cat: 'kitchen',
    tag: 'Kitchen',
    short: 'Digital 25 litre microwave with preset cooking programmes.',
    desc: 'A 25 litre digital microwave built for daily family cooking. Touch controls, preset programmes and a clear interior light, finished in matte black so it sits quietly on an open counter.',
    spec: [['Capacity', '25 litres'], ['Control', 'Digital touch panel'], ['Programmes', 'Preset auto cook'], ['Finish', 'Matte black']]
  },
  {
    id: 'air-fryer-6-5l',
    name: 'GP Air Fryer 6.5L',
    cat: 'kitchen',
    tag: 'Kitchen',
    short: 'Large 6.5 litre basket with a viewing window and steel trim.',
    desc: 'A 6.5 litre air fryer sized for a full family meal in one basket. Rapid hot air circulation, a viewing window on the drawer and a brushed steel front that wipes clean.',
    spec: [['Capacity', '6.5 litres'], ['Drawer', 'Viewing window'], ['Body', 'Steel and matte black'], ['Use', 'Fry, roast, bake']]
  },
  {
    id: 'food-processor',
    name: 'GP Food Processor',
    cat: 'kitchen',
    tag: 'Kitchen',
    short: 'Multi jar processor for blending, milling and food prep.',
    desc: 'A complete food preparation set: a large blending jar, a processing bowl with blade and a compact mill jar, all driven from one stainless steel motor base with dial and preset controls.',
    spec: [['Jars', 'Blend, process, mill'], ['Base', 'Stainless steel'], ['Control', 'Dial and presets'], ['Use', 'Daily food prep']]
  },
  {
    id: 'blender',
    name: 'GP Blender',
    cat: 'kitchen',
    tag: 'Kitchen',
    short: 'Compact counter blender with a clear jar and dial control.',
    desc: 'A compact everyday blender with a clear measuring jar, sealed lid and a single dial for speed and pulse. Small enough to stay on the counter, strong enough for daily smoothies and sauces.',
    spec: [['Jar', 'Clear, measured'], ['Control', 'Dial with pulse'], ['Finish', 'White and black'], ['Use', 'Smoothies and sauces']]
  },
  {
    id: 'slow-juicer',
    name: 'GP Slow Juicer',
    cat: 'kitchen',
    tag: 'Kitchen',
    short: 'Cold press juicer with separate juice and pulp containers.',
    desc: 'A slow cold press juicer that turns fruit and vegetables gently, keeping more of the pulp and flavour in the glass. Wide feed chute, separate juice and pulp containers and a simple two part cleanup.',
    spec: [['Method', 'Cold press'], ['Containers', 'Juice and pulp'], ['Feed', 'Wide chute'], ['Finish', 'Gloss red']]
  },
  {
    id: 'kettle-2-5l',
    name: 'GP Kettle 2.5L (HO-2585)',
    cat: 'kitchen',
    tag: 'Beverage',
    short: 'Insulated 2.5 litre electric kettle that holds heat after boiling.',
    desc: 'A 2.5 litre electric kettle with an insulated flask body, so water stays hot long after it boils. Push top pour, concealed element and a champagne gold finish.',
    spec: [['Capacity', '2.5 litres'], ['Body', 'Insulated flask'], ['Model', 'HO-2585'], ['Finish', 'Champagne gold']]
  },
  {
    id: 'steam-iron',
    name: 'GP Steam Iron V35',
    cat: 'home',
    tag: 'Home care',
    short: 'Steam iron with variable control and a large water tank.',
    desc: 'A steam iron with a non stick soleplate, variable steam and temperature dial, burst and spray functions and a generous water tank, so a full basket of shirts takes one fill.',
    spec: [['Model', 'V35'], ['Steam', 'Variable with burst'], ['Soleplate', 'Non stick, glide'], ['Extras', 'Spray function']]
  }
];

let io;
const grid = document.getElementById('productGrid');
const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M12.5 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function render(filter) {
  const list = filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.cat === filter);
  grid.innerHTML = list.map(p => `
    <button class="card reveal" data-id="${p.id}" aria-label="View details for ${p.name}">
      <div class="card-media">
        <span class="tag">${p.tag}</span>
        <img src="assets/products/${p.id}.webp" alt="${p.name}" width="560" height="440" loading="lazy" />
      </div>
      <div class="card-body">
        <h3>${p.name}</h3>
        <p>${p.short}</p>
        <span class="card-more">View details ${arrow}</span>
      </div>
    </button>`).join('');
  observeReveals();
}

render('all');

document.querySelectorAll('.pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(b => {
      b.classList.remove('is-active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('is-active');
    btn.setAttribute('aria-selected', 'true');
    render(btn.dataset.filter);
  });
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
  document.getElementById('sheetCat').textContent = p.tag;
  document.getElementById('sheetTitle').textContent = p.name;
  document.getElementById('sheetDesc').textContent = p.desc;
  document.getElementById('sheetSpec').innerHTML =
    p.spec.map(s => `<li><span>${s[0]}</span><span>${s[1]}</span></li>`).join('');
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
sheet.addEventListener('click', e => {
  if (e.target.hasAttribute('data-close')) closeSheet();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !sheet.hidden) closeSheet();
});

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

/* ---- header state ---- */
const head = document.querySelector('.site-head');
const onScroll = () => head.classList.toggle('is-stuck', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* ---- reveal ---- */
function observeReveals() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-in'));
    return;
  }
  if (!io) {
    io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  }
  document.querySelectorAll('.reveal:not(.is-in)').forEach(el => io.observe(el));
}
observeReveals();

document.getElementById('yr').textContent = new Date().getFullYear();
