document.addEventListener('DOMContentLoaded', () => {
  const mainTitle = document.getElementById('main-title');
  const tagButtonsDiv = document.getElementById('tag-buttons');
  const sectionsContainer = document.getElementById('sections-container');
  const tagPopup = document.getElementById('tag-popup');
  const popupCancel = document.getElementById('popup-cancel');
  const popupTagButtons = tagPopup.querySelectorAll('.popup-tag-btn');

  const MAX_TAGS = 5;

  function showMainAndTags() {
    mainTitle.style.display = 'block';
    tagButtonsDiv.style.display = 'flex';
  }

  function hideMainAndTags() {
    mainTitle.style.display = 'none';
    tagButtonsDiv.style.display = 'none';
  }

  function removeInputSection(sectionDiv) {
    sectionsContainer.removeChild(sectionDiv);
    if (sectionsContainer.querySelectorAll('.input-section').length === 0) {
      showMainAndTags();
    }
  }

  function createInputSection(tag) {
    const currentCount = sectionsContainer.querySelectorAll('.input-section').length;
    if (currentCount >= MAX_TAGS) {
      alert(`You can only add up to ${MAX_TAGS} tags.`);
      return;
    }

    hideMainAndTags();

    const sectionDiv = document.createElement('div');
    sectionDiv.classList.add('input-section');
    sectionDiv.dataset.tag = tag;

    const tagLabel = document.createElement('h2');
    tagLabel.textContent = tag.charAt(0).toUpperCase() + tag.slice(1);
    sectionDiv.appendChild(tagLabel);

    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.marginBottom = '10px';
    buttonsDiv.style.display = 'flex';
    buttonsDiv.style.gap = '10px';

    const addTagBtn = document.createElement('button');
    addTagBtn.textContent = 'Add Another Tag';
    addTagBtn.type = 'button';
    buttonsDiv.appendChild(addTagBtn);

    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Submit';
    submitBtn.type = 'button';
    buttonsDiv.appendChild(submitBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.type = 'button';
    buttonsDiv.appendChild(cancelBtn);

    sectionDiv.appendChild(buttonsDiv);

    const textarea = document.createElement('textarea');
    textarea.rows = 5;
    textarea.style.width = '100%';
    textarea.placeholder = `Write your ${tag} here...`;
    sectionDiv.appendChild(textarea);

    sectionsContainer.appendChild(sectionDiv);

    addTagBtn.addEventListener('click', () => {
      const count = sectionsContainer.querySelectorAll('.input-section').length;
      if (count >= MAX_TAGS) {
        alert(`Maximum ${MAX_TAGS} tags allowed.`);
        return;
      }
      tagPopup.style.display = 'block';
    });

    submitBtn.addEventListener('click', () => {
      const value = textarea.value.trim();
      if (value === '') {
        alert('Please enter some text before submitting.');
        return;
      }

      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Submitting...';

      const savedData = JSON.parse(localStorage.getItem('userSubmissions')) || {
        complaints: [],
        requests: [],
        compliments: []
      };

      if (tag === 'complaint') savedData.complaints.push(value);
      else if (tag === 'request') savedData.requests.push(value);
      else if (tag === 'compliment') savedData.compliments.push(value);

      localStorage.setItem('userSubmissions', JSON.stringify(savedData));

      const params = new URLSearchParams({ tag, text: value });

      fetch(`https://script.google.com/macros/s/AKfycbwQ40mXjUopVaPV_GvFkVks_NGgniKjvOQ9JwXg2tGWaC6mAnl7YrUSTusmDbM2tPvJ/exec?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
          console.log("✅ GET success:", data);
          alert(`Response: ${data.message}`);
        })
        .catch(error => {
          console.error("❌ GET error:", error);
          alert("Failed to send data.");
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        });
    });

    cancelBtn.addEventListener('click', () => {
      removeInputSection(sectionDiv);
    });
  }

  tagButtonsDiv.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.tag;
      createInputSection(tag);
    });
  });

  popupTagButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.tag;
      createInputSection(tag);
      tagPopup.style.display = 'none';
    });
  });

  popupCancel.addEventListener('click', () => {
    tagPopup.style.display = 'none';
  });

  showMainAndTags();
});
