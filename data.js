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
