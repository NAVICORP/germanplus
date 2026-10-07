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
    id: 'air-fryer-dual-11-6l',
    name: 'GP Dual Air Fryer 11.6L',
    cat: 'cooking',
    tag: 'Cooking',
    labels: 'Kitchen Appliances, Air Fryers',
    short: 'Two independent baskets, 11.6 litres of total capacity.',
    desc: 'Two separate drawers in one body, so a main and a side cook at the same time at their own temperature. A digital panel across the top controls both baskets, in an all black finish.',
    spec: [['Capacity', '11.6 litres total'], ['Baskets', 'Two, independent'], ['Control', 'Digital touch panel'], ['Finish', 'Gloss black']]
  },
  {
    id: 'electric-oven-50l',
    name: 'GP Electric Oven 50L',
    cat: 'cooking',
    tag: 'Cooking',
    labels: 'Kitchen Appliances, Ovens',
    short: '50 litre electric oven with two hotplates on top.',
    desc: 'A 50 litre countertop electric oven with a glass door, wire rack and baking tray, plus two sealed hotplates on the top panel. Four dials set temperature, function, timer and the plates.',
    spec: [['Capacity', '50 litres'], ['Hotplates', 'Two, top mounted'], ['Control', 'Four dials with timer'], ['Finish', 'Matte black']]
  },
  {
    id: 'blender-3in1',
    name: 'GP Multifunctional Blender 3 in 1',
    cat: 'prep',
    tag: 'Food Preparation',
    labels: 'Kitchen Appliances, Blenders',
    short: 'Stainless base with blending, chopping and milling jars.',
    desc: 'A complete preparation set on one stainless steel motor base: a tall blending jar, a chopping bowl with blade and a compact mill jar, changed over in a twist. Dial and preset controls on the front.',
    spec: [['Jars', 'Blend, chop, mill'], ['Base', 'Stainless steel'], ['Control', 'Dial and presets'], ['Use', 'Daily food prep']]
  },
  {
    id: 'blender-4in1',
    name: 'GP Multifunctional Blender 4 in 1',
    cat: 'prep',
    tag: 'Food Preparation',
    labels: 'Kitchen Appliances, Blenders',
    short: 'Four attachments on a single black and chrome base.',
    desc: 'A four piece set on one rounded motor base: a food processing bowl, a 2 litre measured blending jar, a mill jar and a chopper attachment. Chrome dial control, finished in gloss black.',
    spec: [['Attachments', 'Four'], ['Blending jar', '2 litres, measured'], ['Control', 'Chrome dial'], ['Finish', 'Gloss black and chrome']]
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
    id: 'kettle-2585',
    name: 'GP Electric Kettle 2585',
    cat: 'beverage',
    tag: 'Beverage',
    labels: 'Kitchen Appliances, Jugs & Kettles',
    short: 'Insulated electric kettle that holds heat long after boiling.',
    desc: 'An electric kettle with an insulated flask body, so water stays hot long after it boils. Push top pour, concealed element and a champagne gold finish.',
    spec: [['Model', '2585'], ['Body', 'Insulated flask'], ['Pour', 'Push top'], ['Finish', 'Champagne gold']]
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
    id: 'stand-mixer-12-8l',
    name: 'Avinas Stand Mixer 12.8L',
    cat: 'prep',
    tag: 'Food Preparation',
    labels: 'Kitchen Appliances, Stand Mixers',
    short: 'Tilt head stand mixer with a 12.8 litre stainless bowl.',
    desc: 'A tilt head stand mixer with a 12.8 litre stainless steel bowl, built for dough, batter and cream in quantity. Whisk, beater and hook attachments with a speed dial on the body.',
    spec: [['Bowl', '12.8 litres, stainless'], ['Head', 'Tilt back'], ['Attachments', 'Whisk, beater, hook'], ['Control', 'Speed dial']]
  },
  {
    id: 'fufu-machine-7-5l',
    name: 'Avinas Fufu Machine 7.5L',
    cat: 'prep',
    tag: 'Food Preparation',
    labels: 'Kitchen Appliances, Fufu Machines',
    short: '7.5 litre stainless bowl for pounding fufu at home.',
    desc: 'A 7.5 litre fufu machine with a stainless steel bowl and a sealed drive head, built to pound cassava and plantain without the mortar. Lift off lid for loading and a wide base that stays put.',
    spec: [['Capacity', '7.5 litres'], ['Bowl', 'Stainless steel'], ['Head', 'Lift off lid'], ['Use', 'Fufu and heavy dough']]
  },
  {
    id: 'gas-cooker-50-50',
    name: 'GP 50/50 Gas Stove (Model 3000)',
    cat: 'cooking',
    tag: 'Cooking',
    labels: 'Home Appliances, Cookers',
    short: 'Four burner gas stove with an oven and a splash back.',
    desc: 'A free standing 50 by 50 gas cooker with four burners, a glass front oven below and a folding splash back. Front dial controls and levelling feet, finished in black.',
    spec: [['Model', '3000'], ['Size', '50 by 50'], ['Burners', 'Four'], ['Oven', 'Glass front with rack']]
  },
  {
    id: 'gas-burner-2in1',
    name: 'GP Stainless 2 in 1 Gas Burner',
    cat: 'cooking',
    tag: 'Cooking',
    labels: 'Home Appliances, Gas Burners',
    short: 'Table top double burner with a stainless body.',
    desc: 'A table top gas burner with two independent rings, cast pan supports and a stainless steel body under a printed enamel top. Front dials for each ring, sized to sit on a worktop.',
    spec: [['Burners', 'Two, independent'], ['Body', 'Stainless steel'], ['Supports', 'Cast pan stands'], ['Type', 'Table top']]
  },
  {
    id: 'hotplate-double',
    name: 'Starlux Double Hotplate',
    cat: 'cooking',
    tag: 'Cooking',
    labels: 'Home Appliances, Hotplates',
    short: 'Two sealed electric plates on one low profile body.',
    desc: 'A double electric hotplate with two sealed cast plates, each on its own dial with an indicator light. A low profile body in brown, for a small kitchen, a hostel room or a back up to gas.',
    spec: [['Plates', 'Two, sealed cast'], ['Control', 'Dial per plate'], ['Indicator', 'Power light'], ['Finish', 'Brown']]
  },
  {
    id: 'hotplate-single',
    name: 'Single Hotplate',
    cat: 'cooking',
    tag: 'Cooking',
    labels: 'Home Appliances, Hotplates',
    short: 'Compact single coil hotplate with a variable dial.',
    desc: 'A compact single hotplate with an exposed coil element and a variable heat dial, light enough to move and small enough to store. Finished in white with an indicator light.',
    spec: [['Plates', 'One, coil element'], ['Control', 'Variable dial'], ['Indicator', 'Power light'], ['Finish', 'White']]
  },
  {
    id: 'kettle-2583',
    name: 'GP Electric Kettle 2583',
    cat: 'beverage',
    tag: 'Beverage',
    labels: 'Kitchen Appliances, Jugs & Kettles',
    short: 'Insulated kettle with a digital panel and keep warm.',
    desc: 'An insulated electric kettle with a digital front panel and a flask body that holds temperature after boiling. Push top pour and a concealed element, finished in dark steel.',
    spec: [['Model', '2583'], ['Body', 'Insulated flask'], ['Panel', 'Digital front'], ['Finish', 'Dark steel']]
  },
  {
    id: 'flask-3l',
    name: 'Flask 3L',
    cat: 'beverage',
    tag: 'Beverage',
    labels: 'Home & Living, Vacuum Flasks',
    short: '3 litre vacuum flask with a cup lid and carry handle.',
    desc: 'A 3 litre vacuum flask that keeps drinks hot or cold through the day. Screw stopper under a cup lid, a side handle for pouring and a hard outer shell for travel.',
    spec: [['Capacity', '3 litres'], ['Type', 'Vacuum insulated'], ['Lid', 'Cup top with stopper'], ['Handle', 'Side carry']]
  },
  {
    id: 'cookware-set-16pc',
    name: 'Cookware Set 16 Pieces',
    cat: 'cookware',
    tag: 'Cookware',
    labels: 'Home & Living, Cookware Sets',
    short: 'Sixteen piece granite coated set with glass lids.',
    desc: 'A sixteen piece cookware set in graduated sizes, with a granite effect non stick coating, tempered glass lids and steel rims. Casseroles and a deep pot, stacking down for storage.',
    spec: [['Pieces', '16'], ['Coating', 'Granite effect non stick'], ['Lids', 'Tempered glass'], ['Finish', 'Copper speckle']]
  },
  {
    id: 'dinner-set-16pc',
    name: 'Melamine Dinner Set 16 Pieces',
    cat: 'cookware',
    tag: 'Cookware',
    labels: 'Home & Living, Dinner Sets',
    short: 'Sixteen piece melamine set in a soft blue.',
    desc: 'A sixteen piece melamine dinner set: square dinner plates, side plates, bowls and mugs in a soft blue. Light to handle, hard wearing and suited to everyday family use.',
    spec: [['Pieces', '16'], ['Material', 'Melamine'], ['Includes', 'Plates, bowls, mugs'], ['Finish', 'Soft blue']]
  },
  {
    id: 'kitchen-stand-5-tier',
    name: 'Kitchen Stand 5 Tier',
    cat: 'cookware',
    tag: 'Cookware',
    labels: 'Home & Living, Kitchen Storage',
    short: 'Five tier folding kitchen rack on castor wheels.',
    desc: 'A five tier kitchen rack that folds flat for storage and rolls on castor wheels. A powder coated steel frame with mesh shelves, for pots, produce or dry goods in a tight kitchen.',
    spec: [['Tiers', 'Five'], ['Frame', 'Powder coated steel'], ['Mobility', 'Castor wheels'], ['Storage', 'Folds flat']]
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
  { key: 'cooking',  name: 'Cooking',             img: 'microwave-25l' },
  { key: 'prep',     name: 'Food Preparation',    img: 'blender-3in1' },
  { key: 'beverage', name: 'Beverage',            img: 'kettle-2585' },
  { key: 'cookware', name: 'Cookware & Tableware', img: 'cookware-set-16pc' },
  { key: 'home',     name: 'Home Care',           img: 'steam-iron' }
];
