document.addEventListener('DOMContentLoaded', () => {
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbwQ40mXjUopVaPV_GvFkVks_NGgniKjvOQ9JwXg2tGWaC6mAnl7YrUSTusmDbM2tPvJ/exec';

  let complaints = [];
  let requests = [];
  let compliments = [];

  const savedDataBackup = JSON.parse(localStorage.getItem('userSubmissions')) || { complaints: [], requests: [], compliments: [] };
  const storage = JSON.parse(localStorage.getItem('userStorage')) || { complaints: [], requests: [], compliments: [] };
  const current = { complaint: 0, request: 0, compliment: 0 };

  const tagButtons = {
    complaint: document.querySelector('.a-complaint'),
    request: document.querySelector('.a-request'),
    compliment: document.querySelector('.a-compliment'),
    random: document.querySelector('.a-random'),
    storage: document.querySelector('.a-storage')
  };

  function hasStorage() {
    return storage.complaints.length + storage.requests.length + storage.compliments.length > 0;
  }

  function updateVisibleTags() {
    tagButtons.complaint.style.display = complaints.length > 0 ? 'inline-block' : 'none';
    tagButtons.request.style.display = requests.length > 0 ? 'inline-block' : 'none';
    tagButtons.compliment.style.display = compliments.length > 0 ? 'inline-block' : 'none';
    tagButtons.random.style.display = (complaints.length + requests.length + compliments.length) > 0 ? 'inline-block' : 'none';
    tagButtons.storage.style.display = hasStorage() ? 'inline-block' : 'none';
  }

  function updateCounts() {
    tagButtons.complaint.dataset.count = complaints.length;
    tagButtons.request.dataset.count = requests.length;
    tagButtons.compliment.dataset.count = compliments.length;
    tagButtons.random.dataset.count = complaints.length + requests.length + compliments.length;
    tagButtons.storage.dataset.count = storage.complaints.length + storage.requests.length + storage.compliments.length;
  }

  function hideAllTags() {
    Object.values(tagButtons).forEach(btn => btn.style.display = 'none');
  }

  function showAllTags() {
    updateVisibleTags();
    updateCounts();
  }

  function hideAllSections() {
    document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
  }

  function saveAllData() {
    localStorage.setItem('userSubmissions', JSON.stringify({ complaints, requests, compliments }));
    localStorage.setItem('userStorage', JSON.stringify(storage));
    saveToGoogleSheets();
  }

  function saveToGoogleSheets() {
    fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaints, requests, compliments })
    })
      .then(res => res.json())
      .then(response => console.log('Saved to Google Sheets:', response))
      .catch(err => console.error('Failed to save to Google Sheets:', err));
  }

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

    if (current[type] >= list.length) current[type] = 0;

    const item = list[current[type]];
    container.innerHTML = `
      <p>${item}</p>
      <button class="a-storage">Put into Storage</button>
      <button class="a-next">Next ${type}</button>
      <button class="a-cancel">Cancel</button>
    `;

    container.querySelector('.a-storage').addEventListener('click', () => {
      storage[`${type}s`].push(item);
      list.splice(current[type], 1);
      if (current[type] >= list.length) current[type] = 0;
      renderItem(type, list, containerClass);
      updateVisibleTags();
      updateCounts();
      saveAllData();
    });

    container.querySelector('.a-next').addEventListener('click', () => {
      current[type]++;
      renderItem(type, list, containerClass);
    });

    container.querySelector('.a-cancel').addEventListener('click', () => {
      hideAllSections();
      showAllTags();
    });
  }

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

  function renderRandom() {
    const container = document.querySelector('.random-content');
    container.innerHTML = '';

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

  // Initial fetch (with localStorage fallback)
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
      console.warn('Fallback to localStorage due to error:', err);
      complaints = savedDataBackup.complaints.length ? savedDataBackup.complaints : ['Complaint example #1'];
      requests = savedDataBackup.requests.length ? savedDataBackup.requests : ['Request example #1'];
      compliments = savedDataBackup.compliments.length ? savedDataBackup.compliments : ['Compliment example #1'];
      updateVisibleTags();
      updateCounts();
    });
});
