// Young4ChickS Education Hub JavaScript

class EducationHub {
  constructor() {
    this.activeTab = 'overview';
    this.completedModules = new Set();
    this.modules = ['basics', 'types', 'business', 'management'];
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateProgress();
    this.showTab(this.activeTab);
  }

  bindEvents() {
    // Tab navigation
    document.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-tab')) {
        const tab = e.target.getAttribute('data-tab');
        this.showTab(tab);
      }
    });

    // Module completion toggle
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('module-btn')) {
        const moduleCard = e.target.closest('.module-card');
        const moduleId = moduleCard.getAttribute('data-module');
        this.toggleModuleCompletion(moduleId);
      }
    });

    // Smooth scrolling for hero buttons
    document.addEventListener('click', (e) => {
      if (e.target.closest('.btn')) {
        const btn = e.target.closest('.btn');
        if (btn.hasAttribute('data-tab')) {
          e.preventDefault();
          const tab = btn.getAttribute('data-tab');
          this.showTab(tab);
          // Smooth scroll to main content
          document.querySelector('.main-content').scrollIntoView({
            behavior: 'smooth'
          });
        }
      }
    });
  }

  showTab(tabName) {
    // Update active tab
    this.activeTab = tabName;

    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });

    // Show selected tab content
    const activeContent = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeContent && activeContent.classList.contains('tab-content')) {
      activeContent.classList.add('active');
    }

    // Update navigation buttons
    document.querySelectorAll('.nav-btn, .footer-link').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      }
    });

    // Update hero buttons
    document.querySelectorAll('.btn[data-tab]').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      }
    });
  }

  toggleModuleCompletion(moduleId) {
    const moduleCard = document.querySelector(`[data-module="${moduleId}"]`);
    const moduleBtn = moduleCard.querySelector('.module-btn');
    const moduleIcon = moduleCard.querySelector('.module-icon i');

    if (this.completedModules.has(moduleId)) {
      // Mark as incomplete
      this.completedModules.delete(moduleId);
      moduleCard.classList.remove('completed');
      moduleBtn.classList.remove('completed');
      moduleBtn.textContent = 'Start Module';
      
      // Change icon back to book-open
      moduleIcon.setAttribute('data-lucide', 'book-open');
    } else {
      // Mark as complete
      this.completedModules.add(moduleId);
      moduleCard.classList.add('completed');
      moduleBtn.classList.add('completed');
      moduleBtn.textContent = 'Completed';
      
      // Change icon to check-circle
      moduleIcon.setAttribute('data-lucide', 'check-circle');
    }

    // Reinitialize icons for the changed icon
    if (window.lucide) {
      window.lucide.createIcons();
    }

    this.updateProgress();
    this.showCompletionMessage();
  }

  updateProgress() {
    const completedCount = this.completedModules.size;
    const totalCount = this.modules.length;
    const percentage = (completedCount / totalCount) * 100;

    // Update progress numbers
    const completedElement = document.querySelector('.progress-completed');
    const totalElement = document.querySelector('.progress-total');
    const progressFill = document.querySelector('.progress-fill');

    if (completedElement) completedElement.textContent = completedCount;
    if (totalElement) totalElement.textContent = totalCount;
    if (progressFill) progressFill.style.width = `${percentage}%`;
  }

  showCompletionMessage() {
    const completedCount = this.completedModules.size;
    const totalCount = this.modules.length;
    const messageElement = document.querySelector('.progress-message');

    if (messageElement) {
      if (completedCount === totalCount) {
        messageElement.classList.remove('hidden');
        this.celebrateCompletion();
      } else {
        messageElement.classList.add('hidden');
      }
    }
  }

  celebrateCompletion() {
    // Add a subtle celebration animation
    const progressSummary = document.querySelector('.progress-summary');
    if (progressSummary) {
      progressSummary.style.transform = 'scale(1.02)';
      progressSummary.style.transition = 'transform 0.3s ease';
      
      setTimeout(() => {
        progressSummary.style.transform = 'scale(1)';
      }, 300);
    }
  }

  // Utility method to get completion status
  getCompletionStatus() {
    return {
      completed: this.completedModules.size,
      total: this.modules.length,
      percentage: (this.completedModules.size / this.modules.length) * 100,
      isComplete: this.completedModules.size === this.modules.length
    };
  }

  // Method to reset all progress (for testing/demo purposes)
  resetProgress() {
    this.completedModules.clear();
    
    // Reset all module cards
    document.querySelectorAll('.module-card').forEach(card => {
      card.classList.remove('completed');
      const btn = card.querySelector('.module-btn');
      const icon = card.querySelector('.module-icon i');
      
      if (btn) {
        btn.classList.remove('completed');
        btn.textContent = 'Start Module';
      }
      
      if (icon) {
        icon.setAttribute('data-lucide', 'book-open');
      }
    });

    // Reinitialize icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    this.updateProgress();
    this.showCompletionMessage();
  }

  // Method to complete all modules (for testing/demo purposes)
  completeAllModules() {
    this.modules.forEach(moduleId => {
      if (!this.completedModules.has(moduleId)) {
        this.toggleModuleCompletion(moduleId);
      }
    });
  }
}

