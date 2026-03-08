const admin = require('firebase-admin');
const serviceAccount = require('./roombridge-e6a36-firebase-adminsdk-fbsvc-10c1cb9482.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'roombridge-e6a36.firebasestorage.app',
});

const bucket = admin.storage().bucket();

const corsConfig = [
  {
    origin: [
      'http://localhost:5173',
      'http://localhost:8081',
      'http://localhost:3000',
      'https://roombridge-e6a36.web.app',
      'https://roombridge-e6a36.firebaseapp.com',
    ],
    method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
    maxAgeSeconds: 3600,
    responseHeader: [
      'Content-Type',
      'Authorization',
      'Content-Length',
      'User-Agent',
      'x-goog-resumable',
    ],
  },
];

async function setCors() {
  await bucket.setCorsConfiguration(corsConfig);
  console.log('✅ CORS configuration applied to Firebase Storage bucket');
  process.exit(0);
}

setCors().catch((err) => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
