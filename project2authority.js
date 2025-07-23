// Arrays zur Speicherung aktueller Beiträge aus Google Sheets
  let complaints = [];
  let requests = [];
  let compliments = [];

// Sobald das DOM vollständig geladen ist, wird dieser Code ausgeführt
document.addEventListener('DOMContentLoaded', () => {

  // URL zum Google Apps Script für das Speichern von Daten
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbwQ40mXjUopVaPV_GvFkVks_NGgniKjvOQ9JwXg2tGWaC6mAnl7YrUSTusmDbM2tPvJ/exec';
  
// 1. Load data first
  fetch(GAS_URL)
    .then(res => res.json())
    .then(data => {
      complaints = data.complaints || ['Complaint example #1'];
      requests = data.requests || ['Request example #1'];
      compliments = data.compliments || ['Compliment example #1'];
    })
    .catch(err => {
      console.warn('Fallback:', err);
      complaints = savedDataBackup.complaints.length ? savedDataBackup.complaints : ['Complaint example #1'];
      requests = savedDataBackup.requests.length ? savedDataBackup.requests : ['Request example #1'];
      compliments = savedDataBackup.compliments.length ? savedDataBackup.compliments : ['Compliment example #1'];
    })
    .finally(() => {
      // 2. Setup UI after data is ready
      updateVisibleTags();
      updateCounts();
      attachEventListeners(); // custom function with all your tagButtons.addEventListener() stuff
    });
});

  // Lokale Sicherungskopie aus dem Browser-Storage (Backup)
  const savedDataBackup = JSON.parse(localStorage.getItem('userSubmissions')) || { complaints: [], requests: [], compliments: [] };
  
  // Storage für manuell gespeicherte Beiträge ("Put into Storage"-Funktion)
  const storage = JSON.parse(localStorage.getItem('userStorage')) || { complaints: [], requests: [], compliments: [] };

  // Merkt sich den aktuellen Index pro Kategorie für die Navigation
  const current = { complaint: 0, request: 0, compliment: 0 };

  // Buttons zum Umschalten zwischen Kategorien
  const tagButtons = {
    complaint: document.querySelector('.a-complaint'),
    request: document.querySelector('.a-request'),
    compliment: document.querySelector('.a-compliment'),
    storage: document.querySelector('.a-storage')
  };

  // Prüft, ob es gespeicherte Beiträge gibt
  function hasStorage() {
    return storage.complaints.length + storage.requests.length + storage.compliments.length > 0;
  }

  // Zeigt oder versteckt Buttons je nach Verfügbarkeit von Inhalten
  function updateVisibleTags() {
    tagButtons.complaint.style.display = complaints.length > 0 ? 'inline-block' : 'none';
    tagButtons.request.style.display = requests.length > 0 ? 'inline-block' : 'none';
    tagButtons.compliment.style.display = compliments.length > 0 ? 'inline-block' : 'none';
    tagButtons.storage.style.display = hasStorage() ? 'inline-block' : 'none';
  }

  // Aktualisiert die Zähler auf den Buttons
  function updateCounts() {
    tagButtons.complaint.dataset.count = complaints.length;
    tagButtons.request.dataset.count = requests.length;
    tagButtons.compliment.dataset.count = compliments.length;
    tagButtons.storage.dataset.count = storage.complaints.length + storage.requests.length + storage.compliments.length;
  }

  // Versteckt alle Kategorie-Buttons
  function hideAllTags() {
    Object.values(tagButtons).forEach(btn => btn.style.display = 'none');
  }

  // Zeigt Buttons gemäß der aktuellen Inhalte an
  function showAllTags() {
    updateVisibleTags();
    updateCounts();
  }

  // Versteckt alle Inhaltsbereiche
  function hideAllSections() {
    document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
  }

  // Speichert aktuelle Daten im LocalStorage und bei Google Sheets
  function saveAllData() {
    localStorage.setItem('userSubmissions', JSON.stringify({ complaints, requests, compliments }));
    localStorage.setItem('userStorage', JSON.stringify(storage));
    saveToGoogleSheets();
  }

  // Sendet die Daten an Google Sheets via Google Apps Script
  function saveToGoogleSheets() {
    fetch(GAS_URL, {
      method: 'GET', // Sollte hier evtl. 'POST' sein – bei JSON body ist GET problematisch
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaints, requests, compliments }) // body bei GET wird oft ignoriert
    })
      .then(res => res.json())
      .then(response => console.log('Saved to Google Sheets:', response))
      .catch(err => console.error('Failed to save to Google Sheets:', err));
  }

  // Zeigt ein einzelnes Element einer Kategorie an
  function renderItem(type, list, containerClass) {
    const container = document.querySelector(`.${containerClass}`);
    container.innerHTML = '';

    if (list.length === 0) {
  container.innerHTML = `
    <p>No more ${type}s.</p>
    <button class="a-cancel">Cancel</button>
  `;
  container.querySelector('.a-cancel').addEventListener('click', () => {
    hideAllSections();
    showAllTags();
  });
  return;
}


      container.querySelector('.a-cancel').addEventListener('click', () => {
        hideAllSections();
        showAllTags();
      });
      return;
    }

    // Zurück zum Anfang, wenn Index überschritten
    if (current[type] >= list.length) current[type] = 0;

    const item = list[current[type]];
    container.innerHTML = `
      <p>${item}</p>
      <button class="a-storage">Put into Storage</button>
      <button class="a-next">Next ${type}</button>
      <button class="a-cancel">Cancel</button>
    `;

    // Button: Speichert Beitrag ins Storage und entfernt ihn aus der aktuellen Liste
    container.querySelector('.a-storage').addEventListener('click', () => {
      storage[`${type}s`].push(item);
      list.splice(current[type], 1);
      if (current[type] >= list.length) current[type] = 0;
      renderItem(type, list, containerClass);
      updateVisibleTags();
      updateCounts();
      saveAllData();
    });

    // Button: Zeigt nächsten Eintrag an
    container.querySelector('.a-next').addEventListener('click', () => {
    // Aktuelles Element löschen
    list.splice(current[type], 1);

    // Wenn Index außerhalb liegt, zurück auf 0 setzen
    if (current[type] >= list.length) current[type] = 0;

    // Neue Ansicht rendern
    renderItem(type, list, containerClass);

    // UI aktualisieren
    updateVisibleTags();
    updateCounts();
    saveAllData();
    });


    // Button: Abbrechen und zur Übersicht zurück
    container.querySelector('.a-cancel').addEventListener('click', () => {
      hideAllSections();
      showAllTags();
    });
  }

  // Zeigt alle gespeicherten Beiträge im Storage an
  function renderStorage() {
  const container = document.querySelector('.storage-content');
  container.innerHTML = '';

  const types = [
    { key: 'complaints', singular: 'complaint' },
    { key: 'requests', singular: 'request' },
    { key: 'compliments', singular: 'compliment' }
  ];

  types.forEach(({ key, singular }) => {
    const entries = storage[key];
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    container.innerHTML += `<h3>${label} (${entries.length})</h3>`;

    if (entries.length === 0) {
      container.innerHTML += '<p>None.</p>';
    } else {
      const ul = document.createElement('ul');

      entries.forEach((entry, index) => {
        const li = document.createElement('li');
        li.appendChild(document.createTextNode(entry));

        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.style.marginLeft = '10px';

        delBtn.addEventListener('click', () => {
  if (confirm('Delete this entry?')) {
    storage[key] = storage[key].filter(e => e !== entry);
    saveAllData();
    renderStorage();
    updateVisibleTags();
    updateCounts();
  }
});

        li.appendChild(delBtn);
        ul.appendChild(li);
      });

      container.appendChild(ul);
    }
  });
}

  // EventListener für Button-Klicks
  tagButtons.storage.addEventListener('click', () => {
    hideAllSections();
    hideAllTags();
    document.getElementById('section-storage').style.display = 'block';
    renderStorage();
  });

  tagButtons.complaint.addEventListener('click', () => {
    hideAllSections();
    hideAllTags();
    document.getElementById('section-complaint').style.display = 'block';
    renderItem('complaint', complaints, 'complaint-content');
  });

  tagButtons.request.addEventListener('click', () => {
    hideAllSections();
    hideAllTags();
    document.getElementById('section-request').style.display = 'block';
    renderItem('request', requests, 'request-content');
  });

  tagButtons.compliment.addEventListener('click', () => {
    hideAllSections();
    hideAllTags();
    document.getElementById('section-compliment').style.display = 'block';
    renderItem('compliment', compliments, 'compliment-content');
  });

  // Cancel button inside Storage section to go back to main tags
document.getElementById('storage-cancel').addEventListener('click', () => {
  hideAllSections();
  showAllTags();
});
