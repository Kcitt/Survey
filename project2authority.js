// Sobald das DOM vollständig geladen ist, wird dieser Code ausgeführt
document.addEventListener('DOMContentLoaded', () => {

  // URL zum Google Apps Script für das Speichern von Daten
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbwQ40mXjUopVaPV_GvFkVks_NGgniKjvOQ9JwXg2tGWaC6mAnl7YrUSTusmDbM2tPvJ/exec';

  // Arrays zur Speicherung aktueller Beiträge aus Google Sheets
  let complaints = [];
  let requests = [];
  let compliments = [];

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
    random: document.querySelector('.a-random'),
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
    tagButtons.random.style.display = (complaints.length + requests.length + compliments.length) > 0 ? 'inline-block' : 'none';
    tagButtons.storage.style.display = hasStorage() ? 'inline-block' : 'none';
  }

  // Aktualisiert die Zähler auf den Buttons
  function updateCounts() {
    tagButtons.complaint.dataset.count = complaints.length;
    tagButtons.request.dataset.count = requests.length;
    tagButtons.compliment.dataset.count = compliments.length;
    tagButtons.random.dataset.count = complaints.length + requests.length + compliments.length;
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
      // Wenn keine Einträge mehr vorhanden sind
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
      current[type]++;
      renderItem(type, list, containerClass);
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

    const types = ['complaints', 'requests', 'compliments'];
    types.forEach(type => {
      const entries = storage[type];
      const label = type.charAt(0).toUpperCase() + type.slice(1);
      container.innerHTML += `<h3>${label} (${entries.length})</h3>`;

      if (entries.length === 0) {
        container.innerHTML += '<p>None.</p>';
      } else {
        const ul = document.createElement('ul');
        entries.forEach((entry, index) => {
          const li = document.createElement('li');
          li.textContent = entry;

          const delBtn = document.createElement('button');
          delBtn.textContent = 'Delete';
          delBtn.style.marginLeft = '10px';

          // Löscht einen Eintrag nach Bestätigung
          delBtn.addEventListener('click', () => {
            if (confirm('Delete this entry?')) {
              storage[type].splice(index, 1);
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

  // Zeigt zufällige Beiträge aus allen Kategorien an
  function renderRandom() {
    const container = document.querySelector('.random-content');
    container.innerHTML = '';

    // Alle verfügbaren Einträge in einem Array zusammenfassen
    let allItems = [
      ...complaints.map(c => ({ type: 'complaint', text: c })),
      ...requests.map(r => ({ type: 'request', text: r })),
      ...compliments.map(co => ({ type: 'compliment', text: co }))
    ];

    if (allItems.length === 0) {
      container.innerHTML = `
        <p>No submissions available.</p>
        <button class="a-cancel">Back</button>
      `;
      container.querySelector('.a-cancel').addEventListener('click', () => {
        hideAllSections();
        showAllTags();
      });
      return;
    }

    // Innere Funktion zeigt zufällige Beiträge an
    function display() {
      if (allItems.length === 0) {
        container.innerHTML = `
          <p>No more submissions available.</p>
          <button class="a-cancel">Back</button>
        `;
        container.querySelector('.a-cancel').addEventListener('click', () => {
          hideAllSections();
          showAllTags();
        });
        return;
      }

      const index = Math.floor(Math.random() * allItems.length);
      const currentItem = allItems[index];

      container.innerHTML = `
        <p><strong>${currentItem.type.charAt(0).toUpperCase() + currentItem.type.slice(1)}:</strong> ${currentItem.text}</p>
        <button class="a-storage">Put into Storage</button>
        <button class="a-next">Next Random</button>
        <button class="a-cancel">Cancel</button>
      `;

      // Beitrag ins Storage übernehmen und aus Ursprungsliste entfernen
      container.querySelector('.a-storage').addEventListener('click', () => {
        storage[`${currentItem.type}s`].push(currentItem.text);
        if (currentItem.type === 'complaint') complaints = complaints.filter(c => c !== currentItem.text);
        else if (currentItem.type === 'request') requests = requests.filter(r => r !== currentItem.text);
        else compliments = compliments.filter(c => c !== currentItem.text);

        allItems.splice(index, 1);
        saveAllData();
        updateVisibleTags();
        updateCounts();
        display();
      });

      container.querySelector('.a-next').addEventListener('click', () => {
        display();
      });

      container.querySelector('.a-cancel').addEventListener('click', () => {
        hideAllSections();
        showAllTags();
      });
    }

    display();
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

  tagButtons.random.addEventListener('click', () => {
    hideAllSections();
    hideAllTags();
    document.getElementById('section-random').style.display = 'block';
    renderRandom();
  });

  // Initialer Datenabruf – Google Sheets oder Fallback auf LocalStorage
  fetch(GAS_URL)
    .then(res => res.json())
    .then(data => {
      complaints = data.complaints || [];
      requests = data.requests || [];
      compliments = data.compliments || [];
      updateVisibleTags();
      updateCounts();
    })
    .catch(err => {
      // Bei Fehlern: Lokale Daten nutzen
      console.warn('Fallback to localStorage due to error:', err);
      complaints = savedDataBackup.complaints.length ? savedDataBackup.complaints : ['Complaint example #1'];
      requests = savedDataBackup.requests.length ? savedDataBackup.requests : ['Request example #1'];
      compliments = savedDataBackup.compliments.length ? savedDataBackup.compliments : ['Compliment example #1'];
      updateVisibleTags();
      updateCounts();
    });

});
