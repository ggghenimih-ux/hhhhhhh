import { useEffect, useRef, useState } from 'react';
import { Bell, BellRing, MessageCircle, Package, Volume2, VolumeX, X } from 'lucide-react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { orderConfirmationMessage, whatsappLink } from '../lib/whatsapp';
import { getOrderTotal } from '../lib/orderTotals';

type NewOrderEvent = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  governorate: string;
  totalTND: number;
  itemsCount: number;
  createdAt: string;
  isTest?: boolean;
};

type PendingOrder = Pick<NewOrderEvent, 'id' | 'orderNumber' | 'customerName' | 'customerPhone' | 'totalTND' | 'itemsCount' | 'createdAt'>;

type Props = {
  /** Appelée quand l'admin clique sur une commande (ex. ouvrir la fiche de la commande) */
  onOpenOrder?: (orderId: string) => void;
  onPendingChange?: (pendingCount: number) => void;
  onOrdersSnapshot?: (orders: (Record<string, any> & { id: string })[]) => void;
  onUnreadChange?: (orderIds: string[]) => void;
};

const SOUND_KEY = 'admin_order_sound';

function playChime(ctx: AudioContext) {
  [880, 1175].forEach((freq, i) => {
    const t = ctx.currentTime + i * 0.28;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.55);
  });
}

