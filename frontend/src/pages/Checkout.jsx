import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiCreditCard, FiTruck, FiCheck, FiMapPin, FiTag, FiShield } from 'react-icons/fi';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  const [formData, setFormData] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    phone: user?.phone || '',
    paymentMethod: 'cash_on_delivery',
  });

  const shippingCost = getCartTotal() > 5000 ? 0 : 300;
  const total = getCartTotal() - discountAmount + shippingCost;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const applyDiscount = () => {
    if (discountCode === 'SAVE10') {
      setDiscountAmount(getCartTotal() * 0.1);
      toast.success('10% discount applied!');
    } else if (discountCode === 'SAVE20') {
      setDiscountAmount(getCartTotal() * 0.2);
      toast.success('20% discount applied!');
    } else {
      toast.error('Invalid discount code');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        items: cartItems.map(item => ({
          product: item._id,
          quantity: item.quantity
        })),
        shippingAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          phone: formData.phone
        },
        paymentMethod: formData.paymentMethod,
        discountCode: discountCode || undefined
      };

      const response = await api.post('/orders', orderData);
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/orders/${response.data._id}`);
    } catch (error) {
      const errorData = error.response?.data;
      
      // Check if order was created but auto-cancelled
      if (errorData?.orderId && errorData?.autoCancelled) {
        toast.error(
          `Order ${errorData.orderId} was created but cancelled due to: ${errorData.message}`,
          { duration: 6000 }
        );
        // Optionally navigate to the cancelled order details
        toast(
          (t) => (
            <div className="flex flex-col gap-2">
              <span className="text-sm">Your order <strong>{errorData.orderId}</strong> was automatically cancelled.</span>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  navigate('/orders');
                }}
                className="bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-500"
              >
                View Orders
              </button>
            </div>
          ),
          { duration: 8000 }
        );
      } else if (errorData?.orderId) {
        // Order created but with error status
        toast.error(`Order ${errorData.orderId}: ${errorData.message}`, { duration: 5000 });
      } else {
        // General error without order creation
        toast.error(errorData?.message || 'Failed to place order');
      }
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Shipping & Payment */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-6 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
                    <FiMapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Shipping Address</h2>
                    <p className="text-dark-400 text-sm">Where should we deliver your order?</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-dark-300 mb-2">Street Address</label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-dark-900/50 border border-dark-700 rounded-xl text-white placeholder-dark-500 
                               focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                      placeholder="123 Main Street"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-dark-900/50 border border-dark-700 rounded-xl text-white placeholder-dark-500 
                               focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                      placeholder="Colombo"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">State/Province</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-dark-900/50 border border-dark-700 rounded-xl text-white placeholder-dark-500 
                               focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                      placeholder="Western"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Zip Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-dark-900/50 border border-dark-700 rounded-xl text-white placeholder-dark-500 
                               focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                      placeholder="10000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-dark-900/50 border border-dark-700 rounded-xl text-white placeholder-dark-500 
                               focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                      placeholder="+94 77 123 4567"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-6 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-700 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/25">
                    <FiCreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Payment Method</h2>
                    <p className="text-dark-400 text-sm">Choose how you want to pay</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-300 ${
                    formData.paymentMethod === 'cash_on_delivery' 
                      ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/10' 
                      : 'border-dark-700 bg-dark-900/30 hover:border-dark-600'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash_on_delivery"
                      checked={formData.paymentMethod === 'cash_on_delivery'}
                      onChange={handleChange}
                      className="mr-4 w-5 h-5 accent-primary-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-white">Cash on Delivery</p>
                      <p className="text-sm text-dark-400">Pay when you receive your order</p>
                    </div>
                    <FiTruck className="w-5 h-5 text-dark-400" />
                  </label>
                  
                  <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-300 ${
                    formData.paymentMethod === 'card' 
                      ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/10' 
                      : 'border-dark-700 bg-dark-900/30 hover:border-dark-600'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={handleChange}
                      className="mr-4 w-5 h-5 accent-primary-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-white">Credit/Debit Card</p>
                      <p className="text-sm text-dark-400">Secure online payment</p>
                    </div>
                    <FiCreditCard className="w-5 h-5 text-dark-400" />
                  </label>
                  
                  <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-300 ${
                    formData.paymentMethod === 'bank_transfer' 
                      ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/10' 
                      : 'border-dark-700 bg-dark-900/30 hover:border-dark-600'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={formData.paymentMethod === 'bank_transfer'}
                      onChange={handleChange}
                      className="mr-4 w-5 h-5 accent-primary-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-white">Bank Transfer</p>
                      <p className="text-sm text-dark-400">Direct bank transfer</p>
                    </div>
                    <FiShield className="w-5 h-5 text-dark-400" />
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-6 shadow-xl sticky top-24">
                <h2 className="text-lg font-semibold text-white mb-6">Order Summary</h2>
                
                {/* Items */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
                  {cartItems.map((item) => (
                    <div key={item._id} className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-dark-700/50 rounded-xl overflow-hidden flex-shrink-0">
                        <img 
                          src={item.images?.[0] || 'https://via.placeholder.com/60'} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.name}</p>
                        <p className="text-sm text-dark-400">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-white">
                        Rs. {((item.discountPrice || item.price) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dark-700/50 my-4"></div>

                {/* Discount */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    <FiTag className="inline mr-2" />
                    Discount Code
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter code" 
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      className="flex-1 px-4 py-2.5 bg-dark-900/50 border border-dark-700 rounded-xl text-white text-sm placeholder-dark-500 
                               focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all" 
                    />
                    <button 
                      type="button" 
                      onClick={applyDiscount} 
                      className="px-4 py-2.5 border border-dark-600 text-dark-200 rounded-xl text-sm hover:bg-dark-700 transition-all"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-dark-300">
                    <span>Subtotal</span>
                    <span className="text-white">Rs. {getCartTotal().toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-accent-400">
                      <span>Discount</span>
                      <span>-Rs. {discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-dark-300">
                    <span>Shipping</span>
                    <span className={shippingCost === 0 ? 'text-accent-400' : 'text-white'}>
                      {shippingCost === 0 ? 'Free' : `Rs. ${shippingCost}`}
                    </span>
                  </div>
                  <div className="border-t border-dark-700/50 pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-white">Total</span>
                      <span className="bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text text-transparent">
                        Rs. {total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3.5 rounded-xl font-semibold 
                           hover:from-primary-500 hover:to-primary-400 transition-all duration-300 shadow-lg shadow-primary-500/25
                           disabled:from-dark-600 disabled:to-dark-600 disabled:shadow-none disabled:cursor-not-allowed
                           inline-flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <FiCheck className="mr-2" /> Place Order
                    </>
                  )}
                </button>

                <p className="text-center text-dark-500 text-xs mt-4">
                  By placing this order, you agree to our Terms & Conditions
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
