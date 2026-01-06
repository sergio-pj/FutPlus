// Login UI behavior + Firebase Auth + Firestore sync (compat)
(function(){
  const $ = sel => document.querySelector(sel);

  const signinForm = $('#signin-form');
  const signupForm = $('#signup-form');
  const tabSignIn = $('#tab-signin');
  const tabSignUp = $('#tab-signup');
  const feedback = $('#auth-feedback');
  const profileArea = $('#profile-area');
  const logoutBtn = $('#logout');
  const saveProfileBtn = $('#save-profile');

  function show(el){ el.classList.remove('hidden') }
  function hide(el){ el.classList.add('hidden') }

  tabSignIn.addEventListener('click', ()=>{
    tabSignIn.classList.add('active'); tabSignUp.classList.remove('active');
    show(signinForm); hide(signupForm);
  });
  tabSignUp.addEventListener('click', ()=>{
    tabSignUp.classList.add('active'); tabSignIn.classList.remove('active');
    show(signupForm); hide(signinForm);
  });

  // Basic helpers
  function setFeedback(msg, err){ feedback.textContent = msg || ''; if(err) console.error(err); }

  // Auth flows using firebase compat (auth)
  async function signup(e){
    e.preventDefault();
    if(!window.firebase || !firebase.auth) return setFeedback('Firebase não inicializado. Cole suas credenciais em JS/firebase-init.js');
    const name = $('#signup-name').value.trim();
    const email = $('#signup-email').value.trim();
    const password = $('#signup-password').value;
    try{
      const res = await firebase.auth().createUserWithEmailAndPassword(email, password);
      await res.user.updateProfile({ displayName: name });
      setFeedback('Conta criada. Logando...');
    }catch(err){ setFeedback(err.message, err); }
  }

  async function signin(e){
    e.preventDefault();
    if(!window.firebase || !firebase.auth) return setFeedback('Firebase não inicializado.');
    const email = $('#signin-email').value.trim();
    const password = $('#signin-password').value;
    try{
      await firebase.auth().signInWithEmailAndPassword(email, password);
      setFeedback('Entrando...');
    }catch(err){ setFeedback(err.message, err); }
  }

  async function signout(){
    if(firebase && firebase.auth){ await firebase.auth().signOut(); setFeedback('Sessão encerrada.'); }
  }

  // Save profile (cep/address) to Firestore under users/{uid}/profile
  async function saveProfile(){
    if(!(firebase && firebase.auth && firebase.firestore)) return setFeedback('Firebase não inicializado.');
    const user = firebase.auth().currentUser;
    if(!user) return setFeedback('Usuário não autenticado.');
    const cep = $('#profile-cep').value.trim();
    const address = $('#profile-address').value.trim();
    try{
      await firebase.firestore().collection('users').doc(user.uid).set({ cep, address, name: user.displayName || '' }, { merge: true });
      setFeedback('Endereço salvo.');
    }catch(err){ setFeedback('Erro ao salvar perfil', err); }
  }

  // Sync cart: if localStorage has cart, push to Firestore; otherwise, pull from Firestore
  async function syncCartOnLogin(user){
    try{
      const db = firebase.firestore();
      const cartKey = 'futplus_cart';
      const localCart = localStorage.getItem(cartKey);
      const userRef = db.collection('users').doc(user.uid);
      if(localCart){
        await userRef.collection('meta').doc('cart').set({ data: JSON.parse(localCart) });
      } else {
        const snap = await userRef.collection('meta').doc('cart').get();
        if(snap.exists){
          localStorage.setItem(cartKey, JSON.stringify(snap.data().data || []));
        }
      }
    }catch(err){ console.warn('syncCartOnLogin erro', err); }
  }

  // Observe auth state
  function observeAuth(){
    if(!(window.firebase && firebase.auth)) return;
    firebase.auth().onAuthStateChanged(async user => {
      if(user){
        setFeedback('Autenticado como ' + (user.displayName || user.email));
        show(profileArea);
        hide(signinForm); hide(signupForm);
        // load profile if exists
        try{
          const doc = await firebase.firestore().collection('users').doc(user.uid).get();
          if(doc.exists){
            const data = doc.data(); if(data.cep) $('#profile-cep').value = data.cep; if(data.address) $('#profile-address').value = data.address;
          }
        }catch(e){ console.warn(e); }
        await syncCartOnLogin(user);
      } else {
        setFeedback('Você não está autenticado.');
        hide(profileArea);
        show(signinForm);
      }
    });
  }

  // bind
  signupForm.addEventListener('submit', signup);
  signinForm.addEventListener('submit', signin);
  logoutBtn && logoutBtn.addEventListener('click', signout);
  saveProfileBtn && saveProfileBtn.addEventListener('click', saveProfile);

  // try to observe (will warn if firebase not configured)
  document.addEventListener('DOMContentLoaded', ()=>{
    observeAuth();
  });

})();
