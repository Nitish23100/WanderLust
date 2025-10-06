// Bootstrap form validation
(function () {
    'use strict';
    window.addEventListener('load', function () {
        // Fetch all the forms we want to apply custom Bootstrap validation styles to
        var forms = document.getElementsByClassName('needs-validation');
        // Loop over them and prevent submission
        var validation = Array.prototype.filter.call(forms, function (form) {
            form.addEventListener('submit', function (event) {
                if (form.checkValidity() === false) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            }, false);
        });
    }, false);
})();

// Star Rating Functionality
document.addEventListener('DOMContentLoaded', function() {
    const stars = document.querySelectorAll('.star');
    const ratingInput = document.getElementById('ratingInput');
    const reviewForm = document.querySelector('form[action*="/reviews"]');
    let currentRating = 0;

    if (stars.length > 0 && ratingInput) {
        stars.forEach((star, index) => {
            // Click event to set rating
            star.addEventListener('click', function() {
                currentRating = parseInt(this.getAttribute('data-rating'));
                ratingInput.value = currentRating;
                updateStars(currentRating);
                
                // Remove any existing error styling
                const starContainer = document.getElementById('starRating');
                starContainer.classList.remove('is-invalid');
                const errorDiv = starContainer.parentNode.querySelector('.invalid-feedback');
                if (errorDiv) {
                    errorDiv.style.display = 'none';
                }
            });

            // Hover events for visual feedback
            star.addEventListener('mouseenter', function() {
                const hoverRating = parseInt(this.getAttribute('data-rating'));
                updateStars(hoverRating, true);
            });
        });

        // Reset to current rating when mouse leaves the star container
        const starContainer = document.getElementById('starRating');
        if (starContainer) {
            starContainer.addEventListener('mouseleave', function() {
                updateStars(currentRating);
            });
        }
    }

    // Add form validation for star rating
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(event) {
            if (currentRating === 0) {
                event.preventDefault();
                event.stopPropagation();
                
                // Show error for star rating
                const starContainer = document.getElementById('starRating');
                starContainer.classList.add('is-invalid');
                
                // Show or create error message
                let errorDiv = starContainer.parentNode.querySelector('.invalid-feedback');
                if (!errorDiv) {
                    errorDiv = document.createElement('div');
                    errorDiv.className = 'invalid-feedback';
                    starContainer.parentNode.appendChild(errorDiv);
                }
                errorDiv.textContent = 'Please select a star rating.';
                errorDiv.style.display = 'block';
                
                // Scroll to the rating section
                starContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                return false;
            }
        });
    }

    function updateStars(rating, isHover = false) {
        stars.forEach((star, index) => {
            const starRating = index + 1;
            star.classList.remove('filled', 'hover');
            
            if (starRating <= rating) {
                if (isHover) {
                    star.classList.add('hover');
                } else {
                    star.classList.add('filled');
                }
            }
        });
    }

    // Category links are now handled by server-side routing
});