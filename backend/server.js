// server.js
const express     = require('express');
const dotenv      = require('dotenv');
const cors        = require('cors');
const helmet      = require('helmet');
const rateLimit   = require('express-rate-limit');
dotenv.config();

// ── Part 4E: fail fast if critical secrets are missing ──────────
['JWT_SECRET'].forEach((k) => {
  if (!process.env[k]) {
    console.error(`FATAL: missing env var ${k}`);
    process.exit(1);
  }
});

const authRoutes   = require('./routes/authRoutes');
const lookupRoutes = require('./routes/lookupRoutes');
const assetRoutes  = require('./routes/assetRoutes');

const app  = express();
app.set('trust proxy', 1);  
const PORT = process.env.PORT || 8000;

// ── Part 4C: security headers (must be early) ───────────────────
app.use(helmet());

// ── Part 4B: CORS locked to known frontends ─────────────────────
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

const corsOptions = {
  origin: function(origin, callback) {
    // allow requests with no origin (curl, mobile apps, Render health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// CORS must also handle OPTIONS preflight requests explicitly
// ('/{*splat}' is Express 5 syntax for the '*' catch-all)
app.options('/{*splat}', cors(corsOptions));

// ── Part 4E: body size cap ──────────────────────────────────────
app.use(express.json({ limit: '2mb' }));

// ── Part 4D: rate limiting ──────────────────────────────────────
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use('/api', globalLimiter);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
app.use('/api/auth', authLimiter);   // tighter on login/register

// ── Routes ──────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/lookups',  lookupRoutes);
app.use('/api/assets',   assetRoutes);
app.use('/api/approver', require('./routes/approverRoutes'));
app.use('/api/fa',       require('./routes/faroutes.js'));
app.use('/api/taxation', require('./routes/taxationRoutes'));

app.get('/', (req, res) => res.json({ message: 'APM backend is running' }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const sequelize = require('./config/db');
sequelize.authenticate()
  .then(() => console.log('DB connected successfully'))
  .catch(err => console.error('DB connection failed:', err.message));