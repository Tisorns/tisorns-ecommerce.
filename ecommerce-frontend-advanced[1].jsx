import React, { useState, useEffect } from 'react';
import { ShoppingCart, LogOut, Menu, X, Home, Package, User, Settings } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function EcommerceAppAdvanced() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cart, setCart] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch products from backend
  useEffect(() => {
    if (isLoggedIn) {
      fetchProducts();
    }
  }, [isLoggedIn]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Login Handler
  const handleLogin = async (username, password) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (data.success) {
        setIsLoggedIn(true);
        setCurrentUser(data.user);
        setIsAdmin(data.user.isAdmin);
        setCurrentPage(data.user.isAdmin ? 'admin' : 'home');
        localStorage.setItem('token', data.token);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed!');
    } finally {
      setLoading(false);
    }
  };

  // Add to cart
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    alert(`${product.name} cart mein add ho gaya!`);
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  // Update quantity
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      ));
    }
  };

  // Calculate total
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart empty hai!');
      return;
    }

    try {
      setLoading(true);
      // Calculate totals
      const subtotal = cartTotal;
      const tax = Math.round(subtotal * 0.18);
      const total = subtotal + tax;

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          items: cart,
          total: total
        })
      });

      const data = await response.json();
      if (data.success) {
        setCart([]);
        alert(`✅ Order placed! Order ID: ${data.order.id}`);
        setCurrentPage('orders');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed!');
    } finally {
      setLoading(false);
    }
  };

  // Add product (Admin)
  const handleAddProduct = async (name, price, description, category) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, description, category })
      });

      const data = await response.json();
      if (data.success) {
        fetchProducts();
        alert('Product add ho gaya!');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Product add nahi ho saka!');
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        fetchProducts();
        alert('Product delete ho gaya!');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Product delete nahi ho saka!');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user orders
  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/orders/user/${currentUser.id}`);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrdersPage = () => {
    fetchUserOrders();
    setCurrentPage('orders');
  };

  // Page Components
  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">🛍️ ShopHub</h1>
          <p className="text-xl text-gray-600">Best products at best prices!</p>
        </div>

        {loading && <div className="text-center text-xl">Loading...</div>}

        {products.length === 0 && !loading && (
          <div className="text-center text-gray-600">Koi product nahi hai 😢</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h3>
              <p className="text-gray-600 mb-2">{product.description}</p>
              <p className="text-sm text-gray-500 mb-4">Category: {product.category}</p>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-green-600">₹{product.price}</span>
                <button
                  onClick={() => addToCart(product)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  disabled={loading}
                >
                  🛒 Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const CartPage = () => (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🛒 Shopping Cart</h1>

        {cart.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-xl text-gray-600 mb-4">Cart empty hai!</p>
            <button
              onClick={() => setCurrentPage('home')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Shopping continue karein
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {cart.map(item => (
                <div key={item.id} className="bg-white rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">📦</span>
                      <div>
                        <h3 className="font-bold">{item.name}</h3>
                        <p className="text-green-600">₹{item.price}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                      className="w-16 p-2 border rounded text-center"
                    />
                    <span className="font-bold w-24 text-right">₹{item.price * item.quantity}</span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
                    >
                      ❌
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center text-2xl font-bold mb-6">
                <span>Total:</span>
                <span className="text-green-600">₹{cartTotal}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 text-xl"
                disabled={loading}
              >
                💳 {loading ? 'Processing...' : 'Checkout karo'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const OrdersPage = () => (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">📦 Meri Orders</h1>

        {loading && <div className="text-center text-xl">Loading orders...</div>}

        {orders.length === 0 && !loading && (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">Abhi koi order nahi hai</p>
            <button
              onClick={() => setCurrentPage('home')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Shopping karo
            </button>
          </div>
        )}

        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-lg p-4 border">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold">Order ID: {order.id}</p>
                  <p className="text-sm text-gray-600">Date: {new Date(order.date).toLocaleDateString('hi-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">₹{order.total}</p>
                  <p className="text-sm bg-yellow-100 px-2 py-1 rounded">{order.status}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Items: {order.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const AdminPage = () => {
    const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', category: '' });

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">⚙️ Admin Panel</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add Product Form */}
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-6">Naya Product Add Karo</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleAddProduct(newProduct.name, newProduct.price, newProduct.description, newProduct.category);
                setNewProduct({ name: '', price: '', description: '', category: '' });
              }} className="space-y-4">
                <input
                  type="text"
                  placeholder="Product name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold" disabled={loading}>
                  {loading ? '⏳ Loading...' : '➕ Add Product'}
                </button>
              </form>
            </div>

            {/* Products List */}
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-6">Products ({products.length})</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {products.map(product => (
                  <div key={product.id} className="p-2 bg-gray-100 rounded flex justify-between items-center">
                    <div>
                      <p className="font-bold">{product.name}</p>
                      <p className="text-sm text-gray-600">₹{product.price}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 font-bold"
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const LoginPage = () => {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('admin123');

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-8">🛍️ ShopHub</h1>

          <form onSubmit={(e) => {
            e.preventDefault();
            handleLogin(username, password);
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? '⏳ Logging in...' : 'Login Karo'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
            <p className="font-bold mb-2">👨‍💼 Admin (pre-filled):</p>
            <p>Username: <span className="font-mono">admin</span></p>
            <p>Password: <span className="font-mono">admin123</span></p>
          </div>
        </div>
      </div>
    );
  };

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🛍️ ShopHub</h1>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6 items-center">
            <button onClick={() => setCurrentPage('home')} className="hover:text-blue-100 flex items-center gap-2">
              <Home size={20} /> Home
            </button>
            {!isAdmin && (
              <>
                <button onClick={() => setCurrentPage('cart')} className="hover:text-blue-100 flex items-center gap-2">
                  <ShoppingCart size={20} /> Cart ({cart.length})
                </button>
                <button onClick={handleOrdersPage} className="hover:text-blue-100 flex items-center gap-2">
                  <Package size={20} /> Orders
                </button>
              </>
            )}
            {isAdmin && (
              <button onClick={() => setCurrentPage('admin')} className="hover:text-blue-100 flex items-center gap-2">
                <Settings size={20} /> Admin
              </button>
            )}
            <button
              onClick={() => {
                setIsLoggedIn(false);
                setCurrentUser(null);
                setIsAdmin(false);
              }}
              className="hover:text-blue-100 flex items-center gap-2"
            >
              <LogOut size={20} /> Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-blue-700 py-4 space-y-2 px-4">
            <button onClick={() => { setCurrentPage('home'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 hover:text-blue-100">
              Home
            </button>
            {!isAdmin && (
              <>
                <button onClick={() => { setCurrentPage('cart'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 hover:text-blue-100">
                  Cart ({cart.length})
                </button>
                <button onClick={() => { handleOrdersPage(); setMobileMenuOpen(false); }} className="block w-full text-left py-2 hover:text-blue-100">
                  Orders
                </button>
              </>
            )}
            {isAdmin && (
              <button onClick={() => { setCurrentPage('admin'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 hover:text-blue-100">
                Admin Panel
              </button>
            )}
            <button
              onClick={() => {
                setIsLoggedIn(false);
                setCurrentUser(null);
                setIsAdmin(false);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 hover:text-blue-100"
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      {currentPage === 'home' && <HomePage />}
      {currentPage === 'cart' && <CartPage />}
      {currentPage === 'orders' && <OrdersPage />}
      {currentPage === 'admin' && <AdminPage />}
    </div>
  );
}