/*
  Coloque aqui suas credenciais do Firebase.
  Exemplo:
  const firebaseConfig = {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
  };
  Depois de colar, o script inicializa o Firebase automaticamente.
*/

// WARNING: não comite credenciais públicas de produção em repositórios públicos.
// Este arquivo é um placeholder — cole sua config localmente.

try {
  if (typeof firebaseConfig === 'undefined') {
    console.warn('Firebase config não encontrada em JS/firebase-init.js — cole sua config em firebaseConfig. A autenticação não funcionará até isso ser feito.');
  } else {
    firebase.initializeApp(firebaseConfig);
    // view helpers
    window._FUTPLUS_FIREBASE_READY = true;
    console.log('Firebase inicializado.');
  }
} catch (err) {
  console.warn('Erro ao inicializar Firebase:', err);
}
