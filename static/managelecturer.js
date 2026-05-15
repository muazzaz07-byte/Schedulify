let currentWeekOffset = 0;
let currentAction = "";
let selectedDate = "";
let selectedTime = "";

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

    const slotDefs = [];

    for (let hour = 8; hour < 18; hour++) {
        for (let min of ["00", "30"]) {
            let period = hour >= 12 ? "PM" : "AM";
            let displayHour = hour > 12 ? hour - 12 : hour;
            let timeLabel = `${displayHour}:${min} ${period}`;

            for (let i = 0; i < 5; i++) {
                const date = new Date(baseDate);
                date.setDate(date.getDate() + i);
                const dateFull = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
                const slotKey = `${dateFull}|${timeLabel}`;

                slotDefs.push({ timeLabel, dateFull, slotKey });
            }
        }
    }

    const lecturerName = window.lecturerName || "";

    fetch(`booked_slot.php?lecturer=${encodeURIComponent(lecturerName)}`)
        .then(response => response.json())
        .then(bookedData => {
            slotDefs.forEach(slot => {
                const appointment = bookedData.find(a => a.key === slot.slotKey);
                let statusClass = "";
                let clickHandler = () => openBlockModal(slot.timeLabel, slot.dateFull);

                if (appointment) {
                    if (appointment.status === 'Confirmed') {
                        statusClass = "booked";
                        clickHandler = () => openCancelModal(slot.timeLabel, slot.dateFull, appointment.student);
                    } else if (appointment.status === 'Blocked') {
                        statusClass = "blocked";
                        clickHandler = () => openUnblockModal(slot.timeLabel, slot.dateFull);
                    }
                }

                const slotEl = document.createElement('div');
                slotEl.className = `slot ${statusClass}`;
                slotEl.textContent = slot.timeLabel;
                slotEl.addEventListener('click', clickHandler);
                slotsContainer.appendChild(slotEl);
            });
        })
        .catch(error => {
            console.error('Error loading booked slots', error);
            slotDefs.forEach(slot => {
                const slotEl = document.createElement('div');
                slotEl.className = 'slot';
                slotEl.textContent = slot.timeLabel;
                slotEl.addEventListener('click', () => openBlockModal(slot.timeLabel, slot.dateFull));
                slotsContainer.appendChild(slotEl);
            });
        });
}

function handleSlotClick(time, date, isBooked) {
    selectedDate = date;
    selectedTime = time;

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

function openBlockModal(time, date) {
    handleSlotClick(time, date, false);
}

function openCancelModal(time, date, student) {
    selectedDate = date;
    selectedTime = time;
    document.getElementById('cancel-date').innerText = "Date: " + date;
    document.getElementById('cancel-time').innerText = "Time: " + time + " - " + calculateEndTime(time);
    const studentEl = document.getElementById('cancel-student');
    if (studentEl) studentEl.innerText = "Student: " + student;
    document.getElementById('modal-cancel-init').classList.remove('hidden');
}

function openUnblockModal(time, date) {
    selectedDate = date;
    selectedTime = time;
    openConfirmationAction('Unblock');
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
    currentAction = action;
    document.getElementById('modal-final-confirm').classList.remove('hidden');
}

function finishAction() {
    const reasonText = document.querySelector('#modal-reason textarea').value;
    
    const formData = new FormData();
    formData.append('action', currentAction);
    formData.append('date', selectedDate);
    formData.append('time', selectedTime);
    formData.append('reason', reasonText);

    fetch('manage_action.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        if (data.trim() === "success") {
            location.reload(); // Refresh to see the new status on the calendar
        } else {
            alert("Error: " + data);
        }
    });
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