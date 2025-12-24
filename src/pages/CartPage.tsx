import { useLanguage, LanguageProvider } from '@/contexts/LanguageContext';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Minus, Plus, Trash2, CreditCard, Ticket } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';

const DEPOSIT_CREDIT = 100; // Example deposit credit

function CartContent() {
  const { t } = useLanguage();
  const { items, updateQuantity, removeItem, subtotal, tableNumber, clearCart } = useCart();
  const navigate = useNavigate();
  const [orderStatus, setOrderStatus] = useState<'cart' | 'placed' | 'preparing' | 'ready'>('cart');
  const [useDeposit, setUseDeposit] = useState(true);

  const depositCredit = DEPOSIT_CREDIT;
  const total = useDeposit ? Math.max(0, subtotal - depositCredit) : subtotal;
  const depositUsed = useDeposit ? Math.min(depositCredit, subtotal) : 0;

  const handlePlaceOrder = () => {
    toast.loading('Placing your order...');
    setTimeout(() => {
      toast.dismiss();
      toast.success('Order placed successfully!');
      setOrderStatus('placed');
      
      // Simulate order progress
      setTimeout(() => setOrderStatus('preparing'), 3000);
      setTimeout(() => setOrderStatus('ready'), 8000);
    }, 1500);
  };

  const handlePayment = () => {
    toast.loading('Processing payment...');
    setTimeout(() => {
      toast.dismiss();
      toast.success('Payment successful! Thank you for dining with us.');
      clearCart();
      navigate('/');
    }, 2000);
  };

  if (items.length === 0 && orderStatus === 'cart') {
    return (
      <div className="min-h-screen bg-background pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-md text-center">
          <div className="py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
              <Ticket className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              {t('order.empty')}
            </h2>
            <p className="text-muted-foreground mb-6">
              Browse our menu and add items to your order
            </p>
            <Link to="/order">
              <Button variant="gold">Browse Menu</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (orderStatus !== 'cart') {
    return (
      <div className="min-h-screen bg-background pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              {t('order.title')}
            </h1>
            <p className="text-muted-foreground">Table {tableNumber}</p>
          </div>

          {/* Order Status */}
          <div className="glass-card rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              {['placed', 'preparing', 'ready'].map((status, index) => (
                <div key={status} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                      ['placed', 'preparing', 'ready'].indexOf(orderStatus) >= index
                        ? 'gold-gradient'
                        : 'bg-secondary'
                    }`}
                  >
                    <span className={`text-sm font-bold ${
                      ['placed', 'preparing', 'ready'].indexOf(orderStatus) >= index
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">
                    {t(`order.status.${status}`)}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-center p-4 bg-secondary/50 rounded-lg">
              <p className="text-lg font-semibold text-foreground">
                {orderStatus === 'placed' && 'Your order has been received!'}
                {orderStatus === 'preparing' && 'Your order is being prepared...'}
                {orderStatus === 'ready' && 'Your order is ready!'}
              </p>
              {orderStatus === 'ready' && (
                <p className="text-sm text-muted-foreground mt-1">
                  A server will bring it to your table shortly
                </p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="glass-card rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-foreground mb-4">Order Summary</h3>
            {items.map((item) => (
              <div key={item.id} className="flex justify-between py-2 border-b border-border/30 last:border-0">
                <span className="text-muted-foreground">
                  {item.quantity}x {item.name}
                </span>
                <span className="text-foreground">{item.price * item.quantity} AED</span>
              </div>
            ))}
          </div>

          {/* Payment Section */}
          {orderStatus === 'ready' && (
            <div className="glass-card rounded-xl p-6">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('order.subtotal')}</span>
                  <span>{subtotal} {t('currency')}</span>
                </div>
                {depositUsed > 0 && (
                  <div className="flex justify-between text-success">
                    <span>{t('order.deposit')}</span>
                    <span>-{depositUsed} {t('currency')}</span>
                  </div>
                )}
                <div className="flex justify-between text-foreground font-bold text-lg pt-2 border-t border-border">
                  <span>{t('order.total')}</span>
                  <span className="gold-text">{total} {t('currency')}</span>
                </div>
              </div>

              <Button variant="gold" size="xl" className="w-full" onClick={handlePayment}>
                <CreditCard className="w-5 h-5 mr-2" />
                {t('order.pay')} {total} {t('currency')}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-md">
        <Link to="/order" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </Link>

        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            {t('order.title')}
          </h1>
          <p className="text-muted-foreground">Table {tableNumber}</p>
        </div>

        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          {items.map((item) => (
            <div key={item.id} className="glass-card rounded-xl p-4 flex gap-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{item.name}</h3>
                <p className="text-primary font-medium">{item.price} {t('currency')}</p>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Deposit Credit Toggle */}
        {depositCredit > 0 && (
          <div className="glass-card rounded-xl p-4 mb-6">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-foreground">Use Deposit Credit</p>
                <p className="text-sm text-muted-foreground">
                  {depositCredit} {t('currency')} available
                </p>
              </div>
              <input
                type="checkbox"
                checked={useDeposit}
                onChange={(e) => setUseDeposit(e.target.checked)}
                className="w-5 h-5 accent-primary"
              />
            </label>
          </div>
        )}

        {/* Order Summary */}
        <div className="glass-card rounded-xl p-6">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-muted-foreground">
              <span>{t('order.subtotal')}</span>
              <span>{subtotal} {t('currency')}</span>
            </div>
            {depositUsed > 0 && (
              <div className="flex justify-between text-success">
                <span>{t('order.deposit')}</span>
                <span>-{depositUsed} {t('currency')}</span>
              </div>
            )}
            <div className="flex justify-between text-foreground font-bold text-lg pt-2 border-t border-border">
              <span>{t('order.total')}</span>
              <span className="gold-text">{total} {t('currency')}</span>
            </div>
          </div>

          <Button variant="gold" size="xl" className="w-full" onClick={handlePlaceOrder}>
            {t('order.placeOrder')}
          </Button>
        </div>
      </div>
    </div>
  );
}

const CartPage = () => {
  return (
    <>
      <Header />
      <CartContent />
    </>
  );
};

export default CartPage;
