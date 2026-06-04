let currentWeekOffset = 0;
let selectedLecturerName = '';
let selectedDateString = '';
let selectedTimeString = '';
let bookedSlotsList = [];
let blockedSlotsList = []; // NEW: Tracks lecturer-blocked slots separately
let studentChancesLeft = 5; // Tracks the remaining weekly quota limit

function selectLecturer(buttonElement) {
    if (!buttonElement || typeof buttonElement.getAttribute !== 'function') return;

    selectedLecturerName = buttonElement.getAttribute('data-name') || 'Unknown Lecturer';
    const lecturerOffice = buttonElement.getAttribute('data-office') || 'No office assigned';
    
    document.getElementById('display-lecturer-name').innerText = selectedLecturerName;
    document.getElementById('display-lecturer-office').innerText = lecturerOffice;
    
    document.getElementById('step-lecturer').classList.add('hidden');
    document.getElementById('step-calendar').classList.remove('hidden');
    
    history.pushState({ view: 'calendar' }, '');
    currentWeekOffset = 0;

    fetchBookedData();
}

// FETCH LOGIC: Updated to unpack separate booked and blocked lists from the database API packet
function fetchBookedData() {
    Promise.all([
        fetch(`/api/get-booked-slots?lecturer_name=${encodeURIComponent(selectedLecturerName)}`).then(res => res.json()),
        fetch('/api/get-weekly-chances').then(res => res.json())
    ])
    .then(([slotsData, chancesData]) => {
        // FIXED: Extract split collections accurately from dictionary keys
        bookedSlotsList = slotsData.booked || [];
        blockedSlotsList = slotsData.blocked || [];
        studentChancesLeft = chancesData.chances_left; // Store live chances balance

        // Dynamic Top-Right Badge UI Control
        const countDisplay = document.getElementById('chances-count-holder');
        if (countDisplay) {
            countDisplay.innerText = studentChancesLeft;
            
            const badge = document.getElementById('weekly-chances-badge');
            if (studentChancesLeft === 0) {
                badge.style.borderColor = '#fca5a5';
                badge.style.background = '#fef2f2';
                countDisplay.style.color = '#ef4444';
            } else {
                badge.style.borderColor = '#e2e8f0';
                badge.style.background = 'white';
                countDisplay.style.color = '#004aad';
            }
        }

        renderCalendar(); 
    })
    .catch(err => console.error("Error synchronizing booking pipeline data packet profiles:", err));
}

