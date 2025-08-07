// index.js
const path    = require('path');
const express = require('express');
const fetch   = require('node-fetch');             // npm install node-fetch@2
const {google} = require('google-auth-library');
const serviceAccount = require('./service-account.json');

const app = express();

// 1) CORS başlıkları
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// 2) JSON body parser
app.use(express.json());

// 3) Static dosyaları sun (panelin burada servis edilecek)
app.use(express.static(path.join(__dirname, 'public')));

// 4) FCM için OAuth2 istemcisi
const jwtClient = new google.auth.JWT(
  serviceAccount.client_email,
  null,
  serviceAccount.private_key,
  ['https://www.googleapis.com/auth/firebase.messaging']
);

async function getAccessToken() {
  const tokens = await jwtClient.authorize();
  return tokens.access_token;
}

// 5) Bildirim endpoint’i
app.post('/send-notification', async (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) return res.status(400).send('title & body required');

  try {
    const accessToken = await getAccessToken();
    const project = serviceAccount.project_id;
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${project}/messages:send`;

    const response = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        message: {
          topic: 'all',
          notification: { title, body }
        }
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 6) Sunucuyu başlat
const PORT = 3000;
app.listen(PORT, () => console.log(`Server çalışıyor → http://localhost:${PORT}`));
