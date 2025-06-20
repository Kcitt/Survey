document.addEventListener('DOMContentLoaded', () => {
  // Seed initial data for testing (remove this if you want to use your own storage)
  if (!localStorage.getItem('userSubmissions')) {
    localStorage.setItem('userSubmissions', JSON.stringify({
      complaints: ['Complaint example #1', 'Complaint example #2'],
      requests: ['Request example #1'],
      compliments: ['Compliment example #1']
    }));
  }
  if (!localStorage.getItem('userStorage')) {
    localStorage.setItem('userStorage', JSON.stringify({
      complaints: [],
      requests: [],
      compliments: []
    }));
  }

  // Load saved data or default empty arrays
  const savedData = JSON.parse(localStorage.getItem('userSubmissions')) || {
    complaints: [],
    requests: [],
    compliments: []
  };

  let complaints = savedData.complaints;
  let requests = savedData.requests;
  let compliments = savedData.compliments;

  // Storage for processed items
  let storage = JSON.parse(localStorage.getItem('userStorage')) || {
    complaints: [],
    requests: [],
    compliments: []
  };

  let current = {
    complaint: 0,
    request: 0,
    compliment: 0
  };

  const tagButtons = {
    complaint: document.querySelector('.a-complaint'),
    request: document.querySelector('.a-request'),
    compliment: document.querySelector('.a-compliment'),
    random: document.querySelector('.a-random'),
    storage: document.querySelector('.a-storage')
  };

  function updateVisibleTags() {
    tagButtons.complaint.style.display = complaints.length > 0 ? 'inline-block' : 'none';
    tagButtons.request.style.display = requests.length > 0 ? 'inline-block' : 'none';
    tagButtons.compliment.style.display = compliments.length > 0 ? 'inline-block' : 'none';
    tagButtons.random.style.display = (complaints.length + requests.length + compliments.length > 0) ? 'inline-block' : 'none';
    tagButtons.storage.style.display = hasStorage() ? 'inline-block' : 'none';
  }

  function updateCounts() {
    tagButtons.complaint.setAttribute('data-count', complaints.length);
    tagButtons.request.setAttribute('data-count', requests.length);
    tagButtons.compliment.setAttribute('data-count', compliments.length);
    tagButtons.random.setAttribute('data-count', complaints.length + requests.length + compliments.length);
    tagButtons.storage.setAttribute('data-count', storage.complaints.length + storage.requests.length + storage.compliments.length);
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
  }

  // Event Listeners for buttons

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

  // Render Functions

  function renderItem(type, list, containerClass) {
    const container = document.querySelector(`.${containerClass}`);
    container.innerHTML = '';

    if (list.length === 0) {
      container.innerHTML = `<p>No more ${type}s.</p><button class="a-cancel">Back</button>`;
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
      storage[type + 's'].push(item);
      list.splice(current[type], 1);
      if (current[type] >= list.length) current[type] = 0;
      renderItem(type, list, containerClass);
      updateVisibleTags();
      updateCounts();
      saveAllData();
    });

    container.querySelector('.a-next').addEventListener('click', () => {
      current[type]++;
      if (current[type] >= list.length) current[type] = 0;
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
          delBtn.type = 'button';
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

    container.innerHTML += `<button class="a-cancel-storage">Back</button>`;

    container.querySelector('.a-cancel-storage').addEventListener('click', () => {
      hideAllSections();
      showAllTags();
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
      container.innerHTML = `<p>No submissions available.</p><button class="a-cancel">Back</button>`;
      container.querySelector('.a-cancel').addEventListener('click', () => {
        hideAllSections();
        showAllTags();
      });
      return;
    }

    let index = Math.floor(Math.random() * allItems.length);
    let currentItem = allItems[index];

    function display() {
      container.innerHTML = `
        <p><strong>${currentItem.type.charAt(0).toUpperCase() + currentItem.type.slice(1)}:</strong> ${currentItem.text}</p>
        <button class="a-storage">Put into Storage</button>
        <button class="a-next">Next Random</button>
        <button class="a-cancel">Cancel</button>
      `;

      container.querySelector('.a-storage').addEventListener('click', () => {
        const typePlural = currentItem.type + 's';
        storage[typePlural].push(currentItem.text);

        // Remove from original list
        if (currentItem.type === 'complaint') complaints.splice(complaints.indexOf(currentItem.text), 1);
        else if (currentItem.type === 'request') requests.splice(requests.indexOf(currentItem.text), 1);
        else if (currentItem.type === 'compliment') compliments.splice(compliments.indexOf(currentItem.text), 1);

        saveAllData();
        updateVisibleTags();
        updateCounts();

        // Rebuild allItems and pick new random
        allItems = [
          ...complaints.map(c => ({ type: 'complaint', text: c })),
          ...requests.map(r => ({ type: 'request', text: r })),
          ...compliments.map(co => ({ type: 'compliment', text: co }))
        ];

        if (allItems.length === 0) {
          container.innerHTML = `<p>No submissions left.</p><button class="a-cancel">Back</button>`;
          container.querySelector('.a-cancel').addEventListener('click', () => {
            hideAllSections();
            showAllTags();
          });
          return;
        }

        index = Math.floor(Math
