let currentSlotId = null;

// Fungsi untuk panggil popup (Gambar 2)
function confirmUnblock(slotId) {
    currentSlotId = slotId;
    const slotElement = document.getElementById(slotId);
    
    // Ambil data dari slot yang ditekan untuk dipaparkan dalam modal
    const details = slotElement.querySelectorAll('h3');
    document.getElementById('modalDate').innerText = details[0].innerText;
    document.getElementById('modalTime').innerText = details[1].innerText;
    document.getElementById('modalDays').innerText = details[2].innerText;

    document.getElementById('unblock-overlay').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('unblock-overlay').classList.add('hidden');
    currentSlotId = null;
}

// Fungsi padam slot (Gambar 3 logic)
function executeUnblock() {
    if (currentSlotId) {
        const slotToRemove = document.getElementById(currentSlotId);
        slotToRemove.remove();
        
        closeModal();
        checkEmptyState();
    }
}

// Cek jika semua slot sudah dipadam
function checkEmptyState() {
    const container = document.getElementById('slots-container');
    const emptyState = document.getElementById('empty-state');
    
    // Jika tiada lagi div class slot-item
    if (container.children.length === 0) {
        emptyState.classList.remove('hidden');
    }
}