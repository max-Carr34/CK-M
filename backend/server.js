// ✅ Cargar variables de entorno PRIMERO
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const cors = require('cors');
// seguridad
const helmet = require('helmet'); // Protege headers HTTP
const rateLimit = require('express-rate-limit'); // Evita ataques de fuerza bruta

const routes = require('./routes/routes');
const app = express();  

/* ===============================
   SEGURIDAD GLOBAL
================================= */
app.use(helmet());
app.use(express.json({ limit: '10kb' })); //Limita tamaño de ataques

// Limita intentos de login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: {
    message: 'Demasiados intentos, intenta más tarde'
  }
});

/* ===============================
   CONFIGURACIÓN CORS
================================= */
app.use(cors({
  origin: 'http://localhost:8100', // Aqui va el link de la ruta pára el front
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(methodOverride('_method'));
app.use((req, res, next) => {
  console.log(`📡 [${req.method}] ${req.url}`);
  next();
});

/* ===============================
   🔐 APLICAR RATE LIMIT SOLO AL LOGIN
================================= */

// IMPORTANTE: tu login está en /api/login
app.use('/api/login', loginLimiter);


app.use('/api', routes);

const PORT = process.env.PORT || 3000; //servidor

app.listen(PORT, () => {
  console.log(`🚀 API corriendo en http://localhost:${PORT}`);
});