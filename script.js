import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, doc, updateDoc, limit, Timestamp, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// GLOBAL FUNCTIONS
window.closePopup = function(id) {
  document.getElementById(id).classList.remove('show');
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
        
        item.onclick = () => {
          document.getElementById('archivePopup').classList.remove('show');
          showArchivedMessage(data);
        };
        
        grid.appendChild(item);
      });
    }
    document.getElementById('archivePopup').classList.add('show');
  } catch (error) {
    console.error('Archive error:', error);
    alert('Hiba történt');
  }
};

function showArchivedMessage(messageData) {
  document.getElementById('paperMessage').textContent = messageData.uzenet;
  const imgContainer = document.getElementById('messageImage');
  const popupImg = document.getElementById('popupImage');
  const messageContainer = document.querySelector('.message-container');

  if (messageData.kep) {
    popupImg.src = messageData.kep;
    imgContainer.classList.remove('no-image');
    messageContainer.classList.remove('no-image-container');
  } else {
    imgContainer.classList.add('no-image');
    messageContainer.classList.add('no-image-container');
  }

  // Countdown elrejtése archivált üzenetnél
  const countdownEl = document.getElementById('countdown');
  if (countdownEl) {
    countdownEl.style.display = 'none';
  }

  document.getElementById('messagePopup').classList.add('show');
}

async function hasOpenedMessageToday() {
  try {
    const docRef = doc(db, 'openToday', 'today');
    const docSnap = await getDoc(docRef);
    console.log('hasOpenedMessageToday:', docSnap.exists() ? docSnap.data().opened : false);
    return docSnap.exists() ? docSnap.data().opened === true : false;
  } catch (error) {
    console.error('Error checking:', error);
    return false;
  }
}

async function setOpenedStatus(status) {
  try {
    const docRef = doc(db, 'openToday', 'today');
    await setDoc(docRef, { opened: status });
    console.log('Status set to:', status);
  } catch (error) {
    console.error('Error setting status:', error);
  }
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

    countdownEl.innerHTML = `${String(hours).padStart(2,'0')}:` +
      `${String(minutes).padStart(2,'0')}:` +
      `${String(seconds).padStart(2,'0')}`;
  }

  update();
  setInterval(update, 1000);
}

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

async function loadTimedMessage() {
    try {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        console.log('Looking for date:', todayStr);
        
        const allMessages = await getDocs(collection(db, 'messages'));
        
        let foundMessage = null;
        allMessages.docs.forEach(doc => {
            const data = doc.data();
            if (data.kinyitva === false && data.ido) {
                // Timestamp-ból Date objektum
                const messageDate = data.ido.toDate();
                const messageDateStr = `${messageDate.getFullYear()}-${String(messageDate.getMonth() + 1).padStart(2, '0')}-${String(messageDate.getDate()).padStart(2, '0')}`;
                
                console.log('Message date:', messageDateStr, 'Match:', messageDateStr === todayStr);
                
                if (messageDateStr === todayStr) {
                    foundMessage = { id: doc.id, ...data };
                }
            }
        });
        
        if (foundMessage) {
            window.currentMessage = foundMessage;
            
            if (!(await hasOpenedMessageToday())) {
                document.getElementById('boxImg').src = 'images\\closedPresent.png';
            }
            return true;
        } else {
            console.log('Nincs üzenet a mai napra');
            return false;
        }
    } catch (error) {
        console.error('Load timed message error:', error);
        return false;
    }
}

async function loadRandomMessage() {
  try {
    const q = query(
        collection(db, 'messages'),
        where('kinyitva', '==', false),
        where('ido', '==', null),
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
    
 
    if (!(await hasOpenedMessageToday())) {
        document.getElementById('boxImg').src = 'images\\closedPresent.png';
    }
  } catch (error) {
    console.error('Load error:', error);
  }
}

// Check if message already opened today and show timer
async function checkAndShowTimer() {
  const opened = await hasOpenedMessageToday();
  console.log('checkAndShowTimer - opened status:', opened);
  
  if (opened) {
    startCountdownToNextDay();
    
    const giftBox = document.getElementById('giftBox');
    giftBox.style.cursor = 'not-allowed';
    giftBox.onclick = null;
  }
}

async function showMessage() {
  document.getElementById('paperMessage').textContent = window.currentMessage.uzenet;
  const imgContainer = document.getElementById('messageImage');
  const popupImg = document.getElementById('popupImage');
  const messageContainer = document.querySelector('.message-container');

  if (window.currentMessage.kep) {
    popupImg.src = window.currentMessage.kep;
    imgContainer.classList.remove('no-image');
    messageContainer.classList.remove('no-image-container');
  } else {
    imgContainer.classList.add('no-image');
    messageContainer.classList.add('no-image-container');
  }

  document.getElementById('messagePopup').classList.add('show');
  
  await setOpenedStatus(true);
  startCountdownToNextDay();
}

// Gift box click
document.getElementById('giftBox').onclick = async () => {
  if (await hasOpenedMessageToday()) {
    alert('Ma már megnyitottál egy üzenetet! Majd holnap tudsz újat megnyitni.');
    return;
  }

  if (!window.currentMessage) return;

  try {
    await updateDoc(doc(db, 'messages', window.currentMessage.id), {
      kinyitva: true
    });
    await showMessage();
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

async function checkAndResetIfNewDay() {
  const lastResetDate = localStorage.getItem('lastResetDate');
  const today = new Date().toDateString();
  
  if (lastResetDate !== today) {
    // Új nap van - reset
    await setOpenedStatus(false);
    localStorage.setItem('lastResetDate', today);
    console.log('Új nap - status resetelve');
  }
}

// START - csak egyszer hívjuk meg!
(async function init() {
    await checkAndResetIfNewDay();
    const timedLoaded = await loadTimedMessage();
    if (!timedLoaded) {
        await loadRandomMessage();
    }
    await checkAndShowTimer();
})();
