import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, BellRing, MessageCircle, Volume2, VolumeX, X } from 'lucide-react';
import { orderConfirmationMessage, whatsappLink } from '../lib/whatsapp';

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

type PendingOrder = Pick<NewOrderEvent, 'id' | 'orderNumber' | 'customerName' | 'customerPhone' | 'totalTND' | 'createdAt'>;

type Props = {
  /** Appelée quand l'admin clique sur une commande (ex. ouvrir la fiche de la commande) */
  onOpenOrder?: (orderId: string) => void;
  onPendingChange?: (pendingCount: number) => void;
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

export default function AdminOrderNotifier({ onOpenOrder, onPendingChange }: Props) {
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
  const baseTitle = useRef(typeof document !== 'undefined' ? document.title : '');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SOUND_KEY) === '1';
      setSoundOn(saved);
      soundOnRef.current = saved;
    } catch {
      /* stockage indisponible */
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications/summary', { credentials: 'include' });
      if (!res.ok) return;
      const json = await res.json();
      setPending(json.data.pending);
      setLatest(json.data.latest);
    } catch {
      /* réseau indisponible : on réessaiera */
    }
  }, []);

  const dismissToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => {
    onPendingChange?.(pending);
  }, [pending, onPendingChange]);

  useEffect(() => {
    refresh();

    const source = new EventSource('/api/admin/notifications/stream', { withCredentials: true });

    source.addEventListener('ready', refresh); // rattrape les commandes arrivées pendant une coupure
    source.addEventListener('new-order', (e) => {
      const order: NewOrderEvent = JSON.parse((e as MessageEvent).data);
      setToasts((prev) => [order, ...prev].slice(0, 4));
      window.setTimeout(() => dismissToast(order.id), 15000);
      refresh();

      if (soundOnRef.current && audioRef.current) playChime(audioRef.current);
      if ('vibrate' in navigator) navigator.vibrate?.([200, 100, 200]);
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
        new Notification(`Nouvelle commande ${order.orderNumber}`, {
          body: `${order.customerName} — ${order.totalTND.toFixed(3)} DT`,
        });
      }
    });
    source.addEventListener('order-updated', refresh);
    source.addEventListener('order-deleted', refresh);
    source.addEventListener('test', () => {
      const testNotification: NewOrderEvent = {
        id: `test-${Date.now()}`,
        orderNumber: 'TEST',
        customerName: 'Test de notification',
        customerPhone: '',
        governorate: '—',
        totalTND: 0,
        itemsCount: 0,
        createdAt: new Date().toISOString(),
        isTest: true,
      };
      setToasts((prev) => [testNotification, ...prev].slice(0, 4));
      window.setTimeout(() => dismissToast(testNotification.id), 15000);
      if (soundOnRef.current && audioRef.current) playChime(audioRef.current);
      if ('vibrate' in navigator) navigator.vibrate?.([200, 100, 200]);
      refresh();
    });

    const poll = window.setInterval(refresh, 60000); // filet de sécurité si le flux est coupé
    return () => {
      source.close();
      window.clearInterval(poll);
    };
  }, [refresh]);

  // Compteur dans l'onglet du navigateur : "(3) Admin"
  useEffect(() => {
    document.title = pending > 0 ? `(${pending}) ${baseTitle.current}` : baseTitle.current;
    return () => {
      document.title = baseTitle.current;
    };
  }, [pending]);

  const toggleSound = () => {
    const next = !soundOnRef.current;
    soundOnRef.current = next;
    setSoundOn(next);
    try {
      localStorage.setItem(SOUND_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
    if (next) {
      // Le navigateur n'autorise le son qu'après un clic : on crée le contexte audio ici
      audioRef.current = audioRef.current ?? new AudioContext();
      void audioRef.current.resume();
      playChime(audioRef.current);
    }
  };

  // Si le son était activé lors d'une visite précédente, il faut un nouveau clic pour réactiver l'audio
  useEffect(() => {
    if (!soundOn) return;
    const unlock = () => {
      audioRef.current = audioRef.current ?? new AudioContext();
      void audioRef.current.resume();
      window.removeEventListener('click', unlock);
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
                  <button type="button" className="flex-1 text-start" onClick={() => openOrder(o.id)}>
                    <div className="font-semibold">{o.orderNumber}</div>
                    <div className="text-gray-600">
                      {o.customerName} · {o.totalTND.toFixed(3)} DT
                    </div>
                  </button>
                  <a
                    href={whatsappLink(o.customerPhone, orderConfirmationMessage(o.customerName, o.orderNumber))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full p-2 text-green-600 hover:bg-green-50"
                    title="Écrire au client sur WhatsApp"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>
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
