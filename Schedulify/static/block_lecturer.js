document.addEventListener('DOMContentLoaded', () => {
    populateTimeDropdowns();
    setupDaySelection();
    setupDateRestrictions(); // Fungsi baharu untuk had tarikh
});

// --- FUNGSI DIKEMASKINI: SEKATAN TARIKH (REAL-TIME & 1 BULAN + 1 MINGGU) ---
function setupDateRestrictions() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    // 1. Dapatkan tarikh hari ini (Real-time)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const minDate = `${yyyy}-${mm}-${dd}`;

    // 2. Kira had 1 bulan + 1 minggu (30 + 7 = 37 hari) ke hadapan
    const maxDateObj = new Date();
    maxDateObj.setDate(today.getDate() + 37); // Tambah 37 hari
    const mY = maxDateObj.getFullYear();
    const mM = String(maxDateObj.getMonth() + 1).padStart(2, '0');
    const mD = String(maxDateObj.getDate()).padStart(2, '0');
    const maxDate = `${mY}-${mM}-${mD}`;

    // Set attribute min dan max pada input date
    startDateInput.setAttribute('min', minDate);
    startDateInput.setAttribute('max', maxDate);
    endDateInput.setAttribute('min', minDate);
    endDateInput.setAttribute('max', maxDate);

    // Pastikan endDate tidak boleh sebelum startDate
    startDateInput.addEventListener('change', () => {
        endDateInput.setAttribute('min', startDateInput.value);
    });
}

// 1. Generate masa dari 8:00 AM hingga 5:30 PM (Kekal Asal)
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

// 2. Logic Pilih Hari (Kekal Asal)
function setupDaySelection() {
    const buttons = document.querySelectorAll('.day-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('selected');
        });
    });
}

// 3. Reset Borang (Kekal Asal)
function resetForm() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('startTime').selectedIndex = 0;
    document.getElementById('endTime').selectedIndex = 0;
    document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('selected'));
}

// 4. Papar Gambar 2 (Confirmation) (Kekal Asal)
function showConfirmation() {
    const startD = document.getElementById('startDate').value;
    const endD = document.getElementById('endDate').value;
    
    if(!startD || !endD) {
        alert("Please choose date.");
        return;
    }

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

// 5. Logic DENGAN SAMBUNGAN DATABASE PENUH (Menggantikan Math.random)
function processBlock() {
    // Kumpul semua data input dari element form
    const startDateVal = document.getElementById('startDate').value;
    const endDateVal = document.getElementById('endDate').value;
    const startTimeVal = document.getElementById('startTime').value;
    const endTimeVal = document.getElementById('endTime').value;
    
    // Tukar butang terpilih menjadi array string, contoh: ['MON', 'THU']
    const selectedDays = Array.from(document.querySelectorAll('.day-btn.selected'))
                              .map(b => b.getAttribute('data-day'));

    const payload = {
        start_date: startDateVal,
        end_date: endDateVal,
        start_time: startTimeVal,
        end_time: endTimeVal,
        repeat_days: selectedDays
    };

    // Hantar data JSON ke backend Flask endpoint API
    fetch('/api/block-slots', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            alert(data.message);
            // Bersihkan borang dan bawa pensyarah ke halaman Manage Blocked Slot (unblock)
            resetForm();
            window.location.href = "/manage-blocked";
        } else if (data.status === 'warning') {
            // Terdapat pertembungan janji temu pelajar, buka kad amaran overlay (Gambar 3)
            document.getElementById('confirm-section').classList.add('hidden');
            document.getElementById('warning-overlay').classList.remove('hidden');
        } else {
            alert("Error logging blocks: " + data.message);
        }
    })
    .catch(error => {
        console.error("Pipeline Sync Error:", error);
        alert("Failed to communicate with database server.");
    });
}

function closeWarning() {
    document.getElementById('warning-overlay').classList.add('hidden');
    hideConfirmation();
}