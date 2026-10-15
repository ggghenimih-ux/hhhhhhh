const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// قراءة مفتاح الخدمة مباشرة
const serviceAccountPath = path.join(__dirname, 'my-key.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// تهيئة التطبيق بالطريقة الحديثة والمضمونة
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function uploadData() {
  try {
    let rawData;
    const possiblePaths = [
      path.join(__dirname, 'products_import.json'),
      './products_import.json',
      'products_import.json'
    ];

    let foundPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        foundPath = p;
        break;
      }
    }

    if (!foundPath) {
      throw new Error("لم يتم العثور على ملف products_import.json في مجلد المشروع!");
    }

    rawData = fs.readFileSync(foundPath, 'utf8');
    const products = JSON.parse(rawData);

    console.log(`جاري رفع ${products.length} منتج إلى Firestore...`);

    for (const p of products) {
      if (!p.id) continue;
      await db.collection('products').doc(String(p.id)).set({
        name: p.name || '',
        price: Number(p.price) || 0,
        category: p.category || '',
        currency: p.currency || 'TND',
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    console.log('✅ تم رفع جميع المنتجات بنجاح إلى قاعدة البيانات!');
    process.exit(0);
  } catch (error) {
    console.error('❌ حدث خطأ أثناء الرفع:', error);
    process.exit(1);
  }
}

uploadData();