export default function AdminOrderNotifier({
  onOpenOrder,
  onPendingChange,
  onOrdersSnapshot,
  onUnreadChange,
}: Props) {
  const { user } = useAuth();
  const [pending, setPending] = useState(0);
  const [latest, setLatest] = useState<PendingOrder[]>([]);
  const [toasts, setToasts] = useState<NewOrderEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );

  const audioRef = useRef<AudioContext | null>(null);
  const soundOnRef = useRef(false);
  const unreadOrderIds = useRef(new Set<string>());
  const baseTitle = useRef(typeof document !== 'undefined' ? document.title : '');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SOUND_KEY) === '1';
      setSoundOn(saved);
      soundOnRef.current = saved;
    } catch {
      console.warn('Impossible de lire la préférence audio des notifications.');
    }
  }, []);

  const dismissToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => {
    onPendingChange?.(pending);
  }, [pending, onPendingChange]);

  useEffect(() => {
    if (!user || !['ADMIN', 'TECHNICIEN'].includes(user.role || '')) {
      setPending(0);
      setLatest([]);
      return;
    }

    let isInitialSnapshot = true;
    unreadOrderIds.current.clear();
    onUnreadChange?.([]);
    const recentOrdersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(
      recentOrdersQuery,
      (snapshot) => {
        const orders = snapshot.docs
          .map((orderDoc): Record<string, any> & { id: string } => {
            const data: Record<string, any> = orderDoc.data();
            const createdAt = data.createdAt && typeof data.createdAt.toDate === 'function'
              ? data.createdAt.toDate().toISOString()
              : data.createdAt;
            return { ...data, createdAt, id: orderDoc.id };
          })
          .filter((order) => !order.deletedAt && !order.archivedAt)
          .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
        onOrdersSnapshot?.(orders);
        const pendingOrders = orders.filter((order) => String(order.status ?? '').toUpperCase() === 'PENDING');
        setPending(pendingOrders.length);
        setLatest(pendingOrders.slice(0, 5).map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber ?? '',
          customerName: order.customerName ?? '',
          customerPhone: order.customerPhone ?? '',
          totalTND: getOrderTotal(order),
          itemsCount: Array.isArray(order.items) ? order.items.length : 0,
          createdAt: order.createdAt ?? '',
        })));

        if (isInitialSnapshot) {
          isInitialSnapshot = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          const order = change.doc.data();
          if (change.type === 'added' && !order.deletedAt && !order.archivedAt) {
            if (!order.seenAt) unreadOrderIds.current.add(change.doc.id);
            const notification: NewOrderEvent = {
              id: change.doc.id,
              orderNumber: order.orderNumber ?? '',
              customerName: order.customerName ?? '',
              customerPhone: order.customerPhone ?? '',
              governorate: order.governorate ?? '',
              totalTND: getOrderTotal(order),
              itemsCount: Array.isArray(order.items) ? order.items.length : 0,
              createdAt: order.createdAt ?? '',
            };
            setToasts((current) => [notification, ...current].slice(0, 4));
            window.setTimeout(() => dismissToast(notification.id), 15000);
            if (soundOnRef.current && audioRef.current) playChime(audioRef.current);
            if ('vibrate' in navigator) navigator.vibrate?.([200, 100, 200]);
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
              new Notification(`Nouvelle commande ${notification.orderNumber}`, {
                body: `${notification.customerName} — ${notification.totalTND.toFixed(3)} DT`,
              });
            }
          } else if (change.type === 'modified' && order.seenAt) {
            unreadOrderIds.current.delete(change.doc.id);
          } else if (change.type === 'removed') {
            unreadOrderIds.current.delete(change.doc.id);
          }
        });
        onUnreadChange?.([...unreadOrderIds.current]);
      },
      (error) => {
        console.error('Impossible de recevoir les commandes Firestore en temps réel:', error);
      },
    );
    return unsubscribe;
  }, [user?.id, user?.role]);

  // Compteur dans l'onglet du navigateur : "(3) Admin"
  useEffect(() => {
    document.title = pending > 0 ? `(${pending}) ${baseTitle.current}` : baseTitle.current;
    return () => {
      document.title = baseTitle.current;
    };
  }, [pending]);

  const toggleSound = async () => {
    const next = !soundOnRef.current;
    if (next) {
      try {
        audioRef.current = audioRef.current ?? new AudioContext();
        await audioRef.current.resume();
        playChime(audioRef.current);
      } catch (error) {
        console.error('Impossible d’activer le son des notifications:', error);
        return;
      }
    }
    try {
      localStorage.setItem(SOUND_KEY, next ? '1' : '0');
    } catch {
      console.warn('Impossible d’enregistrer la préférence audio des notifications.');
    }
    soundOnRef.current = next;
    setSoundOn(next);
  };

  // Si le son était activé lors d'une visite précédente, il faut un nouveau clic pour réactiver l'audio
  useEffect(() => {
    if (!soundOn) return;
    const unlock = () => {
      try {
        audioRef.current = audioRef.current ?? new AudioContext();
        void audioRef.current.resume().catch((error) => {
          console.warn('Impossible de réactiver le son des notifications:', error);
        });
        window.removeEventListener('click', unlock);
      } catch (error) {
        console.error('Impossible de réactiver le son des notifications:', error);
      }
    };
    window.addEventListener('click', unlock);
    return () => window.removeEventListener('click', unlock);
  }, [soundOn]);

  const askPermission = async () => {
    if (typeof Notification === 'undefined') return;
    setPermission(await Notification.requestPermission());
  };

  const openOrder = (id: string) => {
    setOpen(false);
    dismissToast(id);
    onOpenOrder?.(id);
  };

  return (
    <>
      {/* Cloche + pastille */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="relative rounded-full p-2 text-slate-200 hover:bg-white/10"
            aria-label={`Commandes à traiter : ${pending}`}
          >
            {pending > 0 ? <BellRing className="h-6 w-6 text-orange-600" /> : <Bell className="h-6 w-6" />}
            {pending > 0 && (
              <span className="absolute -end-1 -top-1 min-w-5 rounded-full bg-red-600 px-1 text-center text-xs font-bold text-white">
                {pending > 99 ? '99+' : pending}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={toggleSound}
            className="rounded-lg border border-slate-600 px-2.5 py-2 text-[11px] font-semibold text-slate-200 hover:bg-white/10"
          >
            {soundOn ? 'Notifications sonores activées' : 'Activer les notifications sonores'}
          </button>
        </div>

        {open && (
          <div className="absolute end-0 z-50 mt-2 w-80 rounded-xl border bg-white p-3 text-start shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <strong>Commandes à traiter ({pending})</strong>
              <button type="button" onClick={toggleSound} className="rounded p-1 hover:bg-black/5" title="Son">
                {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
            </div>

            {latest.length === 0 && <p className="py-4 text-center text-sm text-gray-500">Aucune commande en attente.</p>}

            <ul className="space-y-2">
              {latest.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 p-2 text-sm">
                  <button type="button" className="flex flex-1 items-center gap-3 text-start" onClick={() => openOrder(o.id)}>
                    <Package className="h-5 w-5 shrink-0 text-slate-500" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{o.orderNumber}</span>
                      <span className="block truncate text-gray-600">{o.customerName}</span>
                      <span className="block text-gray-600">{o.itemsCount} article(s) · {o.totalTND.toFixed(3)} DT</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {permission === 'default' && (
              <button
                type="button"
                onClick={askPermission}
                className="mt-3 w-full rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Activer les alertes du navigateur
              </button>
            )}
          </div>
        )}
      </div>

      {/* Alertes en direct */}
      <div className="pointer-events-none fixed end-4 top-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto rounded-xl border-s-4 border-orange-500 bg-white p-3 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold">
                  {t.isTest ? 'Test de notification' : `🛒 Nouvelle commande ${t.orderNumber}`}
                </div>
                <div className="text-sm text-gray-700">
                  {t.customerName} · {t.governorate}
                </div>
                <div className="text-sm font-semibold">
                  {t.totalTND.toFixed(3)} DT · {t.itemsCount} article(s)
                </div>
              </div>
              <button type="button" onClick={() => dismissToast(t.id)} className="rounded p-1 hover:bg-black/5">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => openOrder(t.id)}
                className="flex-1 rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white"
              >
                Voir la commande
              </button>
              <a
                href={whatsappLink(t.customerPhone, orderConfirmationMessage(t.customerName, t.orderNumber))}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-green-700"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
