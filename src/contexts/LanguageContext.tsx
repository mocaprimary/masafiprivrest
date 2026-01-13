import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.menu': 'Menu',
    'nav.reservations': 'Reservations',
    'nav.orders': 'Orders',
    'nav.admin': 'Admin',
    
    // Menu Categories
    'category.all': 'All',
    'category.starters': 'Starters',
    'category.main': 'Main Courses',
    'category.desserts': 'Desserts',
    
    // Subcategories
    'subcategory.hotStarters': 'Hot Starters',
    'subcategory.coldStarters': 'Cold Starters',
    'subcategory.risotto': 'Italian Rice (Risotto)',
    'subcategory.pizza': 'Pizza',
    'subcategory.fish': 'Fish',
    'subcategory.meat': 'Meat',
    'subcategory.chicken': 'Chicken',
    'subcategory.sweet': 'Desserts',
    
    // Menu Item
    'item.addToOrder': 'Add to Order',
    'item.share': 'Share',
    'item.ingredients': 'Ingredients',
    'item.allergens': 'Allergens',
    'item.calories': 'Calories',
    'item.vegan': 'Vegan',
    'item.vegetarian': 'Vegetarian',
    'item.glutenFree': 'Gluten Free',
    'item.spicy': 'Spicy',
    
    // Reservation
    'reservation.title': 'Book a Table',
    'reservation.subtitle': 'Small security deposit required',
    'reservation.cta': 'Book Your Table',
    'reservation.fullName': 'Full Name',
    'reservation.phone': 'Phone Number',
    'reservation.email': 'Email (Optional)',
    'reservation.guests': 'Number of Guests',
    'reservation.date': 'Preferred Date',
    'reservation.time': 'Preferred Time',
    'reservation.requests': 'Special Requests',
    'reservation.deposit': 'Security Deposit',
    'reservation.depositNote': 'Refundable upon purchase',
    'reservation.confirm': 'Confirm & Pay Deposit',
    'reservation.policy': 'Deposit Policy',
    'reservation.policyCancel': 'Cancel before arrival → Full refund',
    'reservation.policyNoShow': 'No-show → Deposit forfeited',
    'reservation.policyNoPurchase': 'Arrive but leave without purchase → Deposit forfeited',
    'reservation.policyPurchase': 'Make any purchase → Deposit returned',
    
    // Check-in
    'checkin.title': 'Guest Check-in',
    'checkin.scan': 'Scan Reservation QR',
    'checkin.or': 'or',
    'checkin.enter': 'Enter Reservation Number',
    'checkin.verify': 'Verify',
    'checkin.success': 'Check-in Successful',
    'checkin.depositNote': 'Deposit will be returned after purchase. If you leave without buying, the deposit will be forfeited.',
    
    // Order
    'order.title': 'Your Order',
    'order.table': 'Table',
    'order.selectTable': 'Select Table',
    'order.empty': 'Your order is empty',
    'order.subtotal': 'Subtotal',
    'order.deposit': 'Deposit Credit',
    'order.total': 'Total',
    'order.placeOrder': 'Place Order',
    'order.pay': 'Pay Now',
    'order.status.placed': 'Order Placed',
    'order.status.preparing': 'Preparing',
    'order.status.ready': 'Ready',
    'order.status.served': 'Served',
    
    // General
    'currency': 'AED',
    'loading': 'Loading...',
    'error': 'An error occurred',
    'success': 'Success!',
    'cancel': 'Cancel',
    'save': 'Save',
    'close': 'Close',
    'welcome': 'Welcome to',
    'restaurantName': 'The Oasis',
    'tagline': 'Private Dining Experience',
  },
  ar: {
    // Navigation
    'nav.menu': 'القائمة',
    'nav.reservations': 'الحجوزات',
    'nav.orders': 'الطلبات',
    'nav.admin': 'الإدارة',
    
    // Menu Categories
    'category.all': 'الكل',
    'category.starters': 'المقبلات',
    'category.main': 'الأطباق الرئيسية',
    'category.desserts': 'الحلويات',
    
    // Subcategories
    'subcategory.hotStarters': 'مقبلات ساخنة',
    'subcategory.coldStarters': 'مقبلات باردة',
    'subcategory.risotto': 'الأرز الإيطالي (ريزوتو)',
    'subcategory.pizza': 'بيتزا',
    'subcategory.fish': 'الأسماك',
    'subcategory.meat': 'اللحوم',
    'subcategory.chicken': 'الدجاج',
    'subcategory.sweet': 'الحلويات',
    
    // Menu Item
    'item.addToOrder': 'أضف للطلب',
    'item.share': 'مشاركة',
    'item.ingredients': 'المكونات',
    'item.allergens': 'مسببات الحساسية',
    'item.calories': 'السعرات الحرارية',
    'item.vegan': 'نباتي',
    'item.vegetarian': 'نباتي',
    'item.glutenFree': 'خالي من الغلوتين',
    'item.spicy': 'حار',
    
    // Reservation
    'reservation.title': 'احجز طاولة',
    'reservation.subtitle': 'يتطلب تأمين بسيط',
    'reservation.cta': 'احجز طاولتك',
    'reservation.fullName': 'الاسم الكامل',
    'reservation.phone': 'رقم الهاتف',
    'reservation.email': 'البريد الإلكتروني (اختياري)',
    'reservation.guests': 'عدد الضيوف',
    'reservation.date': 'التاريخ المفضل',
    'reservation.time': 'الوقت المفضل',
    'reservation.requests': 'طلبات خاصة',
    'reservation.deposit': 'التأمين',
    'reservation.depositNote': 'قابل للاسترداد عند الشراء',
    'reservation.confirm': 'تأكيد ودفع التأمين',
    'reservation.policy': 'سياسة التأمين',
    'reservation.policyCancel': 'إلغاء قبل الوصول ← استرداد كامل',
    'reservation.policyNoShow': 'عدم الحضور ← مصادرة التأمين',
    'reservation.policyNoPurchase': 'الحضور والمغادرة دون شراء ← مصادرة التأمين',
    'reservation.policyPurchase': 'إجراء أي شراء ← استرداد التأمين',
    
    // Check-in
    'checkin.title': 'تسجيل دخول الضيف',
    'checkin.scan': 'مسح رمز الحجز',
    'checkin.or': 'أو',
    'checkin.enter': 'أدخل رقم الحجز',
    'checkin.verify': 'تحقق',
    'checkin.success': 'تم تسجيل الدخول بنجاح',
    'checkin.depositNote': 'سيتم إرجاع التأمين بعد الشراء. إذا غادرت دون شراء، سيتم مصادرة التأمين.',
    
    // Order
    'order.title': 'طلبك',
    'order.table': 'الطاولة',
    'order.selectTable': 'اختر الطاولة',
    'order.empty': 'طلبك فارغ',
    'order.subtotal': 'المجموع الفرعي',
    'order.deposit': 'رصيد التأمين',
    'order.total': 'المجموع',
    'order.placeOrder': 'تأكيد الطلب',
    'order.pay': 'ادفع الآن',
    'order.status.placed': 'تم الطلب',
    'order.status.preparing': 'قيد التحضير',
    'order.status.ready': 'جاهز',
    'order.status.served': 'تم التقديم',
    
    // General
    'currency': 'درهم',
    'loading': 'جاري التحميل...',
    'error': 'حدث خطأ',
    'success': 'تم بنجاح!',
    'cancel': 'إلغاء',
    'save': 'حفظ',
    'close': 'إغلاق',
    'welcome': 'مرحباً بكم في',
    'restaurantName': 'الواحة',
    'tagline': 'تجربة طعام خاصة',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
