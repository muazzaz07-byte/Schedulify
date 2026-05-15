function resetForm() {
    // 1. Reset radio buttons
    const radios = document.getElementsByName('rating');
    radios.forEach(radio => radio.checked = false);

    // 2. Reset textarea
    const feedbackText = document.getElementById('feedback-text');
    if (feedbackText) {
        feedbackText.value = '';
    }
}

function showSuccess() {
    // 1. Hide the form container
    const formContainer = document.getElementById('feedback-form-container');
    if (formContainer) {
        formContainer.style.display = 'none';
    }

    // 2. Show the success message container
    const successContainer = document.getElementById('success-container');
    if (successContainer) {
        successContainer.style.display = 'block';
    }
}