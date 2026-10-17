import { auth } from './firebase'; // تأكد من صحة مسار استيراد auth حسب هيكلة مشروعك

// دالة رفع الصور إلى السيرفر الخاص بك (upload.php)
export const uploadImage = async (file: File) => {
  // 1. التحقق من أن الملف المرفوع هو صورة
  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier doit être une image.');
  }

  // 2. تجهيز البيانات لإرسالها عبر FormData
  const formData = new FormData();
  formData.append('image', file);

  // 3. الحصول على توكن المستخدم الحالي للتحقق من هوية الأدمن
  const token = await auth.currentUser?.getIdToken();
  if (token) {
    formData.append('token', token);
  }

  // 4. إرسال الطلب إلى رابط الـ PHP على الاستضافة
  const response = await fetch('https://www.outilsreparationgsm.tn/upload.php', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  // 5. معالجة الاستجابة
  if (data.success) {
    return {
      url: data.url,
      filename: file.name,
    };
  } else {
    throw new Error(data.error || 'Erreur lors du téléchargement de l’image.');
  }
};