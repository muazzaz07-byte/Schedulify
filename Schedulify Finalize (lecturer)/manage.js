let currentWeekOffset = 0;

// Auto run bila page buka
window.onload = function() {
    renderCalendar();
};

function renderCalendar() {
    const daysContainer = document.getElementById('calendar-days');
    const slotsContainer = document.getElementById('time-slots');
    daysContainer.innerHTML = "";
    slotsContainer.innerHTML = "";

    const days = ["MON", "TUE", "WED", "THU", "FRI"];
    
    // 1. Dapatkan tarikh real-time hari ini
    const today = new Date();
    const currentDay = today.getDay();
    
    // 2. Cari hari Isnin minggu ini sebagai titik mula
    const diffToMonday = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1); 
    const startOfCurrentWeek = new Date(new Date().setDate(diffToMonday));
    startOfCurrentWeek.setHours(0, 0, 0, 0);

    // 3. Kira tarikh berdasarkan offset minggu sekarang
    const baseDate = new Date(startOfCurrentWeek);
    baseDate.setDate(baseDate.getDate() + (currentWeekOffset * 7));

    // Render Header
    days.forEach((day, index) => {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + index);
        const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        
        daysContainer.innerHTML += `
            <div class="day-col">
                <h4>${day}</h4>
                <span>${dateStr}</span>
            </div>
        `;
    });

    // Render Slots (8:00 AM - 6:00 PM)
    for (let hour = 8; hour < 18; hour++) {
        for (let min of ["00", "30"]) {
            let period = hour >= 12 ? "PM" : "AM";
            let displayHour = hour > 12 ? hour - 12 : hour;
            if (displayHour === 0) displayHour = 12;
            let timeLabel = `${displayHour}:${min} ${period}`;

            for (let i = 0; i < 5; i++) {
                const date = new Date(baseDate);
                date.setDate(date.getDate() + i);
                
                const slotDateTime = new Date(date);
                slotDateTime.setHours(hour, parseInt(min), 0, 0);
                const now = new Date();

                // Sekatan Tarikh Lampau
                const isPast = slotDateTime < now;

                // --- LOGIK BARU: STATUS SLOT ---
                let rand = Math.random();
                let isBooked = rand < 0.15; 
                let isBlocked = rand >= 0.15 && rand < 0.25; // Tambah 10% peluang slot blocked
                
                let statusClass = "available";
                if (isBooked) statusClass = "booked";
                else if (isBlocked) statusClass = "blocked"; // Class baru untuk blocked
                
                if (isPast) {
                    statusClass += " disabled-slot";
                }

                const dateStrFull = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});

                // --- LOGIK ONCLICK ---
                let onClickAttr = "";
                if (!isPast) {
                    if (isBooked) {
                        onClickAttr = `onclick="openCancelFlow('${timeLabel}', '${dateStrFull}')"`;
                    } else if (isBlocked) {
                        onClickAttr = `onclick="alert('This slot is blocked by you!')"`;
                    }
                }

                slotsContainer.innerHTML += `
                    <div class="slot ${statusClass}" ${onClickAttr} ${isPast ? 'style="opacity: 0.4; cursor: not-allowed;"' : ''}>
                        ${timeLabel}
                    </div>
                `;
            }
        }
    }
}

// Navigasi Dinamik (Had 4 Minggu / 1 Bulan)
function changeWeek(direction) {
    const newOffset = currentWeekOffset + direction;
    if (newOffset >= 0 && newOffset <= 4) {
        currentWeekOffset = newOffset;
        renderCalendar();
    }
}

// --- FUNGSI MODAL ASAL (KEKAL) ---
function openCancelFlow(time, date) {
    document.getElementById('cancel-date').innerText = "Date: " + date;
    document.getElementById('cancel-time').innerText = "Time: " + time;
    document.getElementById('modal-cancel').classList.remove('hidden');
}

function openReasonModal() {
    hideAllModals();
    document.getElementById('modal-reason').classList.remove('hidden');
}

function openChoiceModal() {
    hideAllModals();
    document.getElementById('modal-choice').classList.remove('hidden');
}

function openFinalConfirm() {
    hideAllModals();
    document.getElementById('modal-final').classList.remove('hidden');
}

function showSuccess() {
    hideAllModals();
    document.getElementById('modal-success').classList.remove('hidden');
}

function hideAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(m => m.classList.add('hidden'));
}

function closeAllModals() {
    hideAllModals();
}