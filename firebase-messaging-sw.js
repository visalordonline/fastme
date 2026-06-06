importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDQY_NSthcHARv0S9rkAAikP0leF9Kl29k",
  authDomain: "contribution-c5309.firebaseapp.com",
  projectId: "contribution-c5309",
  messagingSenderId: "800641687170",
  appId: "1:800641687170:web:36e0e50bdd8cf39844de9b"
});

const messaging = firebase.messaging();

// 🔥 THIS is what makes it work when app is CLOSED
messaging.onBackgroundMessage(function(payload) {
  console.log('[SW] Background message:', payload);

  const title = payload.notification?.title || "Fastme";
  const options = {
    body: payload.notification?.body || "New update",
    icon: "/logo.jpg"
  };

  self.registration.showNotification(title, {
  body: body,
  icon: "/logo.jpg",
  badge: "/logo.jpg",
  vibrate: [200, 100, 200],
  requireInteraction: true,
  data: {
    url: "/provider/dashboard.html"
  }
});
});