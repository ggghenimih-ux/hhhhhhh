import { Category, Product, Order } from '../types';

export const CATEGORIES_DATA: Category[] = [
  {
    id: 'equipments-tools',
    name: {
      fr: 'Outils & Équipements',
      ar: 'أدوات ومعدات الصيانة',
      en: 'Equipment & Hand Tools'
    },
    slug: 'equipments-tools',
    iconName: 'Wrench',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    description: {
      fr: 'Tournevis de précision, pinces brucelles, pochoirs BGA, supports cartes mères PCB et organisateurs.',
      ar: 'مفكات دقيقة، ملاقط تيتانيوم، شابلونات BGA، وحوامل لوحات الكترونية PCB.',
      en: 'Precision screwdrivers, tweezers, BGA stencils, PCB fixtures, and workshop organizers.'
    },
    order: 1,
    subcategories: [
      { id: 'bga-stencil', categoryId: 'equipments-tools', name: { fr: 'Pochoirs BGA (Stencils)', ar: 'شابلونات BGA', en: 'BGA Stencils' }, slug: 'bga-stencil', order: 1 },
      { id: 'hand-tools', categoryId: 'equipments-tools', name: { fr: 'Outils à main (Tournevis/Brucelles)', ar: 'أدوات يدوية وملاقط', en: 'Hand Tools' }, slug: 'hand-tools', order: 2 },
      { id: 'pcb-fixture', categoryId: 'equipments-tools', name: { fr: 'Supports PCB & Pinces Fixation', ar: 'حوامل PCB واللوحات', en: 'PCB Fixtures & Clamps' }, slug: 'pcb-fixture', order: 3 },
      { id: 'tool-organizer', categoryId: 'equipments-tools', name: { fr: 'Organisateurs & Boîtes de rangement', ar: 'منظمات وصناديق الأدوات', en: 'Tool Organizers' }, slug: 'tool-organizer', order: 4 },
    ]
  },
  {
    id: 'soldering-hot-air',
    name: {
      fr: 'Soudure & Air Chaud',
      ar: 'محطات اللحام والهواء الساخن',
      en: 'Soldering & Hot Air'
    },
    slug: 'soldering-hot-air',
    iconName: 'Flame',
    image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=600&q=80',
    description: {
      fr: 'Stations air chaud professionnelles, fers à souder nano C210/C245/T12, pannes et tapis chauffants.',
      ar: 'محطات هواء ساخن دقيقة، كوايات لحام سريعة التسخين، رؤوس كواية، ومنصات تسخين.',
      en: 'Hot air rework stations, soldering irons, tips, flux, heating pads, and desoldering pumps.'
    },
    order: 2,
    subcategories: [
      { id: 'soldering-irons', categoryId: 'soldering-hot-air', name: { fr: 'Fers & Stations à souder', ar: 'كوايات ومحطات لحام', en: 'Soldering Stations' }, slug: 'soldering-irons', order: 1 },
      { id: 'hot-air-guns', categoryId: 'soldering-hot-air', name: { fr: 'Pistolets & Stations Air Chaud', ar: 'محطات هواء ساخن', en: 'Hot Air Guns' }, slug: 'hot-air-guns', order: 2 },
      { id: 'solder-paste-flux', categoryId: 'soldering-hot-air', name: { fr: 'Pâte à souder & Flux de soudure', ar: 'فلاكس وقصدير سائل', en: 'Solder Paste & Flux' }, slug: 'solder-paste-flux', order: 3 },
      { id: 'soldering-tips', categoryId: 'soldering-hot-air', name: { fr: 'Pannes & Tresses à dessouder', ar: 'رؤوس كواية وشريط سحب', en: 'Soldering Tips & Wicks' }, slug: 'soldering-tips', order: 4 },
      { id: 'heating-pads', categoryId: 'soldering-hot-air', name: { fr: 'Plaques & Tapis Chauffants', ar: 'منصات وسخانات حرارية', en: 'Heating Pads' }, slug: 'heating-pads', order: 5 },
    ]
  },
  {
    id: 'microscopes',
    name: {
      fr: 'Microscopes & Optique',
      ar: 'الميكروسكوبات والعدسات',
      en: 'Microscopes & Optics'
    },
    slug: 'microscopes',
    iconName: 'Eye',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
    description: {
      fr: 'Microscopes stéréo trinoculaires 7X-45X avec caméra HDMI 4K, microscopes digitaux et bras articulés.',
      ar: 'ميكروسكوبات ثلاثية العيون بدقة تكبير فائقة وكاميرات 4K عالية الوضوح مع أذرع متأرجحة.',
      en: 'Trinocular stereo microscopes, digital USB inspection, 4K HDMI cameras, and boom arms.'
    },
    order: 3,
    subcategories: [
      { id: 'stereo-microscopes', categoryId: 'microscopes', name: { fr: 'Microscopes Trinoculaires Stéréo', ar: 'ميكروسكوب استريو ثلاثي العيون', en: 'Stereo Microscopes' }, slug: 'stereo-microscopes', order: 1 },
      { id: 'digital-microscopes', categoryId: 'microscopes', name: { fr: 'Microscopes Numériques USB / HDMI', ar: 'ميكروسكوب رقمي USB / HDMI', en: 'Digital Microscopes' }, slug: 'digital-microscopes', order: 2 },
      { id: 'microscope-stands', categoryId: 'microscopes', name: { fr: 'Bras articulés & Socles lourds', ar: 'أذرع وقواعد ميكروسكوب', en: 'Stands & Boom Arms' }, slug: 'microscope-stands', order: 3 },
      { id: 'magnifying-glasses', categoryId: 'microscopes', name: { fr: 'Lampes Loupes & Oculaires', ar: 'عدسات ومكبرات إضاءة', en: 'Magnifiers & Lenses' }, slug: 'magnifying-glasses', order: 4 },
    ]
  },
  {
    id: 'measuring-power-supply',
    name: {
      fr: 'Alimentation & Mesure',
      ar: 'أجهزة القياس ومزودات الطاقة',
      en: 'Measuring & Power Supply'
    },
    slug: 'measuring-power-supply',
    iconName: 'Zap',
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
    description: {
      fr: 'Alimentations stabilisées DC de laboratoire, multimètres digitaux, testeurs de batterie et câbles de boot.',
      ar: 'باور سبلاي رقمي دقيق لكشف الشورت، أجهزة قياس أفو ميتر ديجيتال، وأجهزة فحص البطاريات.',
      en: 'DC bench power supplies, digital multimeters, smart battery testers, and voltage probes.'
    },
    order: 4,
    subcategories: [
      { id: 'power-supplies', categoryId: 'measuring-power-supply', name: { fr: 'Alimentations DC Stabilisées', ar: 'مزودات طاقة DC باور سبلاي', en: 'DC Power Supplies' }, slug: 'power-supplies', order: 1 },
      { id: 'digital-multimeters', categoryId: 'measuring-power-supply', name: { fr: 'Multimètres Numériques (Metrix)', ar: 'أفوميتر رقمي ديجيتال', en: 'Digital Multimeters' }, slug: 'digital-multimeters', order: 2 },
      { id: 'battery-testers', categoryId: 'measuring-power-supply', name: { fr: 'Testeurs de Batteries Smartphone', ar: 'أجهزة فحص وتنشيط البطارية', en: 'Battery Testers' }, slug: 'battery-testers', order: 3 },
      { id: 'voltage-testers', categoryId: 'measuring-power-supply', name: { fr: 'Testeurs USB & Analyseurs Courant', ar: 'فواحص الشحن ويو إس بي', en: 'USB & Voltage Testers' }, slug: 'voltage-testers', order: 4 },
    ]
  },
  {
    id: 'programming-flashing',
    name: {
      fr: 'Programmation & Flashing',
      ar: 'أجهزة البرمجة وتخطي الحسابات',
      en: 'Programming & Flashing'
    },
    slug: 'programming-flashing',
    iconName: 'Cpu',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    description: {
      fr: 'Boîtiers JCID, QianLi iCopy, programmeurs Nand/EEPROM, câbles DCSD/DFU et adaptateurs Face ID.',
      ar: 'بوكسات سوفت وير، مبرمجات JCID V1SE، نسخ شاشات تروتون، برمجة البطاريات وبصمة الوجه.',
      en: 'JCID, QianLi programmers, EEPROM programmers, TrueTone restorers, and DFU recovery tools.'
    },
    order: 5,
    subcategories: [
      { id: 'programming-boxes', categoryId: 'programming-flashing', name: { fr: 'Boîtes & Outils JCID / QianLi', ar: 'بوكسات ومبرمجات JCID', en: 'Programming Boxes' }, slug: 'programming-boxes', order: 1 },
      { id: 'boot-cables', categoryId: 'programming-flashing', name: { fr: 'Câbles Boot & Câbles DFU DCSD', ar: 'كابلات بوت وتشغيل الماذر بورد', en: 'Boot & DFU Cables' }, slug: 'boot-cables', order: 2 },
      { id: 'eeprom-programmers', categoryId: 'programming-flashing', name: { fr: 'Programmeurs Mémoire EEPROM/NAND', ar: 'مبرمجات الذاكرة والـ NAND', en: 'EEPROM Programmers' }, slug: 'eeprom-programmers', order: 3 },
    ]
  },
  {
    id: 'screen-refurbish',
    name: {
      fr: 'Séparateurs & Rénovation Écran',
      ar: 'معدات تجديد وفصل الشاشات',
      en: 'Screen Refurbish Tools'
    },
    slug: 'screen-refurbish',
    iconName: 'Smartphone',
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80',
    description: {
      fr: 'Séparateurs d’écran LCD à pompe à vide, machines de laminage OCA, fils de découpe en tungstène.',
      ar: 'أجهزة فصل الزجاج التالف بمضخة شفط هواء، آلات كبس وتفريغ الهواء OCA وأسلاك تقطيع الشاشة.',
      en: 'LCD screen separators, vacuum heating plates, OCA laminators, and molybdenum cutting wires.'
    },
    order: 6,
    subcategories: [
      { id: 'screen-separators', categoryId: 'screen-refurbish', name: { fr: 'Séparateurs LCD / Verre cassé', ar: 'أجهزة فصل شاشات اللمس', en: 'Screen Separators' }, slug: 'screen-separators', order: 1 },
      { id: 'lcd-repair-tools', categoryId: 'screen-refurbish', name: { fr: 'Outils Rénovation & Laminoirs', ar: 'أدوات ومكابس شاشات LCD', en: 'LCD Repair Tools' }, slug: 'lcd-repair-tools', order: 2 },
      { id: 'glass-cutting', categoryId: 'screen-refurbish', name: { fr: 'Fils de découpe & Poignées', ar: 'أسلاك ومقابض تقطيع الشاشة', en: 'Glass Cutting Wires' }, slug: 'glass-cutting', order: 3 },
    ]
  },
  {
    id: 'ic-chips',
    name: {
      fr: 'Puces & Circuits Intégrés (IC)',
      ar: 'دوائر متكاملة وإيسيهات (IC)',
      en: 'IC Chips & Semiconductors'
    },
    slug: 'ic-chips',
    iconName: 'Server',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
    description: {
      fr: 'Circuits intégrés neufs d’origine: IC Charge Tristar/Hydra, PMIC Power Management, Audio Codec, Wifi.',
      ar: 'إيسيهات شحن وتغذية أصلية، إيسي صوت، إيسي واي فاي وباور مانجمنت لمختلف الهواتف.',
      en: 'Power management ICs, charging ICs (Tristar/Hydra), Audio Codecs, and Baseband processors.'
    },
    order: 7,
    subcategories: [
      { id: 'power-management-ics', categoryId: 'ic-chips', name: { fr: 'IC Alimentation & Charge (PMIC)', ar: 'إيسيهات الباور والشحن', en: 'Power Management ICs' }, slug: 'power-management-ics', order: 1 },
      { id: 'audio-ics', categoryId: 'ic-chips', name: { fr: 'IC Audio & Codecs', ar: 'إيسيهات الصوت والترميز', en: 'Audio ICs' }, slug: 'audio-ics', order: 2 },
      { id: 'microcontrollers', categoryId: 'ic-chips', name: { fr: 'Microcontrôleurs & Processeurs', ar: 'متحكمات دقيقة ومعالجات', en: 'Microcontrollers' }, slug: 'microcontrollers', order: 3 },
    ]
  },
  {
    id: 'spare-parts',
    name: {
      fr: 'Pièces Détachées GSM',
      ar: 'قطع غيار الهواتف الأصلية',
      en: 'Spare Parts'
    },
    slug: 'spare-parts',
    iconName: 'Settings',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80',
    description: {
      fr: 'Écrans OLED/LCD d’origine, batteries haute capacité certifiées, connecteurs de charge, nappes flex.',
      ar: 'شاشات أوليد وشاشات أصلية، بطاريات معتمدة عالية الكفاءة، فلاتات شحن، ومنافذ تايب سي.',
      en: 'OEM OLED displays, replacement batteries, charging flex ribbons, microphones, and camera modules.'
    },
    order: 8,
    subcategories: [
      { id: 'batteries', categoryId: 'spare-parts', name: { fr: 'Batteries Smartphone Remplacement', ar: 'بطاريات هواتف عالية الجودة', en: 'Batteries' }, slug: 'batteries', order: 1 },
      { id: 'lcd-oled-screens', categoryId: 'spare-parts', name: { fr: 'Écrans LCD & Dalles OLED', ar: 'شاشات هواتف أصلية و OLED', en: 'Screens & OLED Displays' }, slug: 'lcd-oled-screens', order: 2 },
      { id: 'flex-cables', categoryId: 'spare-parts', name: { fr: 'Nappes Flex & Connecteurs de charge', ar: 'فلاتات ومنافذ شحن USB-C', en: 'Flex Cables & Connectors' }, slug: 'flex-cables', order: 3 },
    ]
  },
  {
    id: 'consumables',
    name: {
      fr: 'Consommables & Chimie',
      ar: 'المستهلكات والمواد الكيميائية',
      en: 'Consumables & Chemicals'
    },
    slug: 'consumables',
    iconName: 'Sparkles',
    image: 'https://images.unsplash.com/photo-1603555501671-8f96b3fce8b4?auto=format&fit=crop&w=600&q=80',
    description: {
      fr: 'Alcool Isopropylique 99.9%, pâte thermique haute conductivité, colle B7000/T7000, rubans Kapton.',
      ar: 'كحول إيزوبروبيل نقي 99%، معجون تبريد حراري، غراء شاشات B7000، وأشرطة كابتون عازلة للحرارة.',
      en: 'High purity Isopropyl alcohol, thermal paste, UV curable solder mask, Kapton tapes, and cleaning wipes.'
    },
    order: 9,
    subcategories: [
      { id: 'cleaning-solutions', categoryId: 'consumables', name: { fr: 'Alcool Isopropylique & Nettoyants PCB', ar: 'كحول إيزوبروبيلي ومذيبات', en: 'Cleaning Solutions & IPA' }, slug: 'cleaning-solutions', order: 1 },
      { id: 'thermal-paste', categoryId: 'consumables', name: { fr: 'Pâte Thermique & Dissipateurs', ar: 'معجون تبريد حراري', en: 'Thermal Paste' }, slug: 'thermal-paste', order: 2 },
      { id: 'flux-solder', categoryId: 'consumables', name: { fr: 'Flux de soudure & Étain 63/37', ar: 'مساعد لحام وقصدير ممتاز', en: 'Flux & Solder Wires' }, slug: 'flux-solder', order: 3 },
      { id: 'protective-pads', categoryId: 'consumables', name: { fr: 'Tapis Silicone Antistatique & Adhésifs', ar: 'عوازل سيليكون وشريط كابتون', en: 'Silicone Pads & Tapes' }, slug: 'protective-pads', order: 4 },
    ]
  },
  {
    id: 'accessories',
    name: {
      fr: 'Accessoires & Câbles',
      ar: 'إكسسوارات وكوابل الشحن',
      en: 'Accessories & Cables'
    },
    slug: 'accessories',
    iconName: 'Headphones',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    description: {
      fr: 'Chargeurs rapides GaN 65W/100W, câbles Type-C résistants, adaptateurs OTG et écouteurs de test.',
      ar: 'شواحن GaN فائقة السرعة، كابلات شحن معتمدة، وصلات OTG ومستلزمات الحماية.',
      en: 'GaN fast chargers, heavy duty Type-C cables, OTG adapters, and audio accessories.'
    },
    order: 10,
    subcategories: [
      { id: 'phone-chargers', categoryId: 'accessories', name: { fr: 'Chargeurs Rapides & Câbles Renforcés', ar: 'شواحن سريعة وكوابل شحن', en: 'Chargers & Cables' }, slug: 'phone-chargers', order: 1 },
      { id: 'usb-adapters', categoryId: 'accessories', name: { fr: 'Adaptateurs USB & OTG', ar: 'محولات USB و OTG', en: 'USB Adapters' }, slug: 'usb-adapters', order: 2 },
      { id: 'phone-cases', categoryId: 'accessories', name: { fr: 'Coques & Verres Trempés Antichoc', ar: 'أغطية وحماية شاشات', en: 'Cases & Protectors' }, slug: 'phone-cases', order: 3 },
    ]
  }
];

export const PRODUCTS_DATA: Product[] = [
  // 1. SOLDERING & HOT AIR
  {
    id: 'prod-quick-861dw',
    sku: 'QUICK-861DW-1000W',
    name: {
      fr: 'Station à Air Chaud QUICK 861DW Originale 1000W',
      ar: 'محطة هواء ساخن أصلية كويك QUICK 861DW قوة 1000W',
      en: 'QUICK 861DW Original 1000W Lead-Free Hot Air Rework Station'
    },
    description: {
      fr: 'La référence absolue des ateliers de réparation GSM. Puissance de 1000W, débit d’air vortex jusqu’à 120L/min, 3 canaux mémoires programmables CH1, CH2, CH3, et système de veille automatique au reposoir.',
      ar: 'المحطة الأشهر عالمياً لدى فنيي صيانة الهواتف. قوة 1000 واط مع تدفق هواء حلزوني يصل إلى 120 لتر/دقيقة، 3 قنوات تخزين للحرارة CH1/CH2/CH3، ونظام تبريد وتوقف تلقائي عند وضع المقبض على الحامل.',
      en: 'The industry benchmark for smartphone PCB micro-soldering. 1000W ultra-high power, vortex airflow up to 120L/min, 3 user-programmable channels, magnetic auto-sleep.'
    },
    category: 'soldering-hot-air',
    subcategory: 'hot-air-guns',
    price: 890.0,
    originalPrice: 980.0,
    discount: 9,
    stock: 7,
    images: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    ],
    specifications: {
      brand: 'QUICK',
      model: '861DW Professional',
      power: '1000W',
      voltage: '220V AC 50Hz',
      temperatureRange: '100°C - 500°C',
      airVolume: '1 - 120 L/min',
      weight: '4.65 Kg',
      warranty: '12 Mois Garantie Tunisie',
      countryOfOrigin: 'Original Certified'
    },
    rating: 4.95,
    reviewsCount: 38,
    tags: ['Best Seller', 'Pro Station', 'Hot Air', 'Quick'],
    isHot: true,
    isFeatured: true,
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-03-15T12:00:00Z'
  },
  {
    id: 'prod-aixun-t3a',
    sku: 'AIXUN-T3A-T12-C245',
    name: {
      fr: 'Station de Soudage Intelligente AiXun T3A 200W (Support T245 & T12)',
      ar: 'محطة لحام ذكية AiXun T3A قوة 200W تدعم أيادي T245 و T12',
      en: 'AiXun T3A 200W Smart Micro-Soldering Station (T245 / T12 Compatible)'
    },
    description: {
      fr: 'Montée en température ultra-rapide en 2 secondes chrono. Écran couleur HD IPS de 2.4 pouces, reconnaissance automatique des poignées, mise à jour du firmware par USB et contrôle précis de la température PID.',
      ar: 'تسخين فائق السرعة خلال ثانيتين فقط حتى 380 درجة. شاشة ملونة عالية الدقة 2.4 بوصة، تعرف ذكي على نوع يد الكواية T12/T245، إمكانية التحديث عبر الحاسوب وثبات حراري متناهي الدقة.',
      en: 'Ultra-fast 2-second heat-up to 380°C. 2.4-inch color IPS screen, smart tip recognition, PID intelligent temperature control, and firmware updates via PC.'
    },
    category: 'soldering-hot-air',
    subcategory: 'soldering-irons',
    price: 460.0,
    originalPrice: 520.0,
    discount: 12,
    stock: 12,
    images: [
      'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { id: 'v1', name: 'Version Poignée', value: 'Avec Poignée T245 (3 Pannes incluses)', priceAdjustment: 0 },
      { id: 'v2', name: 'Version Poignée', value: 'Double Poignée T245 + T12 Pack Complet', priceAdjustment: 95 }
    ],
    specifications: {
      brand: 'AiXun (JCID Tech)',
      model: 'T3A 200W',
      power: '200W Peak',
      voltage: '220V',
      temperatureRange: '100°C - 500°C',
      warranty: '12 Mois Tunisie',
      heatingSpeed: '2 Secondes'
    },
    rating: 4.9,
    reviewsCount: 24,
    tags: ['Soudure', 'T245', 'AiXun', 'New'],
    isNew: true,
    isFeatured: true,
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-03-20T14:00:00Z'
  },
  {
    id: 'prod-relife-rl-m3t',
    sku: 'RELIFE-RL-M3T-B1-4K',
    name: {
      fr: 'Microscope Stéréo Trinoculaire RELIFE RL-M3T avec Caméra 4K HDMI',
      ar: 'ميكروسكوب ريلايف ثلاثي العيون RELIFE RL-M3T مع كاميرا 4K HDMI',
      en: 'RELIFE RL-M3T Trinocular Stereo Zoom Microscope with 4K HDMI Camera'
    },
    description: {
      fr: 'Grossissement continu de 7X à 45X avec oculaires grand angle WF10X/20mm. Équipé d’un éclairage LED circulaire réglable, base métallique stable et tête pivotante à 360° pour le micro-jumper et rebillage GSM.',
      ar: 'تكبير مستمر من 7X إلى 45X مع عدسات واسعة المجال WF10X/20mm. مزود بإضاءة دائرية LED قابلة للتحكم، قاعدة معدنية عريضة مريحة، ورأس قابل للدوران 360 درجة مثالي لعمل مسارات البريدج والشبلنة.',
      en: 'Continuous zoom 7X-45X magnification, ultra widefield eyepieces WF10X/20. Includes adjustable ring LED light, heavy base plate, and full 4K HDMI output for repair broadcasting.'
    },
    category: 'microscopes',
    subcategory: 'stereo-microscopes',
    price: 1390.0,
    originalPrice: 1550.0,
    discount: 10,
    stock: 4,
    images: [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { id: 'm1', name: 'Socle', value: 'Base Standard B1 + Lumière LED', priceAdjustment: 0 },
      { id: 'm2', name: 'Socle', value: 'Pack Pro avec Bras Articulé Double STL2', priceAdjustment: 280 }
    ],
    specifications: {
      brand: 'RELIFE / Sunshine',
      model: 'RL-M3T-B1 Trinoculaire',
      magnification: '7X - 45X Zoom continu',
      eyepieces: 'WF10X / 20mm',
      workingDistance: '100mm (extensible à 165mm avec lentille 0.5X)',
      camera: 'Option 4K HDMI 48MP',
      warranty: '12 Mois'
    },
    rating: 5.0,
    reviewsCount: 19,
    tags: ['Microscope', 'Relife', 'Trinoculaire', 'Pro Lab'],
    isHot: true,
    isFeatured: true,
    createdAt: '2024-01-05T09:00:00Z',
    updatedAt: '2024-03-22T11:00:00Z'
  },
  {
    id: 'prod-sunshine-p3005a',
    sku: 'SUNSHINE-P3005A-30V5A',
    name: {
      fr: 'Alimentation DC de Laboratoire SUNSHINE P-3005A (30V / 5A) Programmable',
      ar: 'باور سبلاي رقمي ذكي SUNSHINE P-3005A قياس 30V / 5A كشف الشورت',
      en: 'SUNSHINE P-3005A 30V 5A High Precision Programmable DC Power Supply'
    },
    description: {
      fr: 'Précision à 4 chiffres (0.001A), 5 mémoires préréglées pour tests smartphone, protection contre les surtensions OVP et surintensités OCP. Idéale pour détecter les court-circuits et alimenter les cartes mères.',
      ar: 'شاشة رقمية فائقة الدقة 4 أرقام لقياس حتى 0.001 أمبير، 5 قنوات ذاكرة سريعة لاختبارات الجوال، حماية كاملة ضد القفلات والشورت OCP و OVP مع مروحة تبريد ذكية.',
      en: '4-digit high precision digital display (0.001A), 5 memory recall presets, OVP and OCP short-circuit protection. Essential tool for identifying motherboard shorts.'
    },
    category: 'measuring-power-supply',
    subcategory: 'power-supplies',
    price: 380.0,
    originalPrice: 420.0,
    discount: 9,
    stock: 9,
    images: [
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    ],
    specifications: {
      brand: 'SUNSHINE',
      model: 'P-3005A',
      outputVoltage: '0 - 30V DC',
      outputCurrent: '0 - 5A',
      displayAccuracy: 'Voltage: 10mV / Current: 1mA',
      protection: 'OCP, OVP, Over-temperature',
      weight: '4.2 Kg',
      warranty: '12 Mois'
    },
    rating: 4.88,
    reviewsCount: 16,
    tags: ['Power Supply', 'Short Killer', 'Sunshine'],
    isFeatured: true,
    createdAt: '2024-02-10T12:00:00Z',
    updatedAt: '2024-03-18T10:00:00Z'
  },
  {
    id: 'prod-sunshine-dt17n',
    sku: 'SUNSHINE-DT-17N-AUTO',
    name: {
      fr: 'Multimètre Numérique Automatique SUNSHINE DT-17N avec Buzzer Rapide',
      ar: 'أفوميتر رقمي أوتوماتيك SUNSHINE DT-17N مع جرس سريع جداً',
      en: 'SUNSHINE DT-17N Auto Range Digital Multimeter for Mobile Repair'
    },
    description: {
      fr: 'Multimètre spécialement conçu pour la réparation mobile: test diode ultra-réactif sans délai pour suivre les lignes de données, mesure de résistance automatique, mesure de température et écran rétroéclairé.',
      ar: 'أفوميتر مصمم خصيصاً لفنيي صيانة المحمول: فحص دايود وخطوط التوازي والتوالي بدون تأخير وبسرعة صوتية فورية، قياس أوتوماتيكي للأوم والفولت مع إضاءة شاشة قوية.',
      en: 'Dedicated mobile repair digital multimeter: zero-delay diode buzzer test for line tracking, true RMS auto-ranging, temperature measurement.'
    },
    category: 'measuring-power-supply',
    subcategory: 'digital-multimeters',
    price: 95.0,
    originalPrice: 115.0,
    discount: 17,
    stock: 22,
    images: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    ],
    specifications: {
      brand: 'SUNSHINE',
      model: 'DT-17N',
      type: 'Auto-Range Digital Multimeter',
      features: 'Ultra-fast Buzzer, Diode test, Capacitance, Frequency',
      display: '6000 Counts',
      warranty: '6 Mois'
    },
    rating: 4.85,
    reviewsCount: 42,
    tags: ['Multimètre', 'Sunshine', 'Metrix'],
    isHot: true,
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-03-24T16:00:00Z'
  },
  {
    id: 'prod-jcid-v1se-wifi',
    sku: 'JCID-V1SE-WIFI-8IN1',
    name: {
      fr: 'Programmeur JCID V1SE WiFi (Pack 8-en-1 avec Écran, Batterie, Face ID)',
      ar: 'مبرمجة ذكية JCID V1SE واي فاي (باقة 8 في 1 للشاشات والبطاريات وبصمة الوجه)',
      en: 'JCID V1SE WiFi Smart Programmer (8-in-1 Full Pack with FaceID / TrueTone)'
    },
    description: {
      fr: 'Outil incontournable pour la réparation iPhone: restauration TrueTone sans écran d’origine (iPhone 7 à 15 Pro Max), lecture/écriture données batterie, santé de batterie 100%, réparation Face ID dot projector, vibreur Taptic Engine.',
      ar: 'الأداة الأهم لإصلاح الآيفون: استعادة خاصية تروتون TrueTone للشاشات حتى آيفون 15 برو ماكس، تعديل صحة البطارية وتصفير دورات الشحن، إصلاح بصمة الوجه Face ID وموتور الهزاز.',
      en: 'Essential programmer for iPhone repair: TrueTone recovery without original screen, battery health calibration, Face ID dot-matrix repair, and ambient light sensor restoration.'
    },
    category: 'programming-flashing',
    subcategory: 'programming-boxes',
    price: 590.0,
    originalPrice: 650.0,
    discount: 9,
    stock: 6,
    images: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { id: 'j1', name: 'Pack Modules', value: 'Pack Standard (Écran + Batterie + Face ID)', priceAdjustment: 0 },
      { id: 'j2', name: 'Pack Modules', value: 'Pack Complet 12 Modules (avec Camera Arrière & FPC)', priceAdjustment: 160 }
    ],
    specifications: {
      brand: 'JCID (JC Programmer)',
      model: 'V1SE WiFi Version',
      compatibility: 'iPhone 7 / 8 / X / 11 / 12 / 13 / 14 / 15 Series',
      connectivity: 'USB Type-C + WiFi Direct',
      features: 'TrueTone, Battery, FaceID, Vibration, Receiver FPC',
      warranty: '12 Mois'
    },
    rating: 4.96,
    reviewsCount: 31,
    tags: ['JCID', 'TrueTone', 'iPhone Programmer', 'Hot'],
    isHot: true,
    isFeatured: true,
    createdAt: '2024-02-15T09:00:00Z',
    updatedAt: '2024-03-25T11:00:00Z'
  },
  {
    id: 'prod-sunshine-s918f-plus',
    sku: 'SUNSHINE-S918F-PLUS-VACUUM',
    name: {
      fr: 'Séparateur d’Écran LCD Rotatif 360° SUNSHINE S-918F Plus avec Pompe Intégrée',
      ar: 'جهاز فصل شاشات دوار 360 درجة SUNSHINE S-918F Plus بمضخة شفط قوية',
      en: 'SUNSHINE S-918F Plus 360° Rotary Screen Separator with Built-in Dual Vacuum'
    },
    description: {
      fr: 'Plaque chauffante rotative avec double pompe à vide intégrée à forte aspiration. Conçu pour séparer les écrans plats et courbés (Edge OLED) en toute sécurité sans endommager la nappe flex.',
      ar: 'قاعدة تسخين دوارة 360 درجة مع مضخة شفط مزدوجة مدمجة شديدة التثبيت. مخصص لفصل شاشات الجوال المسطحة والمنحنية إيدج OLED بدون تقطيع الفلاتات.',
      en: '360-degree rotating heating plate with powerful dual built-in vacuum pumps. Suitable for curved Edge screens and straight LCD glass refurbishing.'
    },
    category: 'screen-refurbish',
    subcategory: 'screen-separators',
    price: 340.0,
    originalPrice: 380.0,
    discount: 11,
    stock: 8,
    images: [
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
    ],
    specifications: {
      brand: 'SUNSHINE',
      model: 'S-918F Plus Rotary',
      heatingArea: '7 Pouces (Compatible tous smartphones)',
      power: '400W',
      vacuumPressure: 'Forte aspiration double pompe',
      temperatureRange: '50°C - 130°C',
      warranty: '12 Mois'
    },
    rating: 4.82,
    reviewsCount: 15,
    tags: ['Séparateur', 'Écran', 'Sunshine'],
    createdAt: '2024-01-25T11:00:00Z',
    updatedAt: '2024-03-12T15:00:00Z'
  },
  {
    id: 'prod-mechanic-kingkong-stencil',
    sku: 'MECH-KK-STENCIL-CPU',
    name: {
      fr: 'Pochoir BGA Acier Noir Haute Température Mechanic KingKong (A8-A17 CPU)',
      ar: 'شابلونة شبلنة الفولاذ الأسود ميكانيك KingKong لمعالجات الآيفون A8-A17',
      en: 'Mechanic KingKong Black Heat-Resistant BGA Stencil for iPhone CPU A8-A17'
    },
    description: {
      fr: 'Acier japonais de haute qualité découpé au laser haute précision avec revêtement noir anti-déformation thermique. Trous carrés pour billes d’étain parfaites sans pont de soudure.',
      ar: 'فولاذ ياباني معالج بتقنية الليزر مع طبقة سوداء مقاومة للحرارة العالية تمنع التمدد. فتحات سداسية مربعة لشبلنة معالجات آبل بدقة متناهية وبدون التصاق القصدير.',
      en: 'Premium Japanese laser-cut steel with anti-bulging black thermal coating. Square apertures ensure uniform solder ball formation during CPU reballing.'
    },
    category: 'equipments-tools',
    subcategory: 'bga-stencil',
    price: 35.0,
    originalPrice: 45.0,
    discount: 22,
    stock: 45,
    images: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      { id: 's1', name: 'Modèle CPU', value: 'iPhone A12 / A13 / A14', priceAdjustment: 0 },
      { id: 's2', name: 'Modèle CPU', value: 'iPhone A15 / A16 / A17 Pro', priceAdjustment: 5 },
      { id: 's3', name: 'Modèle CPU', value: 'Qualcomm Snapdragon 888 / 8 Gen 1/2', priceAdjustment: 5 }
    ],
    specifications: {
      brand: 'MECHANIC',
      model: 'KingKong Black Stencil',
      thickness: '0.12mm',
      material: 'Japanese Laser Alloy Steel',
      heatResistance: 'Up to 500°C anti-bulge'
    },
    rating: 4.93,
    reviewsCount: 52,
    tags: ['Stencil', 'BGA', 'Mechanic', 'CPU'],
    isFeatured: true,
    createdAt: '2024-02-18T14:00:00Z',
    updatedAt: '2024-03-26T16:00:00Z'
  },
  {
    id: 'prod-qianli-007-knife',
    sku: 'QIANLI-007-GLUE-BLADE',
    name: {
      fr: 'Kit de Lames & Couteaux à Colle QianLi 007 pour Décapage IC & CPU',
      ar: 'طقم شفرات وسكاكين QianLi 007 لإزالة الغراء والـ Underfill تحت المعالجات',
      en: 'QianLi 007 Curved Edge Glue Removal Blades for IC Chip Cleaning'
    },
    description: {
      fr: 'Ensemble de lames incurvées ultra-fines en acier chirurgical poli à la main. Idéal pour gratter la colle noire sans rayer les pistes de la carte mère ni endommager les pastilles de cuivre.',
      ar: 'طقم سكاكين وشفرات طبية رفيعة للغاية منحنية الحواف من شركة QianLi. مثالية لإزالة وتنظيف الغراء الأسود حول وتحت إيسيهات المعالج والذاكرة دون كشط البوردة.',
      en: 'Set of razor-thin curved blades hand-polished for safely slicing cured epoxy resin underfill without damaging sensitive motherboard traces.'
    },
    category: 'equipments-tools',
    subcategory: 'hand-tools',
    price: 42.0,
    originalPrice: 50.0,
    discount: 16,
    stock: 35,
    images: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    ],
    specifications: {
      brand: 'QianLi ToolPlus',
      model: '007 Curved Glue Remover Kit',
      bladesCount: '3 Lames spécifiques + Manche antidérapant en aluminium',
      material: 'Acier inoxydable trempé'
    },
    rating: 4.88,
    reviewsCount: 29,
    tags: ['QianLi', 'Lames', 'Colle', 'Hand Tools'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-03-20T09:00:00Z'
  },
  {
    id: 'prod-mechanic-uv-mask',
    sku: 'MECH-UV-SOLDER-MASK-GREEN',
    name: {
      fr: 'Vernis Vert Anti-Soudure UV Mechanic avec Lampe de Durcissement Rapide',
      ar: 'قناع لحام أخضر UV عازل ميكانيك مع مصباح تجفيف الأشعة فوق البنفسجية',
      en: 'Mechanic UV Curable Solder Mask Green Ink with Fast Curing UV Torch'
    },
    description: {
      fr: 'Résine UV pour isoler et protéger les pistes en cuivre réparées, fils de shunt (jumper wire) et ponts de soudure. Durcit en 5 secondes sous la lumière ultraviolette.',
      ar: 'حبر وماسك عازل حراري وكهربائي لعزل وحماية مسارات البريدج النحاسية وأسلاك التوصيل بعد اللحام. يجف خلال 5 ثوانٍ فقط تحت ضوء الأشعة فوق البنفسجية UV.',
      en: 'UV-curable protective ink to insulate jumper wires and prevent short circuits. Cures solid in 5-10 seconds under UV flashlight.'
    },
    category: 'consumables',
    subcategory: 'flux-solder',
    price: 28.0,
    originalPrice: 35.0,
    discount: 20,
    stock: 60,
    images: [
      'https://images.unsplash.com/photo-1603555501671-8f96b3fce8b4?auto=format&fit=crop&w=800&q=80',
    ],
    specifications: {
      brand: 'MECHANIC',
      model: 'UVH900 Solder Mask + UV Torch',
      volume: '10cc seringue',
      color: 'Vert électrique / Noir',
      curingTime: '5 à 10 secondes'
    },
    rating: 4.9,
    reviewsCount: 34,
    tags: ['UV Mask', 'Jumper', 'Consommables'],
    createdAt: '2024-02-05T09:00:00Z',
    updatedAt: '2024-03-21T13:00:00Z'
  },
  {
    id: 'prod-ipa-99-1l',
    sku: 'IPA-99-ALCOHOL-1L',
    name: {
      fr: 'Alcool Isopropylique Pur 99.9% (Flacon 1 Litre) pour Nettoyage Électronique',
      ar: 'كحول إيزوبروبيلي نقي 99.9% (قارورة 1 لتر) لتنظيف اللوحات الإلكترونية',
      en: 'High Purity Isopropyl Alcohol 99.9% (1 Liter) for PCB & Electronics Cleaning'
    },
    description: {
      fr: 'Solvant de qualité laboratoire ultra-pur à évaporation rapide sans résidu. Nettoie les résidus de flux, traces d’oxydation liquide, connecteurs et cartes mères de smartphones.',
      ar: 'مذيب عالي النقاء 99.9% سريع التطاير والتبخر دون ترك أي رواسب أو شوائب. ينظف آثار الفلاكس والماء والأكسدة والصدأ من بوردات الهواتف ومنافذ الشحن.',
      en: 'Laboratory grade 99.9% IPA solvent. Evaporates quickly without leaving mineral residues. Perfect for ultrasonic cleaners and PCB defluxing.'
    },
    category: 'consumables',
    subcategory: 'cleaning-solutions',
    price: 25.0,
    originalPrice: 30.0,
    discount: 16,
    stock: 80,
    images: [
      'https://images.unsplash.com/photo-1603555501671-8f96b3fce8b4?auto=format&fit=crop&w=800&q=80',
    ],
    specifications: {
      brand: 'LabGrade TN',
      purity: '99.9% Pure Anhydrous',
      volume: '1000 ml (1L)',
      usage: 'Nettoyage bac à ultrasons & désoxydation GSM'
    },
    rating: 4.94,
    reviewsCount: 65,
    tags: ['Alcool', 'Nettoyage', 'IPA'],
    isHot: true,
    createdAt: '2024-01-08T08:00:00Z',
    updatedAt: '2024-03-25T14:00:00Z'
  },
  {
    id: 'prod-amtech-flux-nc559',
    sku: 'AMTECH-NC559-ASM-10CC',
    name: {
      fr: 'Flux de Soudure No-Clean AMTECH NC-559-ASM Original (10cc)',
      ar: 'فلاكس لحام أصلي أم تيك AMTECH NC-559-ASM حجم 10cc خالي من التنظيف',
      en: 'AMTECH NC-559-ASM Original No-Clean Tacky Solder Flux (10cc)'
    },
    description: {
      fr: 'Le flux le plus apprécié des techniciens GSM pour le micro-brasage et le rebillage de puces BGA. Excellente fluidité thermique, non corrosif et fumée très réduite.',
      ar: 'الفلاكس الأكثر شهرة واستخداماً لدى محترفي صيانة المحمول. يعطي سيولة وتوزيعاً مثالياً لقصدير اللحام أثناء فك وتركيب وشبلنة الإيسيهات دون تآكل.',
      en: 'World-renowned tacky solder flux for SMD and BGA micro-soldering. Halide-free, non-corrosive, low-fume formula.'
    },
    category: 'soldering-hot-air',
    subcategory: 'solder-paste-flux',
    price: 32.0,
    originalPrice: 38.0,
    discount: 15,
    stock: 50,
    images: [
      'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=800&q=80',
    ],
    specifications: {
      brand: 'AMTECH Original',
      model: 'NC-559-ASM',
      volume: '10cc Seringue avec poussoir et aiguille',
      type: 'Tacky Solder Flux No-Clean'
    },
    rating: 4.92,
    reviewsCount: 78,
    tags: ['Flux', 'Amtech', 'Soudure'],
    isHot: true,
    createdAt: '2024-01-12T10:00:00Z',
    updatedAt: '2024-03-24T12:00:00Z'
  },
  {
    id: 'prod-ic-tristar-1610a3',
    sku: 'IC-TRISTAR-1610A3-ORIG',
    name: {
      fr: 'Puce Circuit Intégré de Charge U2 / Tristar 1610A3 pour iPhone (Lot de 2)',
      ar: 'إيسي شحن تريستار Tristar 1610A3 الأصلي للآيفون (حزمة قطعتين)',
      en: 'Tristar U2 1610A3 Original Charging IC Chip for iPhone (2-Pack)'
    },
    description: {
      fr: 'Puce de gestion de charge USB originale 1610A3 neuve pré-billée avec micro-billes sans plomb. Résout les pannes de décharge rapide de batterie, faux contact et téléphone qui ne s’allume pas.',
      ar: 'إيسي شحن أصلي جديد مشبلن مسبقاً جاهز للتركيب المباشر. يعالج مشاكل الاستهلاك السريع للبطارية والشحن الوهمي ومشاكل عدم إقلاع الهاتف نهائياً.',
      en: 'Original pre-balled 1610A3 charging control IC chip. Fixes battery draining, no boot, and fake charging issues.'
    },
    category: 'ic-chips',
    subcategory: 'power-management-ics',
    price: 38.0,
    originalPrice: 45.0,
    discount: 15,
    stock: 28,
    images: [
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    ],
    specifications: {
      brand: 'NXP Original',
      model: '1610A3 (Compatible 6S/6S+/7/7+)',
      condition: '100% Neuf Pré-bille Lead-Free'
    },
    rating: 4.87,
    reviewsCount: 22,
    tags: ['IC', 'Tristar', 'iPhone', 'Charge'],
    createdAt: '2024-02-12T11:00:00Z',
    updatedAt: '2024-03-25T10:00:00Z'
  },
  {
    id: 'prod-screen-ip13-oled',
    sku: 'SCREEN-IP13-OLED-ORIG-REFURB',
    name: {
      fr: 'Écran OLED Complet Super Retina XDR pour iPhone 13 Original Rénové',
      ar: 'شاشة أصلية كاملة OLED Super Retina XDR للآيفون 13 تم تجديد الزجاج',
      en: 'iPhone 13 OEM Refurbished Super Retina XDR OLED Display Assembly'
    },
    description: {
      fr: 'Dalle OLED 100% authentique Apple reconditionnée avec vitre neuve haute dureté 9H. Couleurs parfaites, réactivité tactile originale 120Hz et compatible avec programmation TrueTone.',
      ar: 'شاشة أوليد أصلية 100% تم تغيير الزجاج الخارجي فقط بزجاج 9H جديد. ألوان زاهية مطابقة للوكالة، حساسية لمس فورية، وتدعم نقل وتفعيل ميزة TrueTone.',
      en: '100% authentic OEM OLED panel with fresh 9H tempered glass. Flawless color fidelity, true touch response, and TrueTone transfer compatibility.'
    },
    category: 'spare-parts',
    subcategory: 'lcd-oled-screens',
    price: 360.0,
    originalPrice: 410.0,
    discount: 12,
    stock: 5,
    images: [
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
    ],
    specifications: {
      brand: 'Apple OEM Spec',
      model: 'iPhone 13 (6.1 pouces)',
      panelType: 'Super Retina XDR OLED',
      resolution: '2532 x 1170 pixels',
      warranty: '3 Mois Garantie de Test'
    },
    rating: 4.95,
    reviewsCount: 14,
    tags: ['Écran', 'iPhone 13', 'OLED', 'Pièces'],
    isFeatured: true,
    createdAt: '2024-02-28T14:00:00Z',
    updatedAt: '2024-03-26T15:00:00Z'
  },
  {
    id: 'prod-battery-ip12-tianji',
    sku: 'BATT-IP12-TIANJI-2815',
    name: {
      fr: 'Batterie Haute Capacité Tianji 0 Cycle pour iPhone 12 / 12 Pro (2815mAh)',
      ar: 'بطارية تيانجي Tianji عالية الكفاءة زيرو دورة شحن للآيفون 12 / 12 برو',
      en: 'Tianji 0-Cycle High Capacity Replacement Battery for iPhone 12 / 12 Pro'
    },
    description: {
      fr: 'Batterie certifiée CE / RoHS avec cellules au lithium cobalt de grade A+. 0 cycle de charge, puce TI originale intégrée évitant les messages d’erreur iOS et autonomie prolongée de 15%.',
      ar: 'بطارية معتمدة بمعايير الجودة الأوروبية بخلايا ليثيوم كوبالت فئة A+. صفر دورة شحن، مزودة بشريحة حماية أصلية لتفادي تنبيهات النظام، وعمر افتراضي أطول بنسبة 15%.',
      en: 'CE/RoHS certified premium grade A+ cobalt cells. Zero charge cycles with original TI protection chip to ensure accurate iOS battery reporting.'
    },
    category: 'spare-parts',
    subcategory: 'batteries',
    price: 65.0,
    originalPrice: 80.0,
    discount: 18,
    stock: 18,
    images: [
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
    ],
    specifications: {
      brand: 'Tianji Tech',
      compatibility: 'iPhone 12 et iPhone 12 Pro (6.1")',
      capacity: '2815 mAh (10.78 Wh)',
      cycles: '0 Cycle Neuf',
      warranty: '6 Mois Garantie Échange'
    },
    rating: 4.84,
    reviewsCount: 27,
    tags: ['Batterie', 'iPhone 12', 'Pièces'],
    createdAt: '2024-01-30T10:00:00Z',
    updatedAt: '2024-03-22T08:00:00Z'
  },
  {
    id: 'prod-charger-gan-65w',
    sku: 'GAN-CHARGER-65W-3PORT',
    name: {
      fr: 'Chargeur Rapide GaN III 65W Double USB-C + USB-A pour Atelier & Test',
      ar: 'شاحن سريع تقنية GaN III قوة 65W منفذين تايب سي + منفذ USB عادي',
      en: '65W GaN III Fast Wall Charger 3-Port (2x USB-C + 1x USB-A QC 4.0)'
    },
    description: {
      fr: 'Technologie au nitrure de gallium GaN ultra-compacte. Délivre 65W réels pour alimenter les smartphones, iPads et MacBooks. Idéal pour tester la charge rapide PD (Power Delivery).',
      ar: 'شاحن بتقنية نيتريد الغاليوم GaN3 فائقة التطور وبحجم صغير جداً. يقدم 65 واط حقيقية لشحن الهواتف والأجهزة اللوحية وحواسيب ماك بوك بسرعة قياسية مع أمان تام.',
      en: 'Advanced Gallium Nitride tech. 65W full speed Power Delivery for smartphones, tablets and diagnostic testing.'
    },
    category: 'accessories',
    subcategory: 'phone-chargers',
    price: 75.0,
    originalPrice: 95.0,
    discount: 21,
    stock: 30,
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    ],
    specifications: {
      brand: 'Baseus / Essager Pro',
      power: '65W Max',
      ports: '2x Type-C (PD 3.0) + 1x USB-A (QC 4.0)',
      safety: 'Protection contre surchauffe et surtension',
      warranty: '12 Mois'
    },
    rating: 4.89,
    reviewsCount: 33,
    tags: ['Chargeur', 'GaN', 'Accessoires'],
    createdAt: '2024-02-14T11:00:00Z',
    updatedAt: '2024-03-23T15:00:00Z'
  }
];

