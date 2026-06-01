importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBoAiPMjFE9CRgGQ_WenH6LOj9vP1WITBc",
  authDomain: "vivabanking.firebaseapp.com",
  projectId: "vivabanking",
  storageBucket: "vivabanking.firebasestorage.app",
  messagingSenderId: "761954432577",
  appId: "1:761954432577:web:3a15a929364197d444b8c0"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
