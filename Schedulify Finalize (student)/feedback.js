  function resetForm() {
            // Reset radio buttons
            const radios = document.getElementsByName('rating');
            radios.forEach(radio => radio.checked = false);
            // Reset textarea
            document.getElementById('feedback-text').value = '';
        }

        function showSuccess() {
            document.getElementById('feedback-form-container').style.display = 'none';
            document.getElementById('success-container').style.display = 'block';
        }