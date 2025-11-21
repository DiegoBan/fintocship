const express = require('express');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');
const path = require('path');
const axios = require('axios');

const app = express();
const port = 3000;

// 1. Middlewares
app.use(express.json());
app.use(cookieParser());

// 2. Base de Datos
const pool = new Pool({
  user: 'fintoc',
  host: 'postgres', 
  database: 'fintoc',
  password: 'fintoc',
  port: 5432,
});

// 3. Lógica de Cookie de Usuario
app.use((req, res, next) => {
  let userCookie = req.cookies.user_cookie;
  
  if (!userCookie) {
    userCookie = 'user_' + Math.random().toString(36).substring(2);
    res.cookie('user_cookie', userCookie, { maxAge: 86400000, httpOnly: true });
    console.log('Nueva cookie asignada:', userCookie);
  }
  
  req.userCookie = userCookie;
  next();
});

// 4. Servir Frontend
app.use(express.static(path.join(__dirname, '../public')));

// 5. Rutas API

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ estado: 'ok', hora_db: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error DB');
  }
});

// Productos
app.get('/api/productos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error productos');
  }
});

// Carrito (GET)
app.get('/api/carrito', async (req, res) => {
  const userCookie = req.userCookie;
  try {
    const query = `
      SELECT c.id_prod, c.cantidad, p.nombre, p.precio 
      FROM carrito c
      JOIN productos p ON c.id_prod = p.id
      WHERE c.user_cookie = $1
    `;
    const result = await pool.query(query, [userCookie]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error carrito');
  }
});

// Carrito (POST - Agregar/Update)
app.post('/api/carrito', async (req, res) => {
  const { id_prod, cantidad } = req.body;
  const userCookie = req.userCookie;
  
  try {
    const query = `
      INSERT INTO carrito (user_cookie, id_prod, cantidad)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_cookie, id_prod) 
      DO UPDATE SET cantidad = carrito.cantidad + EXCLUDED.cantidad
      RETURNING *;
    `;
    const values = [userCookie, id_prod, cantidad];
    const result = await pool.query(query, values);
    res.json({ mensaje: 'Carrito actualizado', item: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error update carrito');
  }
});

// PAGO FINTOC (Solo Backend)
app.post('/api/crear-pago', async (req, res) => {
  const userCookie = req.userCookie;
  
  try {
    // A. Calcular total real desde la DB
    const query = `
      SELECT c.cantidad, p.precio 
      FROM carrito c
      JOIN productos p ON c.id_prod = p.id
      WHERE c.user_cookie = $1
    `;
    const result = await pool.query(query, [userCookie]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    const totalAmount = result.rows.reduce((sum, item) => {
      return sum + (item.precio * item.cantidad);
    }, 0);

    // B. Llamar a Fintoc para crear intención
    // IMPORTANTE: En producción, usa process.env.FINTOC_KEY
    const FINTOC_SECRET_KEY = 'sk_test_z_3E6a26s6sAEERyeepmG37z3gENm6cUEqPfWCpHcDk'; 
    
    const response = await axios.post('https://api.fintoc.com/v1/payment_intents', {
      amount: totalAmount,
      currency: 'CLP'
      // ¡Aquí borramos todo el bloque recipient_account!
    }, {
      headers: {
        'Authorization': FINTOC_SECRET_KEY,
        'Content-Type': 'application/json'
      }
    });

    // C. Enviar widget_token al frontend
    res.json({ widget_token: response.data.widget_token });

  } catch (err) {
    // Mejor manejo de error para ver qué dice Fintoc
    console.error("Error Fintoc Details:", err.response ? err.response.data : err.message);
    res.status(500).json({ error: 'Error al iniciar pago' });
  }
});

app.listen(port, () => {
  console.log(`Servidor listo en http://localhost:${port}`);
});