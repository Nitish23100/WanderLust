// Bootstrap form validation with star rating check
(function () {
    'use strict';
    window.addEventListener('load', function () {
        // Fetch all the forms we want to apply custom Bootstrap validation styles to
        var forms = document.getElementsByClassName('needs-validation');
        // Loop over them and prevent submission
        var validation = Array.prototype.filter.call(forms, function (form) {
            form.addEventListener('submit', function (event) {
                const ratingInput = form.querySelector('#ratingInput');
                
                // Check if this is a review form and rating is not selected
                if (ratingInput && (ratingInput.value === '0' || ratingInput.value === '')) {
                    event.preventDefault();
                    event.stopPropagation();
                    showFlashMessage('Please select a star rating before submitting your review.', 'error');
                    return;
                }
                
                if (form.checkValidity() === false) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            }, false);
        });
    }, false);
})();

// Function to show flash messages
function showFlashMessage(message, type) {
    const existingFlash = document.querySelector('.flash-message');
    if (existingFlash) {
        existingFlash.remove();
    }
    
    const alertClass = type === 'error' ? 'alert-danger' : 'alert-success';
    const icon = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
    
    const flashHTML = `
        <div class="alert ${alertClass} alert-dismissible fade show flash-message" role="alert">
            <i class="${icon} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    const container = document.querySelector('.reviews-section') || document.body;
    container.insertAdjacentHTML('afterbegin', flashHTML);
}

// Star Rating Functionality
document.addEventListener('DOMContentLoaded', function() {
    const stars = document.querySelectorAll('.star');
    const ratingInput = document.getElementById('ratingInput');
    let currentRating = 0;

    if (stars.length > 0 && ratingInput) {
        stars.forEach((star, index) => {
            // Click event to set rating
            star.addEventListener('click', function() {
                currentRating = parseInt(this.getAttribute('data-rating'));
                ratingInput.value = currentRating;
                updateStars(currentRating);
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
});