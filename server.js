const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.json());

// Endpoint para validar que la API está corriendo
app.get('/', (req, res) => {
  res.send('API del Carwash funcionando correctamente 🚗💦');
});

// Función para leer y escribir JSON fácilmente
const readData = (file) => JSON.parse(fs.readFileSync(`./data/${file}.json`));
const writeData = (file, data) => fs.writeFileSync(`./data/${file}.json`, JSON.stringify(data, null, 2));

// Registro de usuario con rol
app.post('/register', (req, res) => {
  const users = readData('users');
  const { name, email, password, role } = req.body;
  const id = users.length + 1;
  users.push({ id, name, email, password, role });
  writeData('users', users);
  res.status(201).json({ id, name, email, role });
});

// Completar datos personales (cliente)
app.post('/customers', (req, res) => {
  const customers = readData('customers');
  const { userId, address, phone } = req.body;
  const id = customers.length + 1;
  customers.push({ id, userId, address, phone });
  writeData('customers', customers);
  res.status(201).json({ id, userId, address, phone });
});

// Obtener lista de clientes
app.get('/customers', (req, res) => {
  const customers = readData('customers');
  const users = readData('users');
  const customerList = customers.map(c => {
    const user = users.find(u => u.id === c.userId);
    return {
      id: c.id,
      name: user ? user.name : null,
      email: user ? user.email : null,
      address: c.address,
      phone: c.phone
    };
  });
  res.json(customerList);
});

// Obtener admins disponibles
app.get('/admins', (req, res) => {
  const admins = readData('admins');
  const users = readData('users');
  const availableAdmins = admins
    .filter(a => a.status)
    .map(a => {
      const user = users.find(u => u.id === a.userId);
      return { id: a.id, name: user.name, email: user.email };
    });
  res.json(availableAdmins);
});

// Obtener servicios disponibles
app.get('/services', (req, res) => {
  res.json(readData('services'));
});

// Solicitar un servicio (crear evento)
app.post('/events', (req, res) => {
  const events = readData('events');
  const { customerId, vehicleId, serviceId, adminId, date_time, status, comments } = req.body;
  const id = events.length + 1;
  events.push({ id, customerId, vehicleId, serviceId, adminId, date_time, status, comments });
  writeData('events', events);
  res.status(201).json({ id });
});

// Listar eventos de un cliente
app.get('/customers/:customerId/events', (req, res) => {
  const events = readData('events');
  const services = readData('services');
  const customerEvents = events
    .filter(e => e.customerId == req.params.customerId)
    .map(e => ({
      ...e,
      service: services.find(s => s.id === e.serviceId)
    }));
  res.json(customerEvents);
});

// Admin: ver todos los eventos
app.get('/admin/events', (req, res) => {
  const events = readData('events');
  const customers = readData('customers');
  const users = readData('users');
  const services = readData('services');
  const result = events.map(e => {
    const customer = customers.find(c => c.id === e.customerId);
    const user = users.find(u => u.id === customer.userId);
    const service = services.find(s => s.id === e.serviceId);
    return {
      id: e.id,
      customer: user.name,
      phone: customer.phone,
      service: service.name,
      status: e.status,
      adminId: e.adminId,
      date_time: e.date_time
    };
  });
  res.json(result);
});

// Admin: ver detalles de un evento
app.get('/admin/events/:id', (req, res) => {
  const events = readData('events');
  const event = events.find(e => e.id == req.params.id);
  res.json(event);
});

// Total de clientes
app.get('/total/customers', (req, res) => {
  const customers = readData('customers');
  res.json({ total_customers: customers.length });
});

// Total de servicios
app.get('/total/services', (req, res) => {
  const services = readData('services');
  res.json({ total_services: services.length });
});

// Listar productos
app.get('/products', (req, res) => {
  res.json(readData('products'));
});

// Obtener un producto
app.get('/products/:id', (req, res) => {
  const products = readData('products');
  const product = products.find(p => p.id == req.params.id);
  res.json(product);
});

// Crear producto
app.post('/products', (req, res) => {
  const products = readData('products');
  const { name, price, description, stock } = req.body;
  const id = products.length > 0 ? products[products.length - 1].id + 1 : 1;
  products.push({ id, name, price, description, stock });
  writeData('products', products);
  res.status(201).json({ id, name, price, description, stock });
});

// Actualizar producto
app.put('/products/:id', (req, res) => {
  const products = readData('products');
  const index = products.findIndex(p => p.id == req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Producto no encontrado' });

  const { name, price, description, stock } = req.body;
  products[index] = { ...products[index], name, price, description, stock };
  writeData('products', products);
  res.json(products[index]);
});

// Eliminar producto
app.delete('/products/:id', (req, res) => {
  let products = readData('products');
  const index = products.findIndex(p => p.id == req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Producto no encontrado' });

  const deleted = products.splice(index, 1)[0];
  writeData('products', products);
  res.json({ message: 'Producto eliminado', product: deleted });
});

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
