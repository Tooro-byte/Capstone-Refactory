
      // Tab switching functionality
      document.addEventListener('DOMContentLoaded', function() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
          button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            document.getElementById(targetTab + '-tab').classList.add('active');
          });
        });

        // Add hover effects and animations
        const cards = document.querySelectorAll('.stat-card, .request-card');
        cards.forEach(card => {
          card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
          });
          
          card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
          });
        });
      });