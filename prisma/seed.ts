import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
    throw new Error('Le seed SUPPRIME toutes les données. Refusé en production (définissez ALLOW_SEED=true pour forcer).');
  }

  console.log('🌱 Starting database seed for Outils Réparation GSM Tunisie...');

  // Clean existing data
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.storeSettings.deleteMany();

  // 0. Seed Default Store Settings
  const storeSettings = await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {
      phone: '+216 26 383 876',
      whatsapp: '+216 26 383 876',
      address: 'Tunis,tunis',
    },
    create: {
      id: 'default',
      storeName: 'Outils Réparation GSM Tunisie',
      storeDescription: 'N°1 en Outillage & Équipements de Réparation Smartphone en Tunisie. Stations de soudure, microscopes, programmeurs et pièces détachées.',
      logoUrl: '/logo.jpg',
      faviconUrl: '/logo.jpg',
      phone: '+216 26 383 876',
      whatsapp: '+216 26 383 876',
      email: 'contact@reparation-gsm.tn',
      address: 'Tunis,tunis',
      facebookUrl: 'https://www.facebook.com/outils.reparation.gsm',
      instagramUrl: 'https://instagram.com/outils.reparation.gsm',
      tiktokUrl: 'https://tiktok.com/@outilsreparationgsm',
      youtubeUrl: 'https://youtube.com/@outilsreparationgsm',
      workingHours: 'Mar - Dim: 08:00 - 18:00 | Lundi: Fermé',
      defaultShippingTND: 7.0,
      freeShippingThresholdTND: 300.0,
      currency: 'DT',
      primaryColor: '#ea580c',
      secondaryColor: '#0f172a',
      heroTitle: 'معدات وأدوات صيانة الهواتف الذكية للمحترفين',
      heroSubtitle: 'محطات لحام دقيقة، ميكروسكوبات ثلاثية العيون، مبرمجات سوفتوير، ومزودات طاقة أصلية مع توصيل سريع 24/48 ساعة وضمان حقيقي.',
      heroButtonText: 'عرض جميع المنتجات',
      heroButtonLink: 'products',
      heroImage: '/logo.jpg',
    },
  });
  console.log(`✅ Default Store Settings seeded: ${storeSettings.storeName}`);

  // 1. Seed the admin + a demo customer. No hard-coded/known passwords:
  //    use ADMIN_EMAIL / ADMIN_PASSWORD from the environment, otherwise a random password is generated and printed once.
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase().trim();
  const adminPasswordFromEnv = process.env.ADMIN_PASSWORD;
  if (adminPasswordFromEnv && adminPasswordFromEnv.length < 12) {
    throw new Error('ADMIN_PASSWORD doit contenir au moins 12 caractères.');
  }
  const adminPassword = adminPasswordFromEnv || crypto.randomBytes(12).toString('base64url');
  const adminHash = await bcrypt.hash(adminPassword, 12);
  const customerPasswordHash = await bcrypt.hash(crypto.randomBytes(18).toString('base64url'), 12);

  const primaryAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash, role: 'ADMIN' },
    create: {
      name: 'Administrateur Principal',
      email: adminEmail,
      phone: '+21626383876',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  // Demo customer (random password, only used to attach sample orders; log in via "forgot"/register instead)
  const customerUser = await prisma.user.upsert({
    where: { email: 'client@gsm.tn' },
    update: {},
    create: {
      name: 'Anis Ben Salah',
      email: 'client@gsm.tn',
      phone: '56229955',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
    },
  });

  console.log(`====================================================`);
  console.log(`🔐 ADMIN ACCOUNT READY:`);
  console.log(`   - Email:    ${primaryAdmin.email}`);
  console.log(adminPasswordFromEnv ? `   - Password: (from ADMIN_PASSWORD)` : `   - Password: ${adminPassword}   <-- shown once, change it`);
  console.log(`====================================================`);

  // 2. Create Categories
  const categoriesData = [
    {
      name: 'Soudure & Air Chaud',
      slug: 'soldering-hot-air',
      description: 'Stations air chaud, fers à souder C210/C245, pannes et flux de précision.',
      image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Microscopes & Optique',
      slug: 'microscopes',
      description: 'Microscopes stéréo trinoculaires 7X-45X avec caméras 4K HDMI et bras articulés.',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Alimentation & Mesure',
      slug: 'measuring-power-supply',
      description: 'Alimentations DC stabilisées, multimètres de diagnostic et testeurs de batterie.',
      image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Programmation & Flashing',
      slug: 'programming-flashing',
      description: 'Programmeurs JCID V1SE, boîtiers QianLi, restore TrueTone et Face ID.',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Séparateurs & Rénovation Écran',
      slug: 'screen-refurbish',
      description: 'Séparateurs LCD rotatifs à vide, fils molybdène et outillage de reconditionnement.',
      image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Outils & Équipements',
      slug: 'equipments-tools',
      description: 'Pochoirs BGA, pinces brucelles titane, supports PCB et tournevis de précision.',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Puces & Circuits Intégrés (IC)',
      slug: 'ic-chips',
      description: 'IC Charge Tristar, PMIC Power Management, Audio Codec neufs pré-billés.',
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Pièces Détachées GSM',
      slug: 'spare-parts',
      description: 'Écrans OLED authentiques, batteries Tianji haute capacité et nappes flex.',
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Consommables & Chimie',
      slug: 'consumables',
      description: 'Alcool Isopropylique 99.9%, pâte thermique, colle B7000 et vernis UV.',
      image: 'https://images.unsplash.com/photo-1603555501671-8f96b3fce8b4?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Accessoires & Câbles',
      slug: 'accessories',
      description: 'Chargeurs rapides GaN 65W, câbles Type-C blindés et adaptateurs de test.',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    },
  ];

  for (const cat of categoriesData) {
    await prisma.category.create({ data: cat });
  }
  console.log(`✅ ${categoriesData.length} categories created`);

  // 3. Create Products
  const productsData = [
    {
      name: 'Station à Air Chaud QUICK 861DW Originale 1000W',
      slug: 'quick-861dw-1000w-original',
      description: 'La référence absolue des ateliers de micro-soudure GSM en Tunisie. Puissance réelle de 1000W, débit vortex jusqu’à 120L/min, 3 canaux mémoires programmables CH1/CH2/CH3, et mise en veille magnétique automatique.',
      priceTND: 890.0,
      compareAtPriceTND: 980.0,
      category: 'soldering-hot-air',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
      ]),
      stock: 8,
      rating: 4.95,
      isNew: false,
      isFeatured: true,
      isActive: true,
      specs: JSON.stringify({
        brand: 'QUICK Original',
        model: '861DW Lead-Free',
        power: '1000W',
        voltage: '220V AC 50Hz',
        tempRange: '100°C - 500°C',
        airflow: '1 - 120 L/min',
        warranty: '12 Mois Garantie Tunisie',
      }),
    },
    {
      name: 'Station de Soudage Intelligente AiXun T3A 200W (Poignée T245 & T12)',
      slug: 'aixun-t3a-200w-soldering-station',
      description: 'Montée en température ultra-rapide en 2 secondes chrono. Écran couleur IPS 2.4", reconnaissance automatique des pannes T245/T12, régulation PID haute stabilité et firmware upgradable.',
      priceTND: 460.0,
      compareAtPriceTND: 520.0,
      category: 'soldering-hot-air',
      image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=800&q=80',
      ]),
      stock: 12,
      rating: 4.9,
      isNew: true,
      isFeatured: true,
      isActive: true,
      specs: JSON.stringify({
        brand: 'AiXun Tech (JCID)',
        model: 'T3A 200W',
        power: '200W Peak',
        heatingSpeed: '2 Secondes',
        warranty: '12 Mois Tunisie',
      }),
    },
    {
      name: 'Microscope Stéréo Trinoculaire RELIFE RL-M3T avec Caméra 4K HDMI',
      slug: 'relife-rl-m3t-microscope-trinocular-4k',
      description: 'Grossissement continu de 7X à 45X avec oculaires grand champ WF10X/20mm. Éclairage LED circulaire graduable, base métallique large antivibration et sortie HDMI 4K pour écran de diagnostic.',
      priceTND: 1390.0,
      compareAtPriceTND: 1550.0,
      category: 'microscopes',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
      ]),
      stock: 5,
      rating: 5.0,
      isNew: false,
      isFeatured: true,
      isActive: true,
      specs: JSON.stringify({
        brand: 'RELIFE / Sunshine',
        model: 'RL-M3T-B1',
        zoom: '7X - 45X Continu',
        camera: '4K Ultra HD HDMI 48MP',
        warranty: '12 Mois',
      }),
    },
    {
      name: 'Alimentation DC de Laboratoire SUNSHINE P-3005A (30V / 5A)',
      slug: 'sunshine-p-3005a-dc-power-supply-30v-5a',
      description: 'Précision à 4 chiffres (0.001A), 5 mémoires programmables pour tests rapides, protection court-circuit OCP et surtension OVP. Idéale pour diagnostic de carte mère et détection de court-circuit (Short Killer).',
      priceTND: 380.0,
      compareAtPriceTND: 420.0,
      category: 'measuring-power-supply',
      image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
      ]),
      stock: 9,
      rating: 4.88,
      isNew: false,
      isFeatured: true,
      isActive: true,
      specs: JSON.stringify({
        brand: 'SUNSHINE',
        model: 'P-3005A Programmable',
        output: '0-30V / 0-5A',
        accuracy: '1mA / 10mV',
        warranty: '12 Mois',
      }),
    },
    {
      name: 'Multimètre Numérique Automatique SUNSHINE DT-17N',
      slug: 'sunshine-dt-17n-auto-multimeter',
      description: 'Buzzer de continuité ultra-rapide sans délai pour tracer les lignes de données et composants en court-circuit. Mesure automatique AC/DC, diode, capacité, fréquence et température.',
      priceTND: 95.0,
      compareAtPriceTND: 115.0,
      category: 'measuring-power-supply',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      ]),
      stock: 25,
      rating: 4.85,
      isNew: false,
      isFeatured: true,
      isActive: true,
      specs: JSON.stringify({
        brand: 'SUNSHINE',
        model: 'DT-17N Auto-Range',
        display: '6000 Counts Rétroéclairé',
        warranty: '6 Mois',
      }),
    },
    {
      name: 'Programmeur JCID V1SE WiFi (Pack 8-en-1 TrueTone & Face ID)',
      slug: 'jcid-v1se-wifi-programmer-8in1',
      description: 'Outil indispensable pour les ateliers iPhone: reprogrammation TrueTone sans écran d’origine, lecture/écriture données batterie, santé 100%, réparation projecteur de points Face ID et vibreur.',
      priceTND: 590.0,
      compareAtPriceTND: 650.0,
      category: 'programming-flashing',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      ]),
      stock: 6,
      rating: 4.96,
      isNew: true,
      isFeatured: true,
      isActive: true,
      specs: JSON.stringify({
        brand: 'JCID Tech',
        model: 'V1SE WiFi Pack Pro',
        compatibility: 'iPhone 7 jusqu’à 15 Pro Max',
        warranty: '12 Mois',
      }),
    },
    {
      name: 'Séparateur d’Écran LCD Rotatif 360° SUNSHINE S-918F Plus',
      slug: 'sunshine-s-918f-plus-screen-separator',
      description: 'Plaque chauffante rotative 360° avec double pompe à vide intégrée à forte aspiration. Conçu pour le décollage des vitres tactiles sur écrans plats et courbés (OLED Edge).',
      priceTND: 340.0,
      compareAtPriceTND: 380.0,
      category: 'screen-refurbish',
      image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
      ]),
      stock: 7,
      rating: 4.82,
      isNew: false,
      isFeatured: false,
      isActive: true,
      specs: JSON.stringify({
        brand: 'SUNSHINE',
        model: 'S-918F Plus',
        power: '400W',
        tempRange: '50°C - 130°C',
        warranty: '12 Mois',
      }),
    },
    {
      name: 'Pochoir BGA Acier Noir Haute Résistance Mechanic KingKong (A8-A17 CPU)',
      slug: 'mechanic-kingkong-bga-stencil-cpu',
      description: 'Acier japonais trempé traité au laser anti-déformation thermique. Alvéoles carrées de précision pour billes d’étain régulières sans pont de soudure.',
      priceTND: 35.0,
      compareAtPriceTND: 45.0,
      category: 'equipments-tools',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      ]),
      stock: 45,
      rating: 4.92,
      isNew: false,
      isFeatured: true,
      isActive: true,
      specs: JSON.stringify({
        brand: 'MECHANIC',
        model: 'KingKong Black Alloy',
        thickness: '0.12mm',
      }),
    },
    {
      name: 'Kit de Lames & Couteaux à Colle QianLi 007 pour Décapage IC',
      slug: 'qianli-007-glue-removal-blades',
      description: 'Lames courbées ultra-fines en acier chirurgical pour gratter le mastic underfill noir autour des CPU et mémoires NAND sans endommager le cuivre de la carte mère.',
      priceTND: 42.0,
      compareAtPriceTND: 50.0,
      category: 'equipments-tools',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      ]),
      stock: 35,
      rating: 4.88,
      isNew: false,
      isFeatured: false,
      isActive: true,
      specs: JSON.stringify({
        brand: 'QianLi ToolPlus',
        model: '007 Underfill Cleaner',
        blades: '3 Lames spécifiques + Manche aluminium',
      }),
    },
    {
      name: 'Vernis Vert Anti-Soudure UV Mechanic avec Lampe UV',
      slug: 'mechanic-uv-solder-mask-green-torch',
      description: 'Résine UV pour isoler les fils de strap (jumper wire) et masquer les pistes cuivrées mises à nu. Durcit en 5 secondes sous la lampe ultraviolette incluse.',
      priceTND: 28.0,
      compareAtPriceTND: 35.0,
      category: 'consumables',
      image: 'https://images.unsplash.com/photo-1603555501671-8f96b3fce8b4?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1603555501671-8f96b3fce8b4?auto=format&fit=crop&w=800&q=80',
      ]),
      stock: 60,
      rating: 4.9,
      isNew: false,
      isFeatured: false,
      isActive: true,
      specs: JSON.stringify({
        brand: 'MECHANIC',
        model: 'UVH900 + Lampe UV USB',
        volume: '10cc seringue',
      }),
    },
    {
      name: 'Alcool Isopropylique Pur 99.9% (Flacon 1 Litre) Qualité Labo',
      slug: 'alcool-isopropylique-99-1l',
      description: 'Solvant ultra-pur à évaporation instantanée sans résidus. Indispensable pour désoxydation des cartes mères tombées dans l’eau et nettoyage des résidus de flux.',
      priceTND: 25.0,
      compareAtPriceTND: 30.0,
      category: 'consumables',
      image: 'https://images.unsplash.com/photo-1603555501671-8f96b3fce8b4?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1603555501671-8f96b3fce8b4?auto=format&fit=crop&w=800&q=80',
      ]),
      stock: 80,
      rating: 4.94,
      isNew: false,
      isFeatured: true,
      isActive: true,
      specs: JSON.stringify({
        brand: 'LabGrade TN',
        purity: '99.9% Anhydre',
        volume: '1000 ml (1L)',
      }),
    },
    {
      name: 'Flux de Soudure No-Clean AMTECH NC-559-ASM Original (10cc)',
      slug: 'amtech-nc559-asm-flux-10cc',
      description: 'Le flux de brasage et rebillage le plus plébiscité par les techniciens GSM en Tunisie. Fluidité thermique remarquable, non corrosif et fumée très atténuée.',
      priceTND: 32.0,
      compareAtPriceTND: 38.0,
      category: 'soldering-hot-air',
      image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=800&q=80',
      ]),
      stock: 50,
      rating: 4.92,
      isNew: false,
      isFeatured: true,
      isActive: true,
      specs: JSON.stringify({
        brand: 'AMTECH Original',
        model: 'NC-559-ASM Tacky',
        volume: '10cc Seringue avec piston',
      }),
    },
    {
      name: 'Puce Circuit Intégré de Charge Tristar 1610A3 pour iPhone (Lot de 2)',
      slug: 'ic-tristar-1610a3-iphone-lot2',
      description: 'Puce U2 / Tristar d’origine pré-billée sans plomb. Règle les problèmes de fausse charge, batterie qui se décharge vite et smartphone qui refuse de démarrer.',
      priceTND: 38.0,
      compareAtPriceTND: 45.0,
      category: 'ic-chips',
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
      ]),
      stock: 28,
      rating: 4.87,
      isNew: false,
      isFeatured: false,
      isActive: true,
      specs: JSON.stringify({
        brand: 'NXP OEM',
        model: '1610A3 BGA',
        compatibility: 'iPhone 6S à 7 Plus',
      }),
    },
    {
      name: 'Écran OLED Complet Super Retina XDR pour iPhone 13 Original Rénové',
      slug: 'ecran-oled-iphone-13-original-refurbished',
      description: 'Dalle OLED authentique reconditionnée avec vitre neuve 9H. Colorimétrie d’origine, sensibilité tactile 120Hz et support du transfert TrueTone.',
      priceTND: 360.0,
      compareAtPriceTND: 410.0,
      category: 'spare-parts',
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
      ]),
      stock: 4,
      rating: 4.95,
      isNew: false,
      isFeatured: true,
      isActive: true,
      specs: JSON.stringify({
        brand: 'Apple OEM Spec',
        resolution: '2532 x 1170 px',
        warranty: '3 Mois Garantie de Test',
      }),
    },
    {
      name: 'Batterie Haute Capacité Tianji 0 Cycle pour iPhone 12 (2815mAh)',
      slug: 'batterie-tianji-iphone-12-0cycle',
      description: 'Cellule lithium cobalt grade A+ avec puce TI évitant les alertes de santé. 0 cycle de charge, autonomie équivalente ou supérieure à la batterie d’origine.',
      priceTND: 65.0,
      compareAtPriceTND: 80.0,
      category: 'spare-parts',
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
      ]),
      stock: 18,
      rating: 4.84,
      isNew: false,
      isFeatured: false,
      isActive: true,
      specs: JSON.stringify({
        brand: 'Tianji Tech',
        capacity: '2815 mAh (10.78 Wh)',
        cycles: '0 Cycle Neuf',
        warranty: '6 Mois Échange Standard',
      }),
    },
    {
      name: 'Chargeur Rapide GaN III 65W Double USB-C + USB-A pour Atelier',
      slug: 'chargeur-gan-65w-double-type-c',
      description: 'Technologie Nitrure de Gallium compacte délivrant 65W réels Power Delivery. Permet de charger smartphones, tablettes et alimenter les circuits de test.',
      priceTND: 75.0,
      compareAtPriceTND: 95.0,
      category: 'accessories',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      ]),
      stock: 30,
      rating: 4.89,
      isNew: true,
      isFeatured: false,
      isActive: true,
      specs: JSON.stringify({
        brand: 'Baseus / Essager Pro',
        power: '65W Max GaN III',
        ports: '2x Type-C + 1x USB-A QC4.0',
        warranty: '12 Mois',
      }),
    },
  ];

  const createdProducts: any[] = [];
  for (const prod of productsData) {
    const created = await prisma.product.create({ data: prod });
    createdProducts.push(created);
  }
  console.log(`✅ ${createdProducts.length} products created`);

  // 4. Sample Order
  const quickStation = createdProducts[0];
  const amtechFlux = createdProducts[11];

  const subtotal = quickStation.priceTND * 1 + amtechFlux.priceTND * 2;
  const shipping = subtotal >= 300 ? 0 : 7.0;

  const sampleOrder = await prisma.order.create({
    data: {
      orderNumber: 'GSM-TN-2024-1082',
      userId: customerUser.id,
      customerName: 'Anis Ben Salah',
      customerPhone: '56229955',
      customerEmail: 'client@gsm.tn',
      governorate: 'Tunis',
      delegation: 'Centre Ville',
      address: 'Rue de Marseille, Immeuble Ribat',
      notes: 'Livraison express Aramex svp',
      subtotalTND: subtotal,
      shippingTND: shipping,
      totalTND: subtotal + shipping,
      status: 'CONFIRMED',
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      items: {
        create: [
          {
            productId: quickStation.id,
            productName: quickStation.name,
            priceTND: quickStation.priceTND,
            quantity: 1,
            totalTND: quickStation.priceTND * 1,
          },
          {
            productId: amtechFlux.id,
            productName: amtechFlux.name,
            priceTND: amtechFlux.priceTND,
            quantity: 2,
            totalTND: amtechFlux.priceTND * 2,
          },
        ],
      },
    },
  });

  console.log(`✅ Sample order created: ${sampleOrder.orderNumber}`);

  // 5. Sample Reviews
  await prisma.review.create({
    data: {
      productId: quickStation.id,
      name: 'Mohamed Ali Mansour (Atelier Sfax)',
      rating: 5,
      comment: 'Matériel d’origine exceptionnel, reçu en 24h à Sfax par Aramex. Température ultra stable et flux d’air parfait pour démonter les circuits BGA.',
      isApproved: true,
    },
  });

  await prisma.review.create({
    data: {
      productId: createdProducts[1].id, // AiXun
      name: 'Karim Cherif (Labo GSM Sousse)',
      rating: 5,
      comment: 'La station AiXun T3A chauffe vraiment en 2 secondes ! Qualité professionnelle certifiée, je recommande pour tous les techniciens en Tunisie.',
      isApproved: true,
    },
  });

  console.log('✅ Sample reviews created');
  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
