require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Requerido por Render en free tier
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM media_items ORDER BY id DESC');
    res.render('index', { items: result.rows });
  } catch (err) {
    console.error('Error DB:', err);
    res.status(500).send('Error al conectar con la base de datos');
  }
});

// Inicializar tabla si no existe
const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS media_items (
      id SERIAL PRIMARY KEY,
      title VARCHAR(100) NOT NULL,
      description TEXT,
      platform VARCHAR(50),
      cloud_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  // Seed inicial (solo si la tabla está vacía)
  const check = await pool.query('SELECT count(*) FROM media_items');
  if (parseInt(check.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO media_items (title, description, platform, cloud_url) VALUES
      ('Imagen demostrativa', 'Foto alojada en AWS S3 público', 'AWS S3', 'https://s3.amazonaws.com/bucket-demo/render-sample.jpg'),
      ('Video corporativo', 'Clip en Google Cloud Storage', 'Google Cloud', 'https://storage.googleapis.com/demo-videos/render-demo.mp4'),
      ('Documento PDF', 'Manual alojado en Dropbox', 'Dropbox', 'https://dl.dropboxusercontent.com/s/demo/render-manual.pdf');
    `);
  }
  console.log('✅ Base de datos inicializada');
};

initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
});