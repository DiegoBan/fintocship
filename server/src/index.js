const express = require('express');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// Middleware para interpretar JSON y Cookies
app.use(express.json());
app.use(cookieParser());

//  Rutas


//  Configuracion

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

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});