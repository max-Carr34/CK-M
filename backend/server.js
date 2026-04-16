// ✅ Cargar variables de entorno PRIMERO
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const cors = require('cors');

// seguridad
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const routes = require('./routes/routes');

const app = express();

/* ===============================
   SEGURIDAD GLOBAL
================================= */
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

/* ===============================
   RATE LIMIT LOGIN
================================= */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message: 'Demasiados intentos, intenta más tarde'
  }
});

/* ===============================
   CORS CONFIG (FIX REAL)
================================= */
const allowedOrigins = [
  'http://localhost:8100',
  process.env.FRONTEND_URL
];

app.use(cors({
  origin: (origin, callback) => {

    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log('❌ Bloqueado por CORS:', origin);
    return callback(new Error('No permitido por CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


/* ===============================
   BODY PARSER
================================= */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(methodOverride('_method'));

/* ===============================
   LOG DE PETICIONES
================================= */
app.use((req, res, next) => {
  console.log(`📡 [${req.method}] ${req.url}`);
  next();
});

/* ===============================
   RUTA DE PRUEBA
================================= */
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API funcionando en Render 🚀'
  });
});

/* ===============================
   RATE LIMIT SOLO LOGIN
================================= */
app.use('/api/login', loginLimiter);

/* ===============================
   RUTAS PRINCIPALES
================================= */
app.use('/api', routes);

/* ===============================
   SERVER
================================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API corriendo en puerto ${PORT}`);
  console.log('🌍 FRONTEND_URL:', process.env.FRONTEND_URL);
});