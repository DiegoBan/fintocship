const express = require('express');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// Middleware para interpretar JSON y Cookies
app.use(express.json());
app.use(cookieParser());

const pool = new Pool({
  user: 'fintoc',
  host: 'postgres', // Nombre del servicio en docker-compose
  database: 'fintoc',
  password: 'fintoc',
  port: 5432,
});

app.use((req, res, next) => {
  let userCookie = req.cookies.user_cookie;
  
  if (!userCookie) {
    // Si no tiene cookie, generamos un ID simple (puedes usar 'uuid' más adelante)
    userCookie = 'user_' + Math.random().toString(36).substring(2);
    // Guardamos la cookie por 24 horas
    res.cookie('user_cookie', userCookie, { maxAge: 86400000, httpOnly: true });
    console.log('Nueva cookie asignada:', userCookie);
  }
  
  // Hacemos disponible el ID en el objeto request
  req.userCookie = userCookie;
  next();
});

// Ruta de prueba
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      mensaje: 'Backend funcionando con Docker',
      tu_cookie: req.userCookie,
      hora_db: result.rows[0].now
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error conectando a la DB');
  }
});

//  Algunas rutas

// GET: Obtener todos los productos
app.get('/api/productos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener productos');
  }
});

// POST: Agregar al carrito
app.post('/api/carrito', async (req, res) => {
  const { id_prod, cantidad } = req.body;
  const userCookie = req.userCookie; // Viene del middleware que creamos antes

  try {
    // 1. Verificar stock (Opcional pero recomendado)
    // 2. Insertar en carrito
    const query = `
      INSERT INTO carrito (user_cookie, id_prod, cantidad)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [userCookie, id_prod, cantidad];
    const result = await pool.query(query, values);
    
    res.json({ mensaje: 'Producto agregado', item: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al agregar al carrito');
  }
});

// GET: Ver mi carrito
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
    res.status(500).send('Error al actualizar el carrito');
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});