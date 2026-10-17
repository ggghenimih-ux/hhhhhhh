import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from './firebase';

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore?: boolean;
  };
}

type DocumentData = Record<string, any>;

export const IMPORT_PRODUCT_CATEGORIES = [
  'Accessories',
  'Equipments Tools',
  'IC Chips',
  'Measuring And Power Supply',
  'Microscopes',
  'Programming And Flashing',
  'Screen Refurbish Tools',
  'Soldering And Hot Air',
  'Spare Parts',
] as const;

export interface ImportedProduct {
  ref: string;
  name: string;
  priceTND: number;
  category: string;
  image: string;
}

export interface ProductImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ ref: string; message: string }>;
}

const categorySlug = (name: string) =>
  name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const asIsoStrings = (value: any): any => {
  if (value && typeof value.toDate === 'function') return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(asIsoStrings);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, asIsoStrings(item)]));
  }
  return value;
};

const documentData = (id: string, data: DocumentData) => ({
  ...asIsoStrings(data),
  id,
});

const getCollection = async (name: string) => {
  const snapshot = await getDocs(collection(db, name));
  return snapshot.docs.map((item) => documentData(item.id, item.data()));
};

const getProductWithReviews = async (id: string, data: DocumentData) => {
  const reviewSnapshot = await getDocs(
    query(collection(db, 'reviews'), where('productId', '==', id)),
  );
  const reviews = reviewSnapshot.docs
    .map((item) => documentData(item.id, item.data()))
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
  return { ...documentData(id, data), reviews, reviewsCount: reviews.length };
};

const uploadImage = async (file: File) => {
  if (!file.type.startsWith('image/')) throw new Error('Le fichier doit être une image.');

  const formData = new FormData();
  formData.append('image', file);

  const token = await auth.currentUser?.getIdToken();
  if (token) formData.append('token', token);

  const response = await fetch('https://www.outilsreparationgsm.tn/upload.php', {
    method: 'POST',
    body: formData,
  });

  let data: { success?: boolean; url?: string; filename?: string; error?: string; message?: string };
  try {
    data = await response.json();
  } catch {
    throw new Error(`Réponse invalide du serveur de téléchargement (${response.status}).`);
  }

  if (!response.ok || !data.success || typeof data.url !== 'string' || !data.url.trim()) {
    throw new Error(
      data.message || data.error || `Erreur lors du téléchargement de l’image (${response.status}).`,
    );
  }

  return {
    url: data.url,
    filename: data.filename || file.name,
  };
};

const getOrders = async () => {
  const orders = await getCollection('orders');
  return orders.filter((order) => !order.deletedAt);
};

const archiveSelections = new Map<string, string[]>();

const dateIsInRange = (value: unknown, fromDate: string, toDate: string) => {
  if (typeof value !== 'string') return false;
  const date = value.slice(0, 10);
  return date >= fromDate && date <= toDate;
};

