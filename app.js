const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Función para parsear el archivo M3U y obtener los canales
function parsePlaylist(fileContent) {
  const lines = fileContent.split('\n');
  const channels = [];
  let currentChannel = null;
  
  lines.forEach(line => {
    line = line.trim();
    if (!line) return;
    
    if (line.startsWith('#EXTINF')) {
      // Extraemos el nombre del canal (después de la coma)
      const parts = line.split(',');
      const name = parts[1] || 'Sin nombre';
      currentChannel = { name };
    } else if (!line.startsWith('#') && currentChannel) {
      // La línea siguiente es la URL del canal
      currentChannel.url = line;
      channels.push(currentChannel);
      currentChannel = null;
    }
  });
  
  return channels;
}

// Ruta para la página principal que muestra la lista de canales y un reproductor
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'playlist.m3u');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error al leer el archivo M3U');
    }
    
    const channels = parsePlaylist(data);
    
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Servidor IPTV</title>
    </head>
    <body>
      <h1>Lista de Canales</h1>
      <ul>
    `;
    
    channels.forEach(channel => {
      html += `<li><a href="#" onclick="playChannel('${channel.url}'); return false;">${channel.name}</a></li>`;
    });
    
    html += `
      </ul>
      <hr>
      <video id="videoPlayer" width="640" height="360" controls autoplay>
        Tu navegador no soporta la reproducción de video.
      </video>
      
      <script>
        function playChannel(url) {
          var video = document.getElementById('videoPlayer');
          video.src = url;
          video.load();
          video.play();
        }
      </script>
    </body>
    </html>
    `;
    
    res.send(html);
  });
});

// Ruta para servir el archivo M3U (opcional, para que otros clientes lo consulten)
app.get('/playlist.m3u', (req, res) => {
  const filePath = path.join(__dirname, 'playlist.m3u');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer el archivo M3U:', err);
      return res.status(500).send('Error al leer la lista de reproducción');
    }
    res.setHeader('Content-Type', 'audio/mpegurl');
    res.send(data);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// const express = require('express');
// const fs = require('fs');
// const path = require('path');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Ruta para servir el archivo M3U
// app.get('/playlist.m3u', (req, res) => {
//     const filePath = path.join(__dirname, 'playlist.m3u');
    
//     // Leemos el archivo de forma asíncrona
//     fs.readFile(filePath, 'utf8', (err, data) => {
//         if (err) {
//             console.error('Error al leer el archivo M3U:', err);
//             return res.status(500).send('Error al leer la lista de reproducción');
//         }
//         // Establecemos el Content-Type apropiado
//         res.setHeader('Content-Type', 'audio/mpegurl');
//         res.send(data);
//     });
// });

// // Ruta de inicio para verificar que el servidor está corriendo
// app.get('/', (req, res) => {
//     res.send('Servidor IPTV corriendo. Accede a /playlist.m3u para ver la lista.');
// });

// app.listen(PORT, () => {
//     console.log(`Servidor corriendo en el puerto ${PORT}`);
// });
