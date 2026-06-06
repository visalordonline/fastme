
const PremiumModal = {
  modal: null,

  init() {
    this.modal = document.getElementById('premiumModal');
    if (!this.modal) {
      console.warn('Premium modal element not found');
      return;
    }

    this.attachListeners();
  },

  attachListeners() {
    // Close button
    const closeBtn = document.getElementById('closePremiumModal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Click outside to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // Attach only to "Get Verified Badge" button
    const verifyBtn = document.getElementById('getVerifiedMenuBtn');
    if (verifyBtn) {
      verifyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
    }
  },

  open() {
    if (this.modal) {
      this.modal.style.display = 'flex';
      console.log('✅ Verification modal opened');
    }
  },

  close() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }
};

// Initialize automatically when script loads
PremiumModal.init();

// Make it available globally if needed
window.openPremiumModal = () => PremiumModal.open();