function renderCalendar() {
    const daysContainer = document.getElementById('calendar-days');
    const slotsContainer = document.getElementById('time-slots');
    
    if (!daysContainer || !slotsContainer) return;
    
    daysContainer.innerHTML = '';
    slotsContainer.innerHTML = '';
    
    const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
    
    let today = new Date();
    let currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1) + (currentWeekOffset * 7));
    
    // Render Day Column Header Blocks
    daysOfWeek.forEach((day, index) => {
        let targetDate = new Date(currentMonday);
        targetDate.setDate(currentMonday.getDate() + index);
        
        let dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.innerHTML = `
            <div style="font-weight: bold; color: #4a5568;">${day}</div>
            <div style="font-size: 0.9rem; color: #718096; margin-top: 4px;">${targetDate.getDate()}/${targetDate.getMonth() + 1}</div>
        `;
        daysContainer.appendChild(dayHeader);
    });
    
    // Render Matching 30-Minute Interval Time Grid Slots Matrix (8:00 AM - 6:00 PM)
    for (let hour = 8; hour < 18; hour++) {
        for (let min of ["00", "30"]) {
            let period = hour >= 12 ? "PM" : "AM";
            let displayHour = hour > 12 ? hour - 12 : hour;
            if (displayHour === 0) displayHour = 12; 
            let timeLabel = `${displayHour}:${min} ${period}`;

            daysOfWeek.forEach((day, dayIndex) => {
                let targetDate = new Date(currentMonday);
                targetDate.setDate(currentMonday.getDate() + dayIndex);
                
                let dateString = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
                
                let slotButton = document.createElement('button');
                slotButton.innerText = timeLabel;

                let slotDateTime = new Date(targetDate);
                slotDateTime.setHours(hour, parseInt(min), 0, 0);

                let isoStringCompare = `${dateString}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
                let now = new Date();

                // CONDITION 1: PAST SLOTS
                if (slotDateTime < now) {
                    slotButton.className = 'time-slot-btn unavailable';
                    slotButton.disabled = true;
                    slotButton.style.cursor = 'not-allowed';
                } 
                // CONDITION 2: FIXED LECTURER-BLOCKED SLOTS (APPEARS ORANGE)
                else if (blockedSlotsList.includes(isoStringCompare)) {
                    slotButton.className = 'time-slot-btn blocked-orange-state';
                    slotButton.style.backgroundColor = '#ff9800'; // Orange accent override
                    slotButton.style.color = 'white';
                    slotButton.style.cursor = 'not-allowed';
                    slotButton.disabled = true;
                    slotButton.innerText = "Unavailable";
                } 
                // CONDITION 3: CONFIRMED STUDENT-BOOKED SLOTS (APPEARS RED)
                else if (bookedSlotsList.includes(isoStringCompare)) {
                    slotButton.className = 'time-slot-btn booked';
                    slotButton.disabled = true;
                    slotButton.style.cursor = 'not-allowed';
                } 
                // CONDITION 4: OPEN AVAILABLE SLOTS
                else {
                    slotButton.className = 'time-slot-btn';
                    
                    // IF QUOTA REACHED: Restrict button click flow
                    if (studentChancesLeft <= 0) {
                        slotButton.style.opacity = '0.5';
                        slotButton.onclick = () => {
                            alert("Limit Reached! You have used all 5 appointment chances for this week. Please cancel an existing appointment to book a new one.");
                        };
                    } else {
                        slotButton.onclick = () => {
                            openConfirmationModal(selectedLecturerName, dateString, timeLabel);
                        };
                    }
                }
                
                slotsContainer.appendChild(slotButton);
            });
        }
    }
}

function changeWeek(direction) {
    const newOffset = currentWeekOffset + direction;
    if (newOffset >= 0 && newOffset <= 4) {
        currentWeekOffset = newOffset;
        fetchBookedData(); 
    }
}

function openConfirmationModal(name, date, time) {
    selectedLecturerName = name;
    selectedDateString = date;
    selectedTimeString = time;
    
    const currentOfficeText = document.getElementById('display-lecturer-office').innerText;
    
    document.getElementById('confirm-name').innerText = name;
    document.getElementById('confirm-date').innerText = `Date: ${date}`;
    document.getElementById('confirm-time').innerText = `Time: ${time}`;
    document.getElementById('confirm-office').innerText = currentOfficeText;
    
    document.getElementById('modal-confirm').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-confirm').classList.add('hidden');
}

function showSuccess() {
    const payload = {
        lecturer_name: selectedLecturerName,
        date: selectedDateString,
        time: selectedTimeString
    };

    fetch('/api/book-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            document.getElementById('modal-confirm').classList.add('hidden');
            document.getElementById('modal-success').classList.remove('hidden');
            fetchBookedData(); // Instantly update top-right limit badge metrics asynchronously!
        } else {
            alert("Booking Failed: " + data.message);
        }
    })
    .catch(error => {
        console.error("Transmission Error:", error);
        alert("System connection error. Please try again.");
    });
}

// Global window layout back navigation management popstate listener logic
window.addEventListener('popstate', (event) => {
    const stepLecturer = document.getElementById('step-lecturer');
    const stepCalendar = document.getElementById('step-calendar');
    
    if (stepLecturer && stepCalendar) {
        stepCalendar.classList.add('hidden');
        stepLecturer.classList.remove('hidden');
        if (typeof closeModal === "function") { closeModal(); }
    }
});