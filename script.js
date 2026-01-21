// Firebase configuration (replace with your own config)
const firebaseConfig = {
  apiKey: "AIzaSyB_VnYjZHUmJqWR9IvSPobalqOqWldtw0k",
  authDomain: "kikelong-agent.firebaseapp.com",
  projectId: "kikelong-agent",
  storageBucket: "kikelong-agent.firebasestorage.app",
  messagingSenderId: "265491921170",
  appId: "1:265491921170:web:3302fc4327e0e0dabb1bcb"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM elements
const sections = document.querySelectorAll('.section');
const navButtons = document.querySelectorAll('nav button');
const birthdayForm = document.getElementById('birthday-form');
const birthdayList = document.getElementById('birthday-list');
const workForm = document.getElementById('work-form');
const workList = document.getElementById('work-list');
const messageForm = document.getElementById('message-form');
const templateList = document.getElementById('template-list');
const googleLoginBtn = document.getElementById('google-login');

// Navigation
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetId = button.id.replace('-btn', '');
        showSection(targetId);
    });
});

function showSection(sectionId) {
    sections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

// Authentication
auth.onAuthStateChanged(user => {
    if (user) {
        showSection('home');
        loadData();
    } else {
        showSection('login');
    }
});

googleLoginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(error => {
        console.error('Error signing in:', error);
    });
});

// Birthdays
birthdayForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const birthdate = document.getElementById('birthdate').value;
    
    const birthday = {
        name,
        birthdate,
        id: Date.now()
    };
    
    saveBirthday(birthday);
    displayBirthday(birthday);
    birthdayForm.reset();
    scheduleBirthdayNotifications(birthday);
});

function saveBirthday(birthday) {
    const birthdays = JSON.parse(localStorage.getItem('birthdays') || '[]');
    birthdays.push(birthday);
    localStorage.setItem('birthdays', JSON.stringify(birthdays));
}

function displayBirthday(birthday) {
    const li = document.createElement('li');
    li.innerHTML = `
        <strong>${birthday.name}</strong><br>
        ${new Date(birthday.birthdate).toLocaleDateString()}
    `;
    birthdayList.appendChild(li);
}

function scheduleBirthdayNotifications(birthday) {
    const birthDate = new Date(birthday.birthdate);
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Set notification for the day before
    const dayBefore = new Date(currentYear, birthDate.getMonth(), birthDate.getDate() - 1);
    if (dayBefore > today) {
        scheduleNotification(dayBefore, `Mañana cumple ${birthday.name}`);
    }
    
    // Set notification for the day of
    const dayOf = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
    if (dayOf > today) {
        scheduleNotification(dayOf, `Hoy cumple ${birthday.name}`);
    }
}

function scheduleNotification(date, message) {
    const timeUntilNotification = date.getTime() - Date.now();
    if (timeUntilNotification > 0) {
        setTimeout(() => {
            showNotification(message);
        }, timeUntilNotification);
    }
}

function showNotification(message) {
    if (Notification.permission === 'granted') {
        new Notification('PulseNotify', { body: message });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('PulseNotify', { body: message });
            }
        });
    }
}

// Work
workForm.addEventListener('submit', e => {
    e.preventDefault();
    const task = document.getElementById('task').value;
    const deadline = document.getElementById('deadline').value;
    
    const workItem = {
        task,
        deadline,
        id: Date.now()
    };
    
    saveWorkItem(workItem);
    displayWorkItem(workItem);
    workForm.reset();
});

document.getElementById('record-btn').addEventListener('click', () => {
    // Voice recording functionality (simplified)
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onresult = event => {
            document.getElementById('task').value = event.results[0][0].transcript;
        };
        
        recognition.start();
    } else {
        alert('Voice recognition not supported in this browser');
    }
});

function saveWorkItem(workItem) {
    const workItems = JSON.parse(localStorage.getItem('workItems') || '[]');
    workItems.push(workItem);
    localStorage.setItem('workItems', JSON.stringify(workItems));
}

function displayWorkItem(workItem) {
    const li = document.createElement('li');
    li.innerHTML = `
        <strong>${workItem.task}</strong><br>
        Deadline: ${new Date(workItem.deadline).toLocaleString()}
    `;
    workList.appendChild(li);
}

// WhatsApp Messages
let placeholderCount = 0;

document.getElementById('add-placeholder').addEventListener('click', () => {
    placeholderCount++;
    const placeholderDiv = document.createElement('div');
    placeholderDiv.className = 'placeholder-input';
    placeholderDiv.innerHTML = `
        <input type="text" placeholder="Valor para {${placeholderCount}}" id="placeholder-${placeholderCount}">
    `;
    document.getElementById('placeholders').appendChild(placeholderDiv);
});

document.getElementById('generate-btn').addEventListener('click', () => {
    const template = document.getElementById('template').value;
    let generatedMessage = template;
    
    for (let i = 1; i <= placeholderCount; i++) {
        const value = document.getElementById(`placeholder-${i}`).value;
        generatedMessage = generatedMessage.replace(new RegExp(`\\{${i}\\}`, 'g'), value);
    }
    
    document.getElementById('generated-message').textContent = generatedMessage;
    
    // Copy to clipboard
    navigator.clipboard.writeText(generatedMessage).then(() => {
        alert('Mensaje copiado al portapapeles');
    });
});

document.getElementById('save-template').addEventListener('click', () => {
    const template = document.getElementById('template').value;
    const savedTemplates = JSON.parse(localStorage.getItem('templates') || '[]');
    savedTemplates.push({ template, placeholders: placeholderCount });
    localStorage.setItem('templates', JSON.stringify(savedTemplates));
    displayTemplate({ template, placeholders: placeholderCount });
});

function displayTemplate(templateData) {
    const li = document.createElement('li');
    li.innerHTML = `
        <strong>Plantilla:</strong> ${templateData.template}<br>
        <strong>Placeholders:</strong> ${templateData.placeholders}
    `;
    templateList.appendChild(li);
}

// Load data on page load
function loadData() {
    // Load birthdays
    const birthdays = JSON.parse(localStorage.getItem('birthdays') || '[]');
    birthdays.forEach(displayBirthday);
    
    // Load work items
    const workItems = JSON.parse(localStorage.getItem('workItems') || '[]');
    workItems.forEach(displayWorkItem);
    
    // Load templates
    const templates = JSON.parse(localStorage.getItem('templates') || '[]');
    templates.forEach(displayTemplate);
}

// Request notification permission
if ('Notification' in window) {
    Notification.requestPermission();
}