export const DEMO_ORDERS: Order[] = [
  {
    id: 'order-1',
    orderNumber: 'GSM-TN-2024-1082',
    customerName: 'Mohamed Ali Mansour',
    customerEmail: 'm.mansour@gmail.com',
    customerPhone: '98 456 123',
    items: [
      {
        productId: 'prod-quick-861dw',
        name: 'Station à Air Chaud QUICK 861DW Originale 1000W',
        image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        sku: 'QUICK-861DW-1000W',
        quantity: 1,
        price: 890.0
      },
      {
        productId: 'prod-amtech-flux-nc559',
        name: 'Flux de Soudure No-Clean AMTECH NC-559-ASM Original (10cc)',
        image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=800&q=80',
        sku: 'AMTECH-NC559-ASM-10CC',
        quantity: 2,
        price: 32.0
      }
    ],
    subtotal: 954.0,
    tax: 0,
    shippingCost: 0, // Free shipping > 300 TND
    discountAmount: 0,
    totalPrice: 954.0,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    orderStatus: 'shipped',
    shippingAddress: {
      firstName: 'Mohamed Ali',
      lastName: 'Mansour',
      phone: '98 456 123',
      governorate: 'Sfax',
      city: 'Sfax Ville',
      street: 'Avenue 14 Janvier, Immeuble Ribat',
      postalCode: '3027'
    },
    trackingNumber: 'TN-ARAMEX-8902415',
    carrierName: 'Aramex Express Tunisia',
    notes: 'Appeler avant livraison le matin SVP',
    createdAt: '2024-03-25T10:30:00Z',
    updatedAt: '2024-03-26T08:15:00Z'
  },
  {
    id: 'order-2',
    orderNumber: 'GSM-TN-2024-1081',
    customerName: 'Karim Ben Salah',
    customerEmail: 'karim.repair@planet.tn',
    customerPhone: '55 889 770',
    items: [
      {
        productId: 'prod-sunshine-dt17n',
        name: 'Multimètre Numérique Automatique SUNSHINE DT-17N',
        image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        sku: 'SUNSHINE-DT-17N-AUTO',
        quantity: 1,
        price: 95.0
      },
      {
        productId: 'prod-ipa-99-1l',
        name: 'Alcool Isopropylique Pur 99.9% (Flacon 1 Litre)',
        image: 'https://images.unsplash.com/photo-1603555501671-8f96b3fce8b4?auto=format&fit=crop&w=800&q=80',
        sku: 'IPA-99-ALCOHOL-1L',
        quantity: 2,
        price: 25.0
      }
    ],
    subtotal: 145.0,
    tax: 0,
    shippingCost: 7.0,
    discountAmount: 10.0,
    couponCode: 'GSM10',
    totalPrice: 142.0,
    paymentMethod: 'credit_card',
    paymentStatus: 'completed',
    orderStatus: 'delivered',
    shippingAddress: {
      firstName: 'Karim',
      lastName: 'Ben Salah',
      phone: '55 889 770',
      governorate: 'Tunis',
      city: 'Centre Ville',
      street: 'Rue de Marseille',
      postalCode: '1001'
    },
    trackingNumber: 'TN-RAPID-442190',
    carrierName: 'Rapid-Poste Tunisie',
    createdAt: '2024-03-20T14:20:00Z',
    updatedAt: '2024-03-22T16:00:00Z'
  }
];
