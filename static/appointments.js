function openModal(type) {
            const modal = document.getElementById('reasonModal');
            const statusSpan = document.getElementById('modalStatus');
            const reasonText = document.getElementById('reasonText');

            if (type === 'user') {
                statusSpan.innerHTML = 'Status: <span class="text-red">Cancelled</span> by You';
                reasonText.innerText = "I am sorry, Sir. I am feeling unwell today and will not be able to attend our session. I will reschedule soon.";
            } else {
                statusSpan.innerHTML = 'Status: <span class="text-red">Cancelled</span> by Lecturer';
                reasonText.innerText = "My apologies, I am currently outstation for official university business. Please pick another slot next week.";
            }
            modal.style.display = "flex";
        }

        function closeModal() {
            document.getElementById('reasonModal').style.display = "none";
        }