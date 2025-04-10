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
  const users = readData('user');
  const { name, email, password, role } = req.body;
  const id = users.length + 1;
  users.push({ id, name, email, password, role });
  writeData('user', users);
  res.status(201).json({ id, name, email, role });
});

// Completar datos personales (cliente)
app.post('/customers', (req, res) => {
  const customers = readData('customer');
  const { userId, address, phone } = req.body;
  const id = customers.length + 1;
  customers.push({ id, userId, address, phone });
  writeData('customer', customers);
  res.status(201).json({ id, userId, address, phone });
});

// Login de usuario
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const users = readData('user');

  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  res.json({ message: 'Login exitoso', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});


// Obtener lista de clientes
app.get('/customers', (req, res) => {
  const customers = readData('customer');
  const users = readData('user');
  const customerList = customers.map(c => {
    const user = users.find(u => u.id === c.userId);
    return {
      id: c.id,
      userId: c.userId,
      name: user ? user.name : null,
      email: user ? user.email : null,
      address: c.address,
      phone: c.phone

    };
  });
  res.json(customerList);
});

// Endpoint para obtener los admins desde la lista de usuarios
app.get('/admins', (req, res) => {
  const users = readData('user'); // Leer los usuarios desde el archivo
  const admins = users.filter(user => user.role === 'admin'); // Filtrar por el rol 'admin'
  
  if (admins.length === 0) {
    return res.status(404).json({ message: 'No se encontraron admins' });
  }

  res.json(admins); // Devuelve la lista de admins
});

// Obtener servicios disponibles
app.get('/services', (req, res) => {
  res.json(readData('services'));
});

// Solicitar un servicio (crear evento)
app.post('/events', (req, res) => {
  const events = readData('events');
  const { customerId, adminId, serviceId, vehicle, date_time, status, comments } = req.body;
    const id = events.length + 1;
    events.push({ id, customerId, adminId, serviceId, vehicle, date_time, status, comments });
    writeData('events', events);
  res.status(201).json({ id });
});

// Actualizar el estado de un evento
app.put('/events/:id/status', (req, res) => {
  const events = readData('events');
  const event = events.find(e => e.id == req.params.id);
  
  if (!event) {
    return res.status(404).json({ error: 'Evento no encontrado' });
  }

  const { status } = req.body;
  event.status = status;

  writeData('events', events);
  res.json({ message: 'Estado actualizado', event });
});


app.get('/customers/:customerId/events', (req, res) => {
  const events = readData('events');
  const services = readData('services');
  const users = readData('user');
  const customers = readData('customer');

  const customer = customers.find(c => c.id == req.params.customerId);
  const customerUser = customer ? users.find(u => u.id === customer.userId) : null;

  const customerEvents = events
    .filter(e => e.customerId == req.params.customerId)
    .map(e => {
      const service = services.find(s => s.id === e.serviceId);
      const admin = users.find(u => u.id === e.adminId);

      return {
        id: e.id,
        customer: customerUser ? customerUser.name : 'Cliente no encontrado',
        admin: admin ? admin.name : 'Admin no encontrado',
        service: service ? service.name : 'Servicio no disponible',
        date_time: e.date_time,
        status: e.status,
        comments: e.comments
      };
    });

  res.json(customerEvents);
});



// Admin: ver todos los eventos
app.get('/admin/events', (req, res) => {
  const events = readData('events');
  const users = readData('user');
  const services = readData('services');
  const customers = readData('customer');

  const result = events.map(event => {
    const admin = users.find(u => u.id === event.adminId);
    const customer = customers.find(c => c.id === event.customerId);
    const user = customer ? users.find(u => u.id === customer.userId) : null;
    const service = services.find(s => s.id === event.serviceId);

    return {
      id: event.id,
      customer: user ? user.name : 'Cliente no encontrado',
      phone: customer ? customer.phone : 'No disponible',
      service: service ? service.name : 'No disponible',
      admin: admin ? admin.name : 'Admin no encontrado',
      date_time: event.date_time,
      status: event.status,
      comments: event.comments
    };
  });

  res.json(result);
});



// Admin: ver detalles de un evento
app.get('/admin/events/:id', (req, res) => {
  const events = readData('events');
  const users = readData('user');
  const customers = readData('customer');
  const services = readData('services');

  const event = events.find(e => e.id == req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Evento no encontrado' });
  }

  const admin = users.find(u => u.id === event.adminId);
  const customer = customers.find(c => c.id === event.customerId);
  const customerUser = customer ? users.find(u => u.id === customer.userId) : null;
  const service = services.find(s => s.id === event.serviceId);

  res.json({
    id: event.id,
    customer: customerUser ? customerUser.name : 'Cliente no encontrado',
    phone: customer ? customer.phone : 'No disponible',
    service: service ? service.name : 'Servicio no disponible',
    admin: admin ? admin.name : 'Admin no encontrado',
    date_time: event.date_time,
    status: event.status,
    comments: event.comments,
    vehicle: event.vehicle
  });
});


// Total de clientes
app.get('/total/customers', (req, res) => {
  const customers = readData('customer');
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