export const api = {
  products: {
    getAll: async (params: Record<string, any> = {}): Promise<ApiResponse<any[]>> => {
      let products = await getCollection('products');
      const isAdmin = params.admin === 'true';
      if (!isAdmin) products = products.filter((product) => product.isActive !== false);
      if (params.category) products = products.filter((product) => product.category === params.category);
      if (params.minPrice !== undefined) {
        products = products.filter((product) => Number(product.priceTND ?? product.price) >= Number(params.minPrice));
      }
      if (params.maxPrice !== undefined) {
        products = products.filter((product) => Number(product.priceTND ?? product.price) <= Number(params.maxPrice));
      }
      if (params.status === 'active') products = products.filter((product) => product.isActive !== false);
      if (params.status === 'inactive') products = products.filter((product) => product.isActive === false);
      if (params.search) {
        const search = String(params.search).trim().toLocaleLowerCase();
        products = products.filter((product) =>
          `${JSON.stringify(product.name)} ${product.sku ?? ''} ${product.brand ?? ''}`
            .toLocaleLowerCase()
            .includes(search),
        );
      }

      const sortBy = params.sortBy;
      products.sort((a, b) => {
        if (sortBy === 'price-asc') return Number(a.priceTND ?? a.price) - Number(b.priceTND ?? b.price);
        if (sortBy === 'price-desc') return Number(b.priceTND ?? b.price) - Number(a.priceTND ?? a.price);
        if (sortBy === 'rating') return Number(b.rating ?? 0) - Number(a.rating ?? 0);
        if (sortBy === 'oldest') return String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? ''));
        if (sortBy === 'name') return String(a.name ?? '').localeCompare(String(b.name ?? ''));
        return String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));
      });

      const page = Math.max(1, Number(params.page) || 1);
      const pageSize = Math.max(1, Number(params.limit) || products.length || 1);
      const total = products.length;
      const data = products.slice((page - 1) * pageSize, page * pageSize);
      return {
        success: true,
        data,
        pagination: {
          total,
          page,
          limit: pageSize,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
          hasMore: page * pageSize < total,
        },
      };
    },
    getById: async (id: string) => {
      const snapshot = await getDoc(doc(db, 'products', id));
      return { success: true, data: snapshot.exists() ? await getProductWithReviews(id, snapshot.data()) : null };
    },
    getBySlug: async (slug: string) => {
      const snapshot = await getDocs(query(collection(db, 'products'), where('slug', '==', slug), limit(1)));
      const product = snapshot.docs[0];
      return {
        success: true,
        data: product ? await getProductWithReviews(product.id, product.data()) : null,
      };
    },
    create: async (productData: DocumentData): Promise<ApiResponse<any>> => {
      const now = new Date().toISOString();
      const reference = await addDoc(collection(db, 'products'), {
        ...productData,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, data: { id: reference.id, ...productData, createdAt: now, updatedAt: now } };
    },
    update: async (id: string, productData: DocumentData): Promise<ApiResponse<any>> => {
      const updatedAt = new Date().toISOString();
      await updateDoc(doc(db, 'products', id), { ...productData, updatedAt });
      return { success: true, data: { id, ...productData, updatedAt } };
    },
    delete: async (id: string) => {
      const orders = await getOrders();
      const hasOrders = orders.some((order) =>
        Array.isArray(order.items) && order.items.some((item: DocumentData) => item.productId === id),
      );
      if (hasOrders) {
        await updateDoc(doc(db, 'products', id), { isActive: false, updatedAt: new Date().toISOString() });
        return {
          success: true,
          softDeleted: true,
          message: 'Le produit est lié à des commandes et a été masqué pour préserver leur historique.',
        };
      }
      await deleteDoc(doc(db, 'products', id));
      return { success: true, deleted: true, message: 'Produit supprimé.' };
    },
    patchStatus: async (id: string, isActive: boolean) => {
      await updateDoc(doc(db, 'products', id), { isActive, updatedAt: new Date().toISOString() });
      return { success: true, message: isActive ? 'Produit activé.' : 'Produit masqué.' };
    },
  },

  settings: {
    get: async () => {
      const snapshot = await getDoc(doc(db, 'settings', 'store'));
      return { success: true, data: snapshot.exists() ? documentData(snapshot.id, snapshot.data()) : null };
    },
    update: async (data: DocumentData): Promise<ApiResponse<any>> => {
      const updatedAt = new Date().toISOString();
      await setDoc(doc(db, 'settings', 'store'), { ...data, updatedAt }, { merge: true });
      return { success: true, data: { ...data, id: 'store', updatedAt } };
    },
    uploadLogo: async (file: File) => {
      const result = await uploadImage(file);
      return { success: true, data: { logoUrl: result.url }, ...result };
    },
    uploadFavicon: async (file: File) => {
      const result = await uploadImage(file);
      return { success: true, data: { faviconUrl: result.url }, ...result };
    },
  },

  categories: {
    getAll: async () => {
      const categories = await getCollection('categories');
      categories.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
      return { success: true, data: categories };
    },
    create: async (data: DocumentData) => {
      const reference = await addDoc(collection(db, 'categories'), data);
      return { success: true, data: { id: reference.id, ...data } };
    },
    update: async (id: string, data: DocumentData) => {
      await updateDoc(doc(db, 'categories', id), data);
      return { success: true, data: { id, ...data } };
    },
    delete: async (id: string) => {
      const categorySnapshot = await getDoc(doc(db, 'categories', id));
      if (!categorySnapshot.exists()) throw new Error('Catégorie introuvable.');
      const category = categorySnapshot.data();
      const products = await getCollection('products');
      if (products.some((product) => product.category === category.slug)) {
        throw new Error('Cette catégorie contient encore des produits.');
      }
      await deleteDoc(doc(db, 'categories', id));
      return { success: true };
    },
  },

  productImport: {
    getExistingCategories: async () => {
      const categories = await getCollection('categories');
      return categories.filter((category) => {
        const name = typeof category.name === 'string'
          ? category.name
          : category.name?.en ?? category.name?.fr ?? '';
        return IMPORT_PRODUCT_CATEGORIES.some(
          (knownName) => name.trim().toLocaleLowerCase() === knownName.toLocaleLowerCase(),
        );
      });
    },
    import: async (
      products: ImportedProduct[],
      onProgress: (completed: number, total: number) => void,
    ): Promise<ProductImportResult> => {
      const result: ProductImportResult = { created: 0, updated: 0, failed: 0, errors: [] };
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      const existingCategories = new Set(categoriesSnapshot.docs.flatMap((category) => {
        const name = category.data().name;
        const label = typeof name === 'string' ? name : name?.en ?? name?.fr ?? '';
        return [label.trim().toLocaleLowerCase(), categorySlug(String(category.data().slug ?? ''))];
      }));
      const missingCategories = IMPORT_PRODUCT_CATEGORIES.filter(
        (name) => !existingCategories.has(name.toLocaleLowerCase())
          && !existingCategories.has(categorySlug(name)),
      );

      if (missingCategories.length > 0) {
        const categoriesBatch = writeBatch(db);
        missingCategories.forEach((name) => {
          const slug = categorySlug(name);
          categoriesBatch.set(doc(db, 'categories', slug), {
            name,
            slug,
            description: '',
            isActive: true,
            order: IMPORT_PRODUCT_CATEGORIES.indexOf(name) + 1,
          }, { merge: true });
        });
        await categoriesBatch.commit();
      }

      const refreshedCategories = await getDocs(collection(db, 'categories'));
      const categorySlugs = new Map<string, string>();
      refreshedCategories.docs.forEach((category) => {
        const data = category.data();
        const label = typeof data.name === 'string' ? data.name : data.name?.en ?? data.name?.fr ?? '';
        const normalizedName = label.trim().toLocaleLowerCase();
        const knownName = IMPORT_PRODUCT_CATEGORIES.find(
          (name) => name.toLocaleLowerCase() === normalizedName || categorySlug(name) === data.slug,
        );
        if (knownName) categorySlugs.set(knownName, data.slug || categorySlug(knownName));
      });
      const unavailableCategories = IMPORT_PRODUCT_CATEGORIES.filter((name) => !categorySlugs.has(name));
      if (unavailableCategories.length > 0) {
        throw new Error(`Catégories introuvables après création : ${unavailableCategories.join(', ')}.`);
      }

      const preparedProducts: Array<{
        ref: string;
        data: DocumentData;
        exists: boolean;
      }> = [];

      for (const product of products) {
        try {
          const ref = product.ref.trim();
          const priceTND = Number(product.priceTND);
          const category = IMPORT_PRODUCT_CATEGORIES.find(
            (name) => name.toLocaleLowerCase() === product.category.toLocaleLowerCase(),
          );
          if (!ref) throw new Error('Référence vide.');
          if (!Number.isFinite(priceTND) || priceTND < 0) throw new Error('Prix invalide.');
          if (!category) throw new Error(`Catégorie inconnue : ${product.category}.`);

          const productRef = doc(db, 'products', ref);
          const existing = await getDoc(productRef);
          const now = new Date().toISOString();
          const name = product.name.trim();
          const image = product.image.trim()
            ? `/products/${product.image.trim().replace(/^\/+/, '')}`
            : '/logo.jpg';
          const data: DocumentData = {
            name,
            priceTND,
            category: categorySlugs.get(category)!,
            image,
            images: [image],
            brand: typeof existing.data()?.brand === 'string' ? existing.data()!.brand : '',
          };
          if (!existing.exists()) {
            data.slug = ref;
            data.createdAt = now;
          }

          preparedProducts.push({ ref, data, exists: existing.exists() });
        } catch (error) {
          result.failed += 1;
          result.errors.push({
            ref: product.ref,
            message: error instanceof Error ? error.message : 'Erreur inconnue.',
          });
        }
      }

      for (let offset = 0; offset < preparedProducts.length; offset += 450) {
        const chunk = preparedProducts.slice(offset, offset + 450);
        const batch = writeBatch(db);
        chunk.forEach((product) => {
          batch.set(doc(db, 'products', product.ref), product.data, { merge: true });
        });
        try {
          await batch.commit();
          chunk.forEach((product) => {
            if (product.exists) result.updated += 1;
            else result.created += 1;
          });
        } catch (batchError) {
          for (const product of chunk) {
            try {
              await setDoc(doc(db, 'products', product.ref), product.data, { merge: true });
              if (product.exists) result.updated += 1;
              else result.created += 1;
            } catch (error) {
              result.failed += 1;
              result.errors.push({
                ref: product.ref,
                message: error instanceof Error
                  ? error.message
                  : batchError instanceof Error
                    ? batchError.message
                    : 'Échec de l’écriture Firestore.',
              });
            }
          }
        }
        onProgress(Math.min(offset + chunk.length, products.length), products.length);
      }

      return result;
    },
  },

  orders: {
    create: async (orderData: DocumentData): Promise<ApiResponse<any>> => {
      // إرسال الطلب مباشرة إلى Firestore بدون الحاجة للـ Cloud Functions
      const payload = {
        ...orderData,
        userId: auth.currentUser?.uid ?? null,
        status: 'pending',
        orderStatus: 'pending',
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'orders'), payload);
      const newOrder = { id: docRef.id, ...payload };

      return {
        success: true,
        data: newOrder,
      };
    },
    getById: async (id: string) => {
      const snapshot = await getDoc(doc(db, 'orders', id));
      return { success: true, data: snapshot.exists() ? documentData(snapshot.id, snapshot.data()) : null };
    },
    getByNumber: async (orderNumber: string) => {
      const currentUser = auth.currentUser;
      if (!currentUser) return { success: true, data: null };
      const userSnapshot = await getDoc(doc(db, 'users', currentUser.uid));
      const isStaff = ['ADMIN', 'TECHNICIEN'].includes(userSnapshot.data()?.role);
      const orderQuery = isStaff
        ? query(collection(db, 'orders'), where('orderNumber', '==', orderNumber), limit(1))
        : query(collection(db, 'orders'), where('userId', '==', currentUser.uid));
      const snapshot = await getDocs(orderQuery);
      const order = snapshot.docs.find((item) => item.data().orderNumber === orderNumber);
      return {
        success: true,
        data: order ? documentData(order.id, order.data()) : null,
      };
    },
    getAdminOrders: async (params: Record<string, any> = {}) => {
      const orders = (await getOrders())
        .filter((order) => !order.archivedAt)
        .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
      const page = Math.max(1, Number(params.page) || 1);
      const pageSize = Math.max(1, Number(params.limit) || 100);
      return {
        success: true,
        data: orders.slice((page - 1) * pageSize, page * pageSize),
        pagination: {
          total: orders.length,
          page,
          limit: pageSize,
          totalPages: Math.max(1, Math.ceil(orders.length / pageSize)),
        },
      };
    },
    getAdminStats: async () => {
      const [orders, products, categories] = await Promise.all([
        getOrders(),
        getCollection('products'),
        getCollection('categories'),
      ]);
      const completedOrders = orders.filter((order) => order.status !== 'CANCELLED');
      return {
        success: true,
        data: {
          totalOrders: orders.length,
          totalRevenue: completedOrders.reduce((sum, order) => sum + Number(order.totalTND ?? 0), 0),
          totalProducts: products.filter((product) => product.isActive !== false).length,
          catalogProducts: products.length,
          totalCategories: categories.length,
          deliveredOrders: orders.filter((order) => order.status === 'DELIVERED').length,
          recentOrders: orders.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))).slice(0, 5),
        },
      };
    },
    previewArchive: async (fromDate: string, toDate: string) => {
      const selected = (await getOrders()).filter((order) =>
        !order.archivedAt && dateIsInRange(order.createdAt, fromDate, toDate),
      );
      return { success: true, count: selected.length, data: { count: selected.length, fromDate, toDate } };
    },
    exportArchive: async (fromDate: string, toDate: string) => {
      const selected = (await getOrders()).filter((order) =>
        !order.archivedAt && dateIsInRange(order.createdAt, fromDate, toDate),
      );
      const token = crypto.randomUUID();
      archiveSelections.set(token, selected.map((order) => order.id));
      return {
        data: { fromDate, toDate, count: selected.length, data: selected },
        token,
      };
    },
    archiveExported: async (token: string, confirmedCount: number) => {
      const ids = archiveSelections.get(token);
      if (!ids || ids.length !== confirmedCount) throw new Error('La sélection d’export a expiré ou changé.');
      if (ids.length > 450) throw new Error('Exportez moins de 450 commandes à la fois pour éviter un archivage partiel.');
      const batch = writeBatch(db);
      const archivedAt = new Date().toISOString();
      ids.forEach((id) => batch.update(doc(db, 'orders', id), { archivedAt, updatedAt: archivedAt }));
      await batch.commit();
      archiveSelections.delete(token);
      return { success: true, message: `${ids.length} commande(s) archivée(s).` };
    },
    getArchived: async (params: Record<string, any> = {}) => {
      const archived = (await getOrders())
        .filter((order) => Boolean(order.archivedAt))
        .sort((a, b) => String(b.archivedAt).localeCompare(String(a.archivedAt)));
      const page = Math.max(1, Number(params.page) || 1);
      const pageSize = Math.max(1, Number(params.limit) || 100);
      return {
        success: true,
        data: archived.slice((page - 1) * pageSize, page * pageSize),
        pagination: { total: archived.length, page, limit: pageSize, totalPages: Math.max(1, Math.ceil(archived.length / pageSize)) },
      };
    },
    restoreArchived: async (id: string) => {
      await updateDoc(doc(db, 'orders', id), { archivedAt: deleteField(), updatedAt: new Date().toISOString() });
      return { success: true };
    },
    updateStatus: async (id: string, status: string, paymentStatus?: string) => {
      const data: DocumentData = { status, orderStatus: status, updatedAt: new Date().toISOString() };
      if (paymentStatus) data.paymentStatus = paymentStatus;
      await updateDoc(doc(db, 'orders', id), data);
      return { success: true, data: { id, ...data } };
    },
    update: async (id: string, data: DocumentData): Promise<ApiResponse<any>> => {
      const updatedAt = new Date().toISOString();
      await updateDoc(doc(db, 'orders', id), { ...data, updatedAt });
      return { success: true, data: { id, ...data, updatedAt } };
    },
    delete: async (id: string) => {
      const deletedAt = new Date().toISOString();
      await updateDoc(doc(db, 'orders', id), { deletedAt, updatedAt: deletedAt });
      return { success: true, message: 'Commande masquée; son historique est conservé.' };
    },
  },

  adminUsers: {
    getAll: async (params: { page?: number; limit?: number; search?: string } = {}) => {
      let users = await getCollection('users');
      const orders = await getOrders();
      const orderCounts = new Map<string, number>();
      orders.forEach((order) => {
        if (typeof order.userId === 'string') orderCounts.set(order.userId, (orderCounts.get(order.userId) ?? 0) + 1);
      });
      users = users.map((user) => ({ ...user, _count: { orders: orderCounts.get(user.id) ?? 0 } }));
      if (params.search) {
        const search = params.search.toLocaleLowerCase();
        users = users.filter((user) => `${user.name ?? ''} ${user.email ?? ''} ${user.phone ?? ''}`.toLocaleLowerCase().includes(search));
      }
      users.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
      const page = Math.max(1, Number(params.page) || 1);
      const pageSize = Math.max(1, Number(params.limit) || 25);
      return {
        success: true,
        data: users.slice((page - 1) * pageSize, page * pageSize),
        pagination: { total: users.length, page, limit: pageSize, totalPages: Math.max(1, Math.ceil(users.length / pageSize)) },
      };
    },
    updateRole: async (
      id: string,
      role: 'ADMIN' | 'CUSTOMER' | 'TECHNICIEN',
    ): Promise<ApiResponse<any>> => {
      await updateDoc(doc(db, 'users', id), { role, updatedAt: new Date().toISOString() });
      return { success: true, data: { id, role } };
    },
  },

  reviews: {
    create: async (data: { productId: string; name: string; rating: number; comment: string }) => {
      const createdAt = new Date().toISOString();
      const reference = await addDoc(collection(db, 'reviews'), {
        ...data,
        rating: Math.min(5, Math.max(1, Math.floor(data.rating))),
        createdAt,
      });
      return { success: true, data: { id: reference.id, ...data, createdAt } };
    },
  },

  upload: {
    image: async (file: File) => ({ success: true, ...(await uploadImage(file)) }),
  },
};