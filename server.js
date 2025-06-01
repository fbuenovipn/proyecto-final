// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la base de datos SQLite
const db = new sqlite3.Database('./db/database.db', (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite');
        initializeDatabase();
    }
});

// Crear tabla si no existe
function initializeDatabase() {
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            telefono TEXT NOT NULL,
            fecha_nacimiento TEXT NOT NULL,
            password TEXT NOT NULL,
            direccion TEXT NOT NULL,
            genero TEXT NOT NULL,
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error al crear la tabla:', err);
        } else {
            console.log('Tabla "usuarios" creada o ya existente');
        }
    });
}

// Ruta para servir el frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para guardar registros
app.post('/registro', (req, res) => {
    const { nombre, email, telefono, fechaNacimiento, password, direccion, genero } = req.body;
    
    // Validación básica
    if (!nombre || !email || !telefono || !fechaNacimiento || !password || !direccion || !genero) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    
    // Insertar en la base de datos
    const sql = `INSERT INTO usuarios (nombre, email, telefono, fecha_nacimiento, password, direccion, genero) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [nombre, email, telefono, fechaNacimiento, password, direccion, genero];
    
    db.run(sql, params, function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
            }
            return res.status(500).json({ error: 'Error al guardar en la base de datos' });
        }
        
        res.json({
            id: this.lastID,
            message: 'Registro guardado exitosamente'
        });
    });
});

// Ruta para obtener todos los registros
app.get('/datos', (req, res) => {
    db.all('SELECT id, nombre, email, telefono, genero, fecha_registro FROM usuarios', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener datos' });
        }
        res.json(rows);
    });
});

// Ruta para eliminar un registro
app.delete('/eliminar/:id', (req, res) => {
    const id = req.params.id;
    
    db.run('DELETE FROM usuarios WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error al eliminar el registro' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }
        
        res.json({ message: 'Registro eliminado exitosamente' });
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});