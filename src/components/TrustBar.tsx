import React from 'react';
import { Banknote, CheckCircle2, MessageCircle, Truck } from 'lucide-react';
import { useStoreSettings } from '../context/StoreSlices';
import { whatsappLink } from '../lib/whatsapp';

export const TrustBar: React.FC = () => {
  const { language, settings, formatPrice } = useStoreSettings();
  const whatsappNumber = settings.whatsappNumber || settings.whatsapp || settings.phone;
  const whatsappUrl = whatsappNumber ? whatsappLink(whatsappNumber) : '';
  const items = [
    {
      icon: Truck,
      title: language === 'ar' ? 'توصيل خلال 24/48 ساعة' : language === 'en' ? 'Delivery in 24/48h' : 'Livraison 24/48h',
      description: language === 'ar'
        ? `مصاريف الشحن ${formatPrice(settings.defaultShippingTND)}`
        : language === 'en'
          ? `Shipping fee: ${formatPrice(settings.defaultShippingTND)}`
          : `Frais : ${formatPrice(settings.defaultShippingTND)}`,
    },
    {
      icon: Banknote,
      title: language === 'ar' ? 'الدفع عند الاستلام' : language === 'en' ? 'Cash on delivery' : 'Paiement à la livraison',
      description: language === 'ar' ? 'ادفع عند استلام طلبك' : language === 'en' ? 'Pay when your order arrives' : 'Réglez à la réception',
    },
    {
      icon: CheckCircle2,
      title: language === 'ar' ? 'منتجات مختبرة' : language === 'en' ? 'Tested products' : 'Produits testés',
      description: language === 'ar' ? 'مختارة لورشتك' : language === 'en' ? 'Selected for your workshop' : 'Sélectionnés pour votre atelier',
    },
    {
      icon: MessageCircle,
      title: language === 'ar' ? 'اطلب عبر WhatsApp' : language === 'en' ? 'Order on WhatsApp' : 'Commande WhatsApp',
      description: language === 'ar' ? 'فريقنا يجيب عن أسئلتك' : language === 'en' ? 'Ask us before you order' : 'Un conseil avant de commander',
    },
  ];

  return (
    <section
      className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
      aria-label={language === 'ar' ? 'مميزات المتجر' : language === 'en' ? 'Store benefits' : 'Avantages de la boutique'}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item, index) => {
          const Icon = item.icon;
          const content = (
            <>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F1B2D] text-white">
                <Icon className={`h-5 w-5 ${index === 3 ? 'text-[#1FA855]' : 'text-orange-300'}`} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-extrabold text-[#0F1B2D] sm:text-sm">{item.title}</span>
                <span className="mt-1 block truncate text-[10px] text-[#5B6B82] sm:text-xs">{item.description}</span>
              </span>
            </>
          );

          return index === 3 && whatsappUrl ? (
            <a
              key={item.title}
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#E3E8F0] bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:p-4"
            >
              {content}
            </a>
          ) : (
            <div
              key={item.title}
              className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#E3E8F0] bg-white p-3 shadow-sm sm:p-4"
            >
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
};
