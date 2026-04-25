let currentWeekOffset = 0;
let pendingAction = ""; // 'block' atau 'available'

function renderCalendar() {
    const daysContainer = document.getElementById('calendar-days');
    const slotsContainer = document.getElementById('time-slots');
    daysContainer.innerHTML = "";
    slotsContainer.innerHTML = "";

    const days = ["MON", "TUE", "WED", "THU", "FRI"];
    const baseDate = new Date(2026, 3, 13);
    baseDate.setDate(baseDate.getDate() + (currentWeekOffset * 7));

    days.forEach((day, index) => {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + index);
        const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        daysContainer.innerHTML += `<div class="day-col"><h4>${day}</h4><span>${dateStr}</span></div>`;
    });

    for (let hour = 8; hour < 18; hour++) {
        for (let min of ["00", "30"]) {
            let period = hour >= 12 ? "PM" : "AM";
            let displayHour = hour > 12 ? hour - 12 : hour;
            let timeLabel = `${displayHour}:${min} ${period}`;

            for (let i = 0; i < 5; i++) {
                const date = new Date(baseDate);
                date.setDate(date.getDate() + i);
                const dateFull = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
                
                // Simulasi: Beberapa slot merah (booked)
                // Simulasi: 15% peluang untuk setiap slot jadi merah (booked)
                let isBooked = Math.random() < 0.15; 
                let statusClass = isBooked ? "booked" : "";

                slotsContainer.innerHTML += `
                    <div class="slot ${statusClass}" onclick="handleSlotClick('${timeLabel}', '${dateFull}', ${isBooked})">
                        ${timeLabel}
                    </div>`;
            }
        }
    }
}

function handleSlotClick(time, date, isBooked) {
    if (isBooked) {
        // Aliran B: Cancel Appointment (Gambar 4)
        document.getElementById('cancel-date').innerText = "Date: " + date;
        document.getElementById('cancel-time').innerText = "Time: " + time + " - " + calculateEndTime(time);
        document.getElementById('modal-cancel-init').classList.remove('hidden');
    } else {
        // Aliran A: Block Slot (Gambar 2)
        document.getElementById('block-date').innerText = "Date: " + date;
        document.getElementById('block-time').innerText = "Time: " + time + " - " + calculateEndTime(time);
        document.getElementById('modal-block-init').classList.remove('hidden');
    }
}

// Navigation Logic
function openReasonForm() {
    closeAllModals();
    document.getElementById('modal-reason').classList.remove('hidden');
}

function openPostCancelOptions() {
    closeAllModals();
    document.getElementById('modal-post-cancel').classList.remove('hidden');
}

function openConfirmationAction(action) {
    pendingAction = action;
    closeAllModals();
    document.getElementById('modal-final-confirm').classList.remove('hidden');
}

function finishAction() {
    alert("System updated: Slot is now " + pendingAction);
    closeAllModals();
    renderCalendar(); // Refresh UI
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

function calculateEndTime(t) {
    if (t.includes("00")) return t.replace("00", "30");
    let parts = t.split(":");
    let hr = parseInt(parts[0]);
    let ampm = parts[1].split(" ")[1];
    if (hr == 11 && ampm == "AM") return "12:00 PM";
    if (hr == 12) return "1:00 PM";
    return (hr + 1) + ":00 " + ampm;
}

function changeWeek(dir) { currentWeekOffset += dir; renderCalendar(); }

window.onload = renderCalendar;