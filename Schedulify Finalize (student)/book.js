let selectedLecturer = "";
let currentWeekOffset = 0;
let selectedSlotData = {};

// 1. Pilih Lecturer & Tukar ke Page Kalendar (Kekal Asal)
function selectLecturer(name) {
    selectedLecturer = name;
    document.getElementById('display-lecturer-name').innerText = name;
    document.getElementById('step-lecturer').classList.add('hidden');
    document.getElementById('step-calendar').classList.remove('hidden');
    renderCalendar();
}

// 2. Render Tarikh & Slot Masa (Dengan Logik Real-Time & Had 1 Bulan)
function renderCalendar() {
    const daysContainer = document.getElementById('calendar-days');
    const slotsContainer = document.getElementById('time-slots');
    daysContainer.innerHTML = "";
    slotsContainer.innerHTML = "";

    const days = ["MON", "TUE", "WED", "THU", "FRI"];
    
    // --- LOGIK REAL-TIME START DATE ---
    const today = new Date();
    const currentDay = today.getDay();
    // Cari Isnin minggu ini
    const diffToMonday = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1); 
    const startOfCurrentWeek = new Date(new Date().setDate(diffToMonday));
    startOfCurrentWeek.setHours(0, 0, 0, 0);

    const baseDate = new Date(startOfCurrentWeek);
    baseDate.setDate(baseDate.getDate() + (currentWeekOffset * 7));
    // ----------------------------------

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
            if (displayHour === 0) displayHour = 12;
            let timeLabel = `${displayHour}:${min} ${period}`;

            for (let i = 0; i < 5; i++) {
                const date = new Date(baseDate);
                date.setDate(date.getDate() + i);
                
                const slotDateTime = new Date(date);
                slotDateTime.setHours(hour, parseInt(min), 0, 0);
                const now = new Date();

                // Sekatan Tarikh/Masa Lampau
                const isPast = slotDateTime < now;

                let isBooked = Math.random() < 0.15; 
                let statusClass = isBooked ? "booked" : "";
                
                // Tambah visual disabled jika masa sudah lepas
                if (isPast) {
                    statusClass += " disabled-slot";
                }
                
                const dateStrFull = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});

                // Masukkan isPast ke dalam function call untuk elakkan tempahan retroaktif
                slotsContainer.innerHTML += `
                    <div class="slot ${statusClass}" 
                         onclick="openConfirmation('${timeLabel}', '${dateStrFull}', ${isBooked}, ${isPast})"
                         ${isPast ? 'style="opacity: 0.4; cursor: not-allowed;"' : ''}>
                        ${timeLabel}
                    </div>
                `;
            }
        }
    }
}

// 3. Arrow Function (Had Dinamik 1 Bulan)
function changeWeek(direction) {
    const newOffset = currentWeekOffset + direction;
    // Had 0 (minggu semasa) sehingga 4 minggu ke hadapan (sebulan)
    if (newOffset >= 0 && newOffset <= 4) {
        currentWeekOffset = newOffset;
        renderCalendar();
    }
}

// 4. Modal Logic
function openConfirmation(time, date, isBooked, isPast) {
    if (isPast) return; // Abaikan jika klik pada slot lama
    if (isBooked) return alert("This slot is already booked!");
    
    document.getElementById('confirm-name').innerText = selectedLecturer;
    document.getElementById('confirm-date').innerText = "Date: " + date;
    document.getElementById('confirm-time').innerText = "Time: " + time + " - " + calculateEndTime(time);
    
    document.getElementById('modal-confirm').classList.remove('hidden');
}

// Fungsi pengiraan masa tamat (Kekal Asal)
function calculateEndTime(startTime) {
    if (startTime.includes("00")) return startTime.replace("00", "30");
    let parts = startTime.split(":");
    let h = parseInt(parts[0]);
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