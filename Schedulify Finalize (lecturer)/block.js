document.addEventListener('DOMContentLoaded', () => {
    populateTimeDropdowns();
    setupDaySelection();
});

// 1. Generate masa dari 8:00 AM hingga 5:30 PM (selang 30 min)
function populateTimeDropdowns() {
    const startSelect = document.getElementById('startTime');
    const endSelect = document.getElementById('endTime');
    const times = [];
    
    let hour = 8;
    let min = 0;

    while (hour < 18 || (hour === 18 && min <= 0)) {
        let period = hour >= 12 ? 'PM' : 'AM';
        let displayHour = hour > 12 ? hour - 12 : hour;
        let timeStr = `${displayHour}:${min === 0 ? '00' : '30'} ${period}`;
        times.push(timeStr);

        if (min === 30) {
            hour++;
            min = 0;
        } else {
            min = 30;
        }
    }

    times.forEach(t => {
        startSelect.add(new Option(t, t));
        endSelect.add(new Option(t, t));
    });
}

// 2. Logic Pilih Hari
function setupDaySelection() {
    const buttons = document.querySelectorAll('.day-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('selected');
        });
    });
}

// 3. Reset Borang (Cancel Gambar 1)
function resetForm() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('startTime').selectedIndex = 0;
    document.getElementById('endTime').selectedIndex = 0;
    document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('selected'));
}

// 4. Papar Gambar 2 (Confirmation)
function showConfirmation() {
    const startD = document.getElementById('startDate').value;
    const endD = document.getElementById('endDate').value;
    
    if(!startD || !endD) {
        alert("Please choose date.");
        return;
    }

    // Ambil hari yang dipilih
    const selectedDays = Array.from(document.querySelectorAll('.day-btn.selected'))
                              .map(b => b.getAttribute('data-day'));
    
    document.getElementById('displayDates').innerText = `${startD} - ${endD}`;
    document.getElementById('displayTimes').innerText = `${document.getElementById('startTime').value} - ${document.getElementById('endTime').value}`;
    document.getElementById('displayDays').innerText = selectedDays.length > 0 ? selectedDays.join(', ') : 'ALL DAYS';

    document.getElementById('block-form-section').classList.add('hidden');
    document.getElementById('confirm-section').classList.remove('hidden');
}

function hideConfirmation() {
    document.getElementById('confirm-section').classList.add('hidden');
    document.getElementById('block-form-section').classList.remove('hidden');
}

// 5. Logic Simulasi Gambar 3 & 4
function processBlock() {
    // Simulasi: 50% kemungkinan ada slot bertindih (Warning) atau berjaya (Unblock page)
    const hasConflict = Math.random() > 0.5;

    if (hasConflict) {
        document.getElementById('warning-overlay').classList.remove('hidden');
    } else {
        // Jika berjaya, pergi ke unblock.html (Gambar 4)
        location.href = 'unblock.html';
    }
}

function closeWarning() {
    document.getElementById('warning-overlay').classList.add('hidden');
    hideConfirmation();
}