// Smooth scrolling utility
function smoothScrollTo(element) {
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

// Animation utilities
function fadeIn(element, duration = 300) {
  element.style.opacity = '0';
  element.style.display = 'block';
  
  let start = null;
  function animate(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    const opacity = Math.min(progress / duration, 1);
    
    element.style.opacity = opacity;
    
    if (progress < duration) {
      requestAnimationFrame(animate);
    }
  }
  
  requestAnimationFrame(animate);
}

function slideDown(element, duration = 300) {
  element.style.height = '0';
  element.style.overflow = 'hidden';
  element.style.display = 'block';
  
  const targetHeight = element.scrollHeight;
  let start = null;
  
  function animate(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    const height = Math.min((progress / duration) * targetHeight, targetHeight);
    
    element.style.height = height + 'px';
    
    if (progress < duration) {
      requestAnimationFrame(animate);
    } else {
      element.style.height = '';
      element.style.overflow = '';
    }
  }
  
  requestAnimationFrame(animate);
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize the main application
  window.educationHub = new EducationHub();
  
  // Add some interactive enhancements
  addInteractiveEnhancements();
  
  // Initialize any additional features
  initializeAdditionalFeatures();
});

function addInteractiveEnhancements() {
  // Add hover effects to cards
  document.querySelectorAll('.feature-card, .module-card, .chick-type-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.transition = 'transform 0.2s ease';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });

  // Add click effects to buttons
  document.querySelectorAll('.btn, .module-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      this.style.transform = 'scale(0.98)';
      setTimeout(() => {
        this.style.transform = 'scale(1)';
      }, 100);
    });
  });
}

function initializeAdditionalFeatures() {
  // Add intersection observer for animations
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, {
      threshold: 0.1
    });

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .module-card, .step-item').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }

  // Add keyboard navigation support
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  });

  document.addEventListener('mousedown', function() {
    document.body.classList.remove('keyboard-navigation');
  });
}

// Utility functions for external use
window.EducationHubUtils = {
  // Get current tab
  getCurrentTab: () => window.educationHub?.activeTab,
  
  // Switch to specific tab
  switchTab: (tabName) => window.educationHub?.showTab(tabName),
  
  // Get progress information
  getProgress: () => window.educationHub?.getCompletionStatus(),
  
  // Reset all progress
  resetProgress: () => window.educationHub?.resetProgress(),
  
  // Complete all modules
  completeAll: () => window.educationHub?.completeAllModules(),
  
  // Smooth scroll to element
  scrollTo: (selector) => {
    const element = document.querySelector(selector);
    if (element) smoothScrollTo(element);
  }
};

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EducationHub;
}