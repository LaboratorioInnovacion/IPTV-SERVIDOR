const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración del proxy inverso para el stream
// Se encarga de redirigir las peticiones del cliente (HTTPS) al servidor de stream (HTTP)
app.use('/proxy-stream', createProxyMiddleware({
  target: 'http://200.115.193.177',
  changeOrigin: true,
  pathRewrite: {
    '^/proxy-stream': '' // elimina /proxy-stream al reenviar la petición
  }
}));

// Ruta principal que entrega la interfaz HTML para reproducir el stream
app.get('/', (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>Reproductor IPTV con Proxy</title>
    </head>
    <body>
      <h1>Reproductor IPTV</h1>
      <video id="videoPlayer" width="640" height="360" controls autoplay>
        Tu navegador no soporta la reproducción de video.
      </video>
      <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
      <script>
        const video = document.getElementById('videoPlayer');
        // URL del stream a través del proxy para evitar contenido mixto
        const videoSrc = '/proxy-stream/live/26hd-720/.m3u8';
  
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(videoSrc);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, function() {
            video.play();
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Para navegadores como Safari que soportan HLS de forma nativa
          video.src = videoSrc;
          video.addEventListener('loadedmetadata', function() {
            video.play();
          });
        } else {
          console.error("Tu navegador no soporta HLS.");
        }
      </script>
    </body>
  </html>
  `);
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto \${PORT}\`);
});

// const express = require('express');
// const fs = require('fs');
// const path = require('path');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Función para parsear el archivo M3U y obtener los canales
// function parsePlaylist(fileContent) {
//   const lines = fileContent.split('\n');
//   const channels = [];
//   let currentChannel = null;
  
//   lines.forEach(line => {
//     line = line.trim();
//     if (!line) return;
    
//     if (line.startsWith('#EXTINF')) {
//       // Extraemos el nombre del canal (después de la coma)
//       const parts = line.split(',');
//       const name = parts[1] || 'Sin nombre';
//       currentChannel = { name };
//     } else if (!line.startsWith('#') && currentChannel) {
//       // La línea siguiente es la URL del canal
//       currentChannel.url = line;
//       channels.push(currentChannel);
//       currentChannel = null;
//     }
//   });
  
//   return channels;
// }

// // Ruta para la página principal que muestra la lista de canales y un reproductor
// app.get('/', (req, res) => {
//   const filePath = path.join(__dirname, 'playlist.m3u');
//   fs.readFile(filePath, 'utf8', (err, data) => {
//     if (err) {
//       return res.status(500).send('Error al leer el archivo M3U');
//     }
    
//     const channels = parsePlaylist(data);
    
//     let html = `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <meta charset="UTF-8">
//       <title>Servidor IPTV</title>
//     </head>
//     <body>
//       <h1>Lista de Canales</h1>
//       <ul>
//     `;
    
//     channels.forEach(channel => {
//       html += `<li><a href="#" onclick="playChannel('${channel.url}'); return false;">${channel.name}</a></li>`;
//     });
    
//     html += `
//       </ul>
//       <hr>
//       <video id="videoPlayer" width="640" height="360" controls autoplay>
//         Tu navegador no soporta la reproducción de video.
//       </video>
      
//       <script>
//         function playChannel(url) {
//           var video = document.getElementById('videoPlayer');
//           video.src = url;
//           video.load();
//           video.play();
//         }
//       </script>
//     </body>
//     </html>
//     `;
    
//     res.send(html);
//   });
// });

// // Ruta para servir el archivo M3U (opcional, para que otros clientes lo consulten)
// app.get('/playlist.m3u', (req, res) => {
//   const filePath = path.join(__dirname, 'playlist.m3u');
//   fs.readFile(filePath, 'utf8', (err, data) => {
//     if (err) {
//       console.error('Error al leer el archivo M3U:', err);
//       return res.status(500).send('Error al leer la lista de reproducción');
//     }
//     res.setHeader('Content-Type', 'audio/mpegurl');
//     res.send(data);
//   });
// });

// app.listen(PORT, () => {
//   console.log(`Servidor corriendo en el puerto ${PORT}`);
// });

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
