// ── PASTE YOUR CONFIG FROM FIREBASE CONSOLE ──
const firebaseConfig = {
    apiKey: "AIzaSyBv3uxm20pImzHAPN_uwhXxHA4CVnAmZp8",
    authDomain: "star-project-13866.firebaseapp.com",
    databaseURL: "https://star-project-13866-default-rtdb.firebaseio.com",
    projectId: "star-project-13866",
    storageBucket: "star-project-13866.firebasestorage.app",
    messagingSenderId: "766253294108",
    appId: "1:766253294108:web:c4429ae0819d58a298f5d9"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const formScreen = document.getElementById("form-screen");
const waitScreen = document.getElementById("wait-screen");
const doneScreen = document.getElementById("done-screen");

document.getElementById("submit-btn").addEventListener("click", () => {
  const typeEl = document.querySelector('input[name="starType"]:checked');
  const name = document.getElementById("starName").value.trim();
  if (!typeEl || !name) { alert("Please answer every question!"); return; }

  // Create the session
  const ref = db.ref("sessions").push();
  ref.set({
    starType: typeEl.value,
    starName: name,
    status: "waiting_button",
    createdAt: Date.now()
  });
  db.ref("latest_session").set(ref.key);

  formScreen.classList.add("hidden");
  waitScreen.classList.remove("hidden");

  // Watch ONLY until the button is pressed — then detach forever.
  // Per your spec: after the button press, this phone stops syncing
  // and everything continues on the MacBook only.
  const statusRef = ref.child("status");
  const watcher = statusRef.on("value", (snap) => {
    if (snap.val() === "button_pressed") {
      statusRef.off("value", watcher);           // ← stop syncing
      waitScreen.classList.add("hidden");
      doneScreen.classList.remove("hidden");
    }
  });
});
