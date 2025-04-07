const express = require('express');
const fs = require('fs');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Función para parsear un archivo M3U
function parseM3U(content) {
  const lines = content.split('\n');
  const channels = [];
  let current = null;

  lines.forEach(line => {
    line = line.trim();
    if (line.startsWith('#EXTINF')) {
      const name = line.split(',')[1] || 'Sin nombre';
      current = { name };
    } else if (line && !line.startsWith('#') && current) {
      current.url = line;
      channels.push(current);
      current = null;
    }
  });

  return channels;
}

// Proxy para evitar el mixed content
app.use('/proxy-stream', createProxyMiddleware({
  target: '',
  changeOrigin: true,
  router: req => {
    const url = decodeURIComponent(req.url.replace('/live/', 'http://'));
    return url.split('/live/')[0];
  },
  pathRewrite: (path, req) => {
    const realUrl = decodeURIComponent(path.replace(/^\/live\//, ''));
    const parts = realUrl.split('/');
    parts.shift();
    return '/' + parts.join('/');
  },
  onProxyReq: (proxyReq, req) => {
    proxyReq.setHeader('origin', '');
  }
}));

// Página principal
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'playlist.m3u');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.send('Error al cargar el archivo M3U');

    const channels = parseM3U(data);

    const channelList = channels.map((ch, i) => {
      const encodedUrl = encodeURIComponent(ch.url);
      return `<li><a href="#" onclick="playChannel('${encodedUrl}')">${ch.name}</a></li>`;
    }).join('');

    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Lista IPTV</title>
    </head>
    <body>
      <h1>Canales</h1>
      <ul>${channelList}</ul>
      <hr/>
      <video id="videoPlayer" width="640" height="360" controls autoplay></video>
      <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
      <script>
        function playChannel(encodedUrl) {
          const url = '/proxy-stream/live/' + encodedUrl;
          const video = document.getElementById('videoPlayer');

          if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
            video.addEventListener('loadedmetadata', () => video.play());
          } else {
            alert("Tu navegador no soporta este tipo de stream");
          }
        }
      </script>
    </body>
    </html>
    `);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
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
