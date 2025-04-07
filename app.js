const express = require('express');
const fs = require('fs');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Función para parsear el archivo M3U
function parseM3U(content) {
  const lines = content.split('\n');
  const channels = [];
  let current = null;
  const regexLogo = /tvg-logo="([^"]+)"/;
  const regexGroup = /group-title="([^"]+)"/;
  
  lines.forEach(line => {
    line = line.trim();
    if (line.startsWith('#EXTINF')) {
      let name = line.substring(line.indexOf(',') + 1).trim();
      let logoMatch = line.match(regexLogo);
      let groupMatch = line.match(regexGroup);
      let tvgLogo = logoMatch ? logoMatch[1] : '';
      let groupTitle = groupMatch ? groupMatch[1] : '';
      current = { name, tvgLogo, groupTitle };
    } else if (line && !line.startsWith('#') && current) {
      current.url = line;
      channels.push(current);
      current = null;
    }
  });
  
  return channels;
}

// Endpoint proxy para evitar contenido mixto y controlar el tiempo de espera
// Endpoint proxy para evitar contenido mixto y controlar el tiempo de espera
app.use('/proxy', (req, res, next) => {
  const target = req.query.url;
  if (!target) {
    res.status(400).send('No se especificó la URL');
    return;
  }
  try {
    // Parseamos la URL completa usando la clase URL de Node.js
    const parsedUrl = new URL(target);
    // Actualizamos el req.url para que contenga la ruta y los parámetros de búsqueda
    req.url = parsedUrl.pathname + parsedUrl.search;
    // Configuramos el proxy con el origen (dominio y protocolo)
    createProxyMiddleware({
      target: parsedUrl.origin,
      changeOrigin: true,
      secure: false, // útil si el destino usa certificados no válidos
      timeout: 15000, // 15 segundos para responder
      proxyTimeout: 15000, // 15 segundos para la respuesta del proxy
      onError(err, req, res) {
        console.error('Error en proxy:', err);
        res.status(504).send('Error occurred while trying to proxy: ' + target);
      }
    })(req, res, next);
  } catch (e) {
    res.status(400).send('URL inválida');
  }
});


// Ruta principal: lee el archivo M3U, parsea y genera la interfaz HTML con la lista de canales
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'latino2.m3u');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.send('Error al cargar el archivo M3U');

    const channels = parseM3U(data);
    const channelList = channels.map(ch => {
      const encodedUrl = encodeURIComponent(ch.url);
      const logoHtml = ch.tvgLogo ? `<img src="${ch.tvgLogo}" alt="${ch.name}" style="width:50px;height:auto;"> ` : '';
      return `<li>${logoHtml}<a href="#" onclick="playChannel('${encodedUrl}')">${ch.name}</a> (${ch.groupTitle})</li>`;
    }).join('');

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Lista IPTV</title>
      </head>
      <body>
        <h1>Canales IPTV</h1>
        <ul>${channelList}</ul>
        <hr/>
        <video id="videoPlayer" width="640" height="360" controls autoplay>
          Tu navegador no soporta la reproducción de video.
        </video>
        <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
        <script>
          function playChannel(encodedUrl) {
            const url = '/proxy?url=' + encodedUrl;
            const video = document.getElementById('videoPlayer');

            if (Hls.isSupported()) {
              const hls = new Hls();
              hls.loadSource(url);
              hls.attachMedia(video);
              hls.on(Hls.Events.MANIFEST_PARSED, function() {
                video.play();
              });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              video.src = url;
              video.addEventListener('loadedmetadata', function() {
                video.play();
              });
            } else {
              alert("Tu navegador no soporta HLS.");
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
