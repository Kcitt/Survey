document.addEventListener('DOMContentLoaded', () => {
  const acceptButtons = document.querySelectorAll('.accept-btn');
  const continueBtn = document.getElementById('continue-btn');

  let acceptedRules = new Set();

  acceptButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      if (acceptedRules.has(index)) {
        acceptedRules.delete(index);
        btn.textContent = "I accept this rule";
        btn.style.backgroundColor = "#FF4500"; // original color
      } else {
        acceptedRules.add(index);
        btn.textContent = "Accepted ✓";
        btn.style.backgroundColor = "#00cc88"; // green highlight
      }
      continueBtn.disabled = acceptedRules.size !== acceptButtons.length;
    });
  });

  continueBtn.addEventListener('click', () => {
    if (!continueBtn.disabled) {
      window.location.href = 'project2second.html'; // or your actual second page filename
    }
  });
});
