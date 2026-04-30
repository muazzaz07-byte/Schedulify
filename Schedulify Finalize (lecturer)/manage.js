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
    const baseDate = new Date(2026, 3, 13); // Start 13 April 2026
    baseDate.setDate(baseDate.getDate() + (currentWeekOffset * 7));

    // 1. Render Header
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

    // 2. Render Slots (8:00 AM - 6:00 PM)
    for (let hour = 8; hour < 18; hour++) {
        for (let min of ["00", "30"]) {
            let period = hour >= 12 ? "PM" : "AM";
            let displayHour = hour > 12 ? hour - 12 : hour;
            if (displayHour === 0) displayHour = 12;
            let timeLabel = `${displayHour}:${min} ${period}`;

            for (let i = 0; i < 5; i++) {
                // Simulasi data booked (Warna Merah) vs Available (Kelabu)
                let isBooked = Math.random() < 0.2; 
                let statusClass = isBooked ? "booked" : "available";
                
                const date = new Date(baseDate);
                date.setDate(date.getDate() + i);
                const dateStr = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});

                let onClickAttr = isBooked ? `onclick="openCancelFlow('${timeLabel}', '${dateStr}')"` : "";

                slotsContainer.innerHTML += `
                    <div class="slot ${statusClass}" ${onClickAttr}>
                        ${timeLabel}
                    </div>
                `;
            }
        }
    }
}

// Modal Flow Logic
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

function changeWeek(direction) {
    currentWeekOffset += direction;
    renderCalendar();
}