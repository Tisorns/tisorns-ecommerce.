// server.js - E-commerce Backend
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Data files
const productsFile = 'products.json';
const usersFile = 'users.json';
const ordersFile = 'orders.json';

// Initialize files if they don't exist
const initializeData = () => {
  if (!fs.existsSync(productsFile)) {
    const defaultProducts = [
      { id: 1, name: 'Laptop', price: 50000, description: 'High-performance laptop', category: 'Electronics' },
      { id: 2, name: 'Mobile Phone', price: 20000, description: 'Latest smartphone', category: 'Electronics' },
      { id: 3, name: 'Headphones', price: 5000, description: 'Wireless headphones', category: 'Audio' },
    ];
    fs.writeFileSync(productsFile, JSON.stringify(defaultProducts, null, 2));
  }

  if (!fs.existsSync(usersFile)) {
    const defaultUsers = [
      { id: 1, username: 'admin', password: 'admin123', email: 'admin@shophub.com', isAdmin: true },
      { id: 2, username: 'user1', password: 'pass123', email: 'user1@shophub.com', isAdmin: false },
    ];
    fs.writeFileSync(usersFile, JSON.stringify(defaultUsers, null, 2));
  }

  if (!fs.existsSync(ordersFile)) {
    fs.writeFileSync(ordersFile, JSON.stringify([], null, 2));
  }
};

// Helper functions
const readData = (file) => {
  const data = fs.readFileSync(file, 'utf8');
  return JSON.parse(data);
};

const writeData = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// ============ AUTHENTICATION ENDPOINTS ============

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const users = readData(usersFile);
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      },
      token: `token_${user.id}_${Date.now()}`
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Register
app.post('/api/auth/register', (req, res) => {
  const { username, password, email } = req.body;
  const users = readData(usersFile);

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ success: false, message: 'Username already exists' });
  }

  const newUser = {
    id: Math.max(...users.map(u => u.id), 0) + 1,
    username,
    password,
    email,
    isAdmin: false
  };

  users.push(newUser);
  writeData(usersFile, users);

  res.json({
    success: true,
    message: 'Registration successful',
    user: newUser
  });
});

// ============ PRODUCT ENDPOINTS ============

// Get all products
app.get('/api/products', (req, res) => {
  const products = readData(productsFile);
  res.json(products);
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const products = readData(productsFile);
  const product = products.find(p => p.id == req.params.id);

  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

// Add product (Admin only)
app.post('/api/products', (req, res) => {
  const { name, price, description, category } = req.body;
  const products = readData(productsFile);

  const newProduct = {
    id: Math.max(...products.map(p => p.id), 0) + 1,
    name,
    price: parseInt(price),
    description,
    category
  };

  products.push(newProduct);
  writeData(productsFile, products);

  res.status(201).json({
    success: true,
    message: 'Product added successfully',
    product: newProduct
  });
});

// Update product (Admin only)
app.put('/api/products/:id', (req, res) => {
  const { name, price, description, category } = req.body;
  const products = readData(productsFile);
  const index = products.findIndex(p => p.id == req.params.id);

  if (index !== -1) {
    products[index] = { ...products[index], name, price: parseInt(price), description, category };
    writeData(productsFile, products);
    res.json({ success: true, product: products[index] });
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

// Delete product (Admin only)
app.delete('/api/products/:id', (req, res) => {
  const products = readData(productsFile);
  const newProducts = products.filter(p => p.id != req.params.id);

  if (newProducts.length !== products.length) {
    writeData(productsFile, newProducts);
    res.json({ success: true, message: 'Product deleted' });
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

// ============ CART ENDPOINTS ============

// Calculate cart total (can be extended with discounts)
app.post('/api/cart/calculate', (req, res) => {
  const { items } = req.body;
  const products = readData(productsFile);

  let total = 0;
  items.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (product) {
      total += product.price * item.quantity;
    }
  });

  res.json({
    subtotal: total,
    tax: Math.round(total * 0.18),
    total: total + Math.round(total * 0.18)
  });
});

// ============ ORDER ENDPOINTS ============

// Create order
app.post('/api/orders', (req, res) => {
  const { userId, items, total } = req.body;
  const orders = readData(ordersFile);

  const newOrder = {
    id: Math.max(...orders.map(o => o.id), 0) + 1,
    userId,
    items,
    total,
    date: new Date().toISOString(),
    status: 'Processing'
  };

  orders.push(newOrder);
  writeData(ordersFile, orders);

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    order: newOrder
  });
});

// Get user orders
app.get('/api/orders/user/:userId', (req, res) => {
  const orders = readData(ordersFile);
  const userOrders = orders.filter(o => o.userId == req.params.userId);
  res.json(userOrders);
});

// Get all orders (Admin)
app.get('/api/orders', (req, res) => {
  const orders = readData(ordersFile);
  res.json(orders);
});

// Update order status (Admin)
app.put('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const orders = readData(ordersFile);
  const index = orders.findIndex(o => o.id == req.params.id);

  if (index !== -1) {
    orders[index].status = status;
    writeData(ordersFile, orders);
    res.json({ success: true, order: orders[index] });
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

// ============ PAYMENT ENDPOINTS ============

// Process payment (Mock)
app.post('/api/payment/process', (req, res) => {
  const { amount, cardNumber } = req.body;

  // Mock payment processing
  if (cardNumber && cardNumber.length === 16) {
    res.json({
      success: true,
      transactionId: `TXN_${Date.now()}`,
      message: 'Payment processed successfully',
      amount: amount
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Invalid payment details'
    });
  }
});

// ============ ADMIN ENDPOINTS ============

// Get dashboard stats
app.get('/api/admin/stats', (req, res) => {
  const products = readData(productsFile);
  const orders = readData(ordersFile);
  const users = readData(usersFile);

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const totalCustomers = users.filter(u => !u.isAdmin).length;

  res.json({
    totalRevenue,
    totalOrders,
    totalProducts,
    totalCustomers,
    recentOrders: orders.slice(-5)
  });
});

// ============ SEARCH ENDPOINTS ============

// Search products
app.get('/api/search', (req, res) => {
  const { query } = req.query;
  const products = readData(productsFile);

  const results = products.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.description.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase())
  );

  res.json(results);
});

// ============ ERROR HANDLING ============

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running ✅' });
});

// Initialize and start
initializeData();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API docs available at /api/health`);
});