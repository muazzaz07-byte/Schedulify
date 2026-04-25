let selectedLecturer = "";
let currentWeekOffset = 0;
let selectedSlotData = {};

// 1. Pilih Lecturer & Tukar ke Page Kalendar
function selectLecturer(name) {
    selectedLecturer = name;
    document.getElementById('display-lecturer-name').innerText = name;
    document.getElementById('step-lecturer').classList.add('hidden');
    document.getElementById('step-calendar').classList.remove('hidden');
    renderCalendar();
}

// 2. Render Tarikh & Slot Masa (8:00 AM - 6:00 PM)
function renderCalendar() {
    const daysContainer = document.getElementById('calendar-days');
    const slotsContainer = document.getElementById('time-slots');
    daysContainer.innerHTML = "";
    slotsContainer.innerHTML = "";

    const days = ["MON", "TUE", "WED", "THU", "FRI"];
    const baseDate = new Date(2026, 3, 13); // Start Monday 13/04/2026
    baseDate.setDate(baseDate.getDate() + (currentWeekOffset * 7));

    // Render Header Tarikh
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

    // Render Masa 8:00 AM - 6:00 PM (setiap 30 minit)
    for (let hour = 8; hour < 18; hour++) {
        for (let min of ["00", "30"]) {
            let period = hour >= 12 ? "PM" : "AM";
            let displayHour = hour > 12 ? hour - 12 : hour;
            let timeLabel = `${displayHour}:${min} ${period}`;

            for (let i = 0; i < 5; i++) {
                // Simulasi 'Booked' secara random (Warna Merah)
                let isBooked = Math.random() < 0.15; 
                let statusClass = isBooked ? "booked" : "";
                
                const date = new Date(baseDate);
                date.setDate(date.getDate() + i);
                const dateStr = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});

                slotsContainer.innerHTML += `
                    <div class="slot ${statusClass}" onclick="openConfirmation('${timeLabel}', '${dateStr}', ${isBooked})">
                        ${timeLabel}
                    </div>
                `;
            }
        }
    }
}

// 3. Arrow Function
function changeWeek(direction) {
    currentWeekOffset += direction;
    renderCalendar();
}

// 4. Modal Logic
function openConfirmation(time, date, isBooked) {
    if (isBooked) return alert("This slot is already booked!");
    
    document.getElementById('confirm-name').innerText = selectedLecturer;
    document.getElementById('confirm-date').innerText = "Date: " + date;
    document.getElementById('confirm-time').innerText = "Time: " + time + " - " + calculateEndTime(time);
    
    document.getElementById('modal-confirm').classList.remove('hidden');
}

function calculateEndTime(startTime) {
    // Simple logic tambah 30 minit untuk display
    if (startTime.includes("00")) return startTime.replace("00", "30");
    let h = parseInt(startTime.split(":")[0]);
    let p = startTime.split(" ")[1];
    if (h === 11 && p === "AM") return "12:00 PM";
    if (h === 12) return "1:00 PM";
    return (h + 1) + ":00 " + p;
}

function closeModal() {
    document.getElementById('modal-confirm').classList.add('hidden');
}

function showSuccess() {
    document.getElementById('modal-confirm').classList.add('hidden');
    document.getElementById('modal-success').classList.remove('hidden');
}