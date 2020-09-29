// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/7.18.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.18.0/firebase-messaging.js');


// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyC8YI4cOsgo65RetWcckqUzznW1ydpMFvE",
    authDomain: "jixa-chat-app95.firebaseapp.com",
    databaseURL: "https://jixa-chat-app95.firebaseio.com",
    projectId: "jixa-chat-app95",
    // storageBucket: "jixa-chat-app95.appspot.com",
    messagingSenderId: "93509288272",
    appId: "1:93509288272:web:b11106f93c0606e51e2c55"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

 // Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = 'New Message';
    const notificationOptions = {
      body: payload.data.message,
        icon: payload.data.icon
    };
  
    return self.registration.showNotification(notificationTitle,
      notificationOptions);
  });
  

