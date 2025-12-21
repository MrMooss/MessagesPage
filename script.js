// GLOBAL FUNCTIONS
window.closePopup = function(id) {
  document.getElementById(id).classList.remove('show');
  // Ne töltsük újra az oldalt - eltávolítva a reload
};

window.showImageFullscreen = function() {
  if (window.currentMessage && window.currentMessage.kep) {
    document.getElementById('fullscreenImage').src = window.currentMessage.kep;
    document.getElementById('fullscreenPopup').classList.add('show');
  }
};

window.showArchive = async function() {
  try {
    const q = query(
      collection(db, 'messages'),
      where('kinyitva', '==', true)
    );
    const snapshot = await getDocs(q);
    const grid = document.getElementById('archiveGrid');
    grid.innerHTML = '';

    if (snapshot.empty) {
      grid.innerHTML = '<p>Még nincsenek kinyitott üzenetek</p>';
    } else {
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const item = document.createElement('div');
        item.className = 'archive-item';
        item.innerHTML = `
          <div class="archive-item-content">
            <p>${data.uzenet}</p>
            ${data.kep ? `<img src="${data.kep}" alt="Üzenet kép">` : ''}
          </div>
        `;
        grid.appendChild(item);
      });
    }
    document.getElementById('archivePopup').classList.add('show');
  } catch (error) {
    console.error('Archive error:', error);
    alert('Hiba történt');
  }
};

// ===== LOCALSTORAGE HELPER FUNCTIONS =====
function getTodayDateKey() {
  const today = new Date();
  return `openedMessage_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function hasOpenedMessageToday() {
  const key = getTodayDateKey();
  return localStorage.getItem(key) === 'true';
}

function markMessageOpenedToday() {
  const key = getTodayDateKey();
  localStorage.setItem(key, 'true');
}

function startCountdownToNextDay() {
  const countdownEl = document.getElementById('countdown');
  if (!countdownEl) return;

  function update() {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);
    const diff = tomorrow - now;

    if (diff <= 0) {
      countdownEl.innerHTML = 'Új üzenet érkezett, frissítsd az oldalt!';
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    countdownEl.innerHTML = `${String(hours).padStart(2, '0')}:` +
      `${String(minutes).padStart(2, '0')}:` +
      `${String(seconds).padStart(2, '0')}`;
  }

  update();
  setInterval(update, 1000);
}

// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, doc, updateDoc, limit } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDTBHX8J1_x9aolqjnR-0oTW9jFs6-gW5Q",
  authDomain: "messagespage.firebaseapp.com",
  projectId: "messagespage",
  storageBucket: "messagespage.firebasestorage.app",
  messagingSenderId: "828789319874",
  appId: "1:828789319874:web:e6026335e871911ce7f35b",
  measurementId: "G-997S1KTRGC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.currentMessage = null;

// Load random message
async function loadRandomMessage() {
  try {
    const q = query(
      collection(db, 'messages'),
      where('kinyitva', '==', false),
      limit(50)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return;
    }
    const randomDoc = snapshot.docs[Math.floor(Math.random() * snapshot.docs.length)];
    window.currentMessage = {
      id: randomDoc.id,
      ...randomDoc.data()
    };
    document.getElementById('boxImg').src = 'images\\closedPresent.png';
  } catch (error) {
    console.error('Load error:', error);
  }
}

// Check if message already opened today and show timer
function checkAndShowTimer() {
  if (hasOpenedMessageToday()) {
    startCountdownToNextDay();
    
    // Disabled-elj a giftbox-ot
    const giftBox = document.getElementById('giftBox');
    giftBox.style.cursor = 'not-allowed';
    giftBox.onclick = null;
  }
}

// Show message
function showMessage() {
  document.getElementById('paperMessage').textContent = window.currentMessage.uzenet;
  const imgContainer = document.getElementById('messageImage');
  const popupImg = document.getElementById('popupImage');

  if (window.currentMessage.kep) {
    popupImg.src = window.currentMessage.kep;
    imgContainer.classList.remove('no-image');
  } else {
    imgContainer.classList.add('no-image');
  }

  document.getElementById('messagePopup').classList.add('show');
  
  // FONTOS: Jelöld meg hogy ma már nyitott üzenetet, és indítsd el a countdownt
  markMessageOpenedToday();
  startCountdownToNextDay();
}

// Gift box click
document.getElementById('giftBox').onclick = async () => {
  // Ellenőrizd hogy ma már meg lett-e nyitva
  if (hasOpenedMessageToday()) {
    alert('Ma már megnyitottál egy üzenetet! Majd holnap tudsz újat megnyitni.');
    return;
  }

  if (!window.currentMessage) return;

  try {
    await updateDoc(doc(db, 'messages', window.currentMessage.id), {
      kinyitva: true
    });
    showMessage();
  } catch (error) {
    console.error('Update error:', error);
  }
};

// Hamburger menu
document.getElementById('hamburgerBtn').onclick = () => {
  document.getElementById('menuOverlay').classList.add('show');
};

document.getElementById('closeMenuBtn').onclick = () => {
  document.getElementById('menuOverlay').classList.remove('show');
};

document.getElementById('menuArchiveBtn').onclick = () => {
  document.getElementById('menuOverlay').classList.remove('show');
  showArchive();
};

// Event listeners
document.getElementById('fullscreenBtn').onclick = showImageFullscreen;
document.getElementById('archiveBtn').onclick = showArchive;
document.getElementById('backBtn').onclick = () => closePopup('archivePopup');

// Fullscreen image click to close
document.getElementById('fullscreenImage').onclick = () => {
  closePopup('fullscreenPopup');
};

// Close buttons
document.querySelectorAll('.close-btn').forEach(btn => {
  btn.onclick = (e) => {
    const popup = e.target.closest('.popup-overlay').id;
    closePopup(popup);
  };
});

// ESC + Touch
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.popup-overlay.show').forEach(p => p.classList.remove('show'));
    document.getElementById('menuOverlay').classList.remove('show');
  }
});

document.getElementById('giftBox').addEventListener('touchstart', e => {
  e.preventDefault();
  document.getElementById('giftBox').onclick();
});

// Start
loadRandomMessage();
checkAndShowTimer();