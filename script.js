// GLOBAL FUNCTIONS
window.closePopup = function(id) {
    document.getElementById(id).classList.remove('show');
    
    // Reload after closing message popup
    if (id === 'messagePopup') {
        setTimeout(() => {
            location.reload();
        }, 300);
    }
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
            grid.innerHTML = '<p style="grid-column: 1/-1; color: #999; font-size: 1.2em; padding: 40px;">Még nincsenek kinyitott üzenetek 😊</p>';
        } else {
            snapshot.docs.forEach(docSnap => {
                const data = docSnap.data();
                const item = document.createElement('div');
                item.className = 'archive-item';
                item.innerHTML = `
                    <img class="archive-thumb" src="${data.kep || 'https://placehold.co/200x140/ddd/fff?text=Nincs+kép'}" alt="">
                    <div class="archive-text">${data.uzenet.substring(0, 80)}${data.uzenet.length > 80 ? '...' : ''}</div>
                `;
                item.onclick = () => {
                    window.currentMessage = { id: docSnap.id, ...data };
                    closePopup('archivePopup');
                    showMessage();
                };
                grid.appendChild(item);
            });
        }
        
        document.getElementById('archivePopup').classList.add('show');
    } catch (error) { 
        console.error('Archive error:', error);
        document.getElementById('archiveGrid').innerHTML = '<p>Hiba történt 😢</p>';
    }
};

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
        const q = query(collection(db, 'messages'), where('kinyitva', '==', false), limit(50));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return;
        }
        const randomDoc = snapshot.docs[Math.floor(Math.random() * snapshot.docs.length)];
        window.currentMessage = { id: randomDoc.id, ...randomDoc.data() };
        document.getElementById('boxImg').src = 'images\\closedPresent.png';
    } catch (error) { 
        console.error('Load error:', error); 
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
}

// Gift box click
document.getElementById('giftBox').onclick = async () => {
    if (!window.currentMessage) return;
    try {
        await updateDoc(doc(db, 'messages', window.currentMessage.id), { 
            kinyitva: true
        });
        showMessage();
    } catch (error) { console.error('Update error:', error); }
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
document.getElementById('menuRefreshBtn').onclick = () => {
    location.reload();
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
    e.preventDefault(); document.getElementById('giftBox').onclick();
});

// Start
loadRandomMessage();
