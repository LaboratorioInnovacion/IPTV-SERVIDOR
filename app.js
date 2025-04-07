const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Ruta para servir el archivo M3U
app.get('/playlist.m3u', (req, res) => {
    const filePath = path.join(__dirname, 'playlist.m3u');
    
    // Leemos el archivo de forma asíncrona
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer el archivo M3U:', err);
            return res.status(500).send('Error al leer la lista de reproducción');
        }
        // Establecemos el Content-Type apropiado
        res.setHeader('Content-Type', 'audio/mpegurl');
        res.send(data);
    });
});

// Ruta de inicio para verificar que el servidor está corriendo
app.get('/', (req, res) => {
    res.send('Servidor IPTV corriendo. Accede a /playlist.m3u para ver la lista.');
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
