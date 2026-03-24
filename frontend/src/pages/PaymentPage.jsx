import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { LangSwitcher } from '../components/LangSwitcher';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { 
  BookOpen,
  ShoppingCart,
  Tag,
  CheckCircle,
  CreditCard,
  ArrowLeft,
  LayoutDashboard,
  Loader2,
  PartyPopper
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, refreshUser } = useAuth();
  const { t } = useLang();
  
  const examId = location.state?.examId;
  const examName = location.state?.examName;
  const allAccessFromState = location.state?.allAccess;
  
  const [accessType, setAccessType] = useState(allAccessFromState ? 'all_access' : 'single');
  const [couponCode, setCouponCode] = useState('');
  const [couponValid, setCouponValid] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [exam, setExam] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [paypalConfig, setPaypalConfig] = useState({ client_id: '', mode: 'sandbox' });
  const [internalOrderId, setInternalOrderId] = useState(null);
  const internalOrderIdRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, [examId]);

  const fetchData = async () => {
    try {
      const [paypalRes, pricingRes] = await Promise.all([
        axios.get(`${API}/settings/paypal`),
        axios.get(`${API}/settings/pricing`).catch(() => ({ data: {} }))
      ]);
      
      setPaypalConfig({
        client_id: paypalRes.data.client_id || '',
        mode: paypalRes.data.mode || 'sandbox'
      });
      setPricing(pricingRes.data);
      
      if (examId) {
        const examRes = await axios.get(`${API}/exams/${examId}`);
        setExam(examRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    
    try {
      const response = await axios.post(`${API}/coupons/validate?code=${couponCode}&exam_id=${examId || ''}`);
      setCouponValid(true);
      setDiscount(response.data.discount_percent);
      toast.success(`${response.data.discount_percent}% ${t('payment.couponValid')}`);
    } catch (error) {
      setCouponValid(false);
      setDiscount(0);
      toast.error(error.response?.data?.detail || t('payment.couponInvalid'));
    }
  };

  const getPrice = () => {
    switch (accessType) {
      case 'single_lifetime':
        return exam?.price_lifetime ?? 49.99;
      case 'all_access':
        return pricing?.all_access_price ?? 29.99;
      case 'all_access_lifetime':
        return pricing?.all_access_lifetime_price ?? 99.99;
      default: // single
        return exam?.price_single ?? 9.99;
    }
  };

  const getFinalPrice = () => {
    const price = getPrice();
    return (price * (1 - discount / 100)).toFixed(2);
  };

  const createPayPalOrder = async () => {
    setIsProcessing(true);
    try {
      const response = await axios.post(`${API}/payments/create-order`, null, {
        params: {
          exam_id: accessType === 'single' ? examId : null,
          access_type: accessType,
          coupon_code: couponValid ? couponCode : null
        }
      });
      
      setInternalOrderId(response.data.order_id);
      internalOrderIdRef.current = response.data.order_id;
      
      // If free access (100% coupon), redirect immediately
      if (response.data.free_access) {
        await refreshUser();
        setPaymentSuccess(true);
        toast.success(t('payment.freeActivated'));
        return null;
      }
      
      return response.data.paypal_order_id;
    } catch (error) {
      toast.error(error.response?.data?.detail || t('payment.orderError'));
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const capturePayment = async (paypalOrderId) => {
    setIsProcessing(true);
    try {
      const orderId = internalOrderIdRef.current;
      if (!orderId) {
        toast.error('Erreur: commande introuvable');
        return;
      }
      await axios.post(`${API}/payments/capture/${orderId}`, null, {
        params: { paypal_order_id: paypalOrderId }
      });
      await refreshUser();
      setPaymentSuccess(true);
      toast.success(t('payment.paymentSuccess'));
    } catch (error) {
      toast.error(error.response?.data?.detail || t('payment.captureError'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="card-shadow max-w-md w-full text-center">
          <CardContent className="p-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <PartyPopper className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('payment.successTitle')}</h2>
            <p className="text-gray-600 mb-6">{t('payment.successDesc')}</p>
            <Button onClick={() => navigate('/exams')} className="w-full gradient-primary">{t('payment.seeExams')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="payment-page">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-600">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MockExamCenter</span>
            </Link>
            
            <nav className="flex items-center gap-4">
              {isAdmin && (
                <Link to="/admin" className="nav-link">
                  <LayoutDashboard className="w-4 h-4 inline mr-1" />
                  {t('nav.admin')}
                </Link>
              )}
              <Link to="/profile">
                <Button variant="outline" size="sm">{user?.name}</Button>
              </Link>
              <LangSwitcher />
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
          <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />{t('payment.back')}</Button>
        <h1 className="text-2xl font-bold mb-6">{t('payment.title')}</h1>

        {/* Access Type Selection */}
        <Card className="card-shadow mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              {t('payment.accessType')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={accessType} onValueChange={setAccessType} className="space-y-4">
              {exam && (
                <>
                  <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                    <RadioGroupItem value="single" id="single" className="mt-1" />
                    <Label htmlFor="single" className="flex-1 cursor-pointer">
                      <div className="font-medium">{exam.name}</div>
                      <div className="text-sm text-gray-500">
                        {t('payment.accessDuration')} {exam.access_duration_days} {t('payment.accessDays')}
                      </div>
                      <div className="text-lg font-bold text-blue-600 mt-1">{exam.price_single}€</div>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                    <RadioGroupItem value="single_lifetime" id="single_lifetime" className="mt-1" />
                    <Label htmlFor="single_lifetime" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{exam.name}</span>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{t('payment.lifetime')}</span>
                      </div>
                      <div className="text-sm text-gray-500">{t('payment.singleLifetimeDesc')}</div>
                      <div className="text-lg font-bold text-blue-600 mt-1">{exam.price_lifetime ?? 49.99}€</div>
                    </Label>
                  </div>
                </>
              )}
              
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                <RadioGroupItem value="all_access" id="all_access" className="mt-1" />
                <Label htmlFor="all_access" className="flex-1 cursor-pointer">
                  <div className="font-medium">{t('payment.allExamsAccess')}</div>
                  <div className="text-sm text-gray-500">
                    {t('payment.allExamsDesc')} {pricing?.all_access_duration_days ?? 30} {t('payment.accessDays')}
                  </div>
                  <div className="text-lg font-bold text-blue-600 mt-1">{pricing?.all_access_price ?? 29.99}€</div>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                <RadioGroupItem value="all_access_lifetime" id="all_access_lifetime" className="mt-1" />
                <Label htmlFor="all_access_lifetime" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t('payment.allExamsLifetime')}</span>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{t('payment.lifetime')}</span>
                  </div>
                  <div className="text-sm text-gray-500">{t('payment.allExamsLifetimeDesc')}</div>
                  <div className="text-lg font-bold text-blue-600 mt-1">{pricing?.all_access_lifetime_price ?? 99.99}€</div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Coupon */}
        <Card className="card-shadow mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-500" />
              {t('payment.couponTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder={t('payment.couponPlaceholder')}
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className={couponValid === true ? 'border-emerald-500' : couponValid === false ? 'border-red-500' : ''}
              />
              <Button variant="outline" onClick={validateCoupon}>{t('payment.couponApply')}</Button>
            </div>
            {couponValid && (
              <p className="text-emerald-600 text-sm mt-2 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Réduction de {discount}% appliquée
              </p>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="card-shadow mb-6">
          <CardHeader>
            <CardTitle>{t('payment.summary')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('payment.subtotal')}</span>
              <span>{getPrice()}€</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>{t('payment.discount')} ({discount}%)</span>
                <span>-{(getPrice() * discount / 100).toFixed(2)}€</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-3">
              <span>{t('payment.total')}</span>
              <span>{getFinalPrice()}€</span>
            </div>
          </CardContent>
        </Card>

        {/* PayPal Button */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              {t('payment.paymentTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {parseFloat(getFinalPrice()) === 0 ? (
              <Button 
                onClick={createPayPalOrder} 
                disabled={isProcessing}
                className="w-full gradient-primary h-12"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('payment.activating')}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />{t('payment.activateFree')}
                  </>
                )}
              </Button>
            ) : paypalConfig.client_id ? (
              <PayPalScriptProvider 
                options={{ 
                  clientId: paypalConfig.client_id, 
                  currency: 'EUR',
                  intent: 'capture'
                }}
              >
                <PayPalButtons
                  style={{ layout: 'vertical', shape: 'rect', label: 'pay' }}
                  disabled={isProcessing}
                  forceReRender={[accessType, discount, getFinalPrice()]}
                  createOrder={async () => {
                    const paypalOrderId = await createPayPalOrder();
                    if (!paypalOrderId) {
                      throw new Error('Free access activated');
                    }
                    return paypalOrderId;
                  }}
                  onApprove={async (data) => {
                    await capturePayment(data.orderID);
                  }}
                  onError={(err) => {
                    console.error('PayPal error:', err);
                    if (!err.message?.includes('Free access')) {
                      toast.error(t('payment.paypalError'));
                    }
                  }}
                  onCancel={() => {
                    toast.info(t('payment.cancelled'));
                  }}
                />
              </PayPalScriptProvider>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">{t('payment.paypalNotConfigured')}</p>
                <p className="text-sm text-gray-400">{t('payment.contactAdmin')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
