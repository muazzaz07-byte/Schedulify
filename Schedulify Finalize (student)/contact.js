// Fungsi panggil Pop-up 1 (Confirmation)
function showConfirmation() {
    document.getElementById('confirmModal').classList.add('active');
}

// Fungsi tutup Modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Fungsi bila user klik "Yes"
function submitFormToEmail() {
    // Ambil data input
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const mobileNo = document.getElementById('mobileNo').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    // Membuka email client (Mailto) secara automatik ke schedulify@gmail.com
    const subject = encodeURIComponent(`Schedulify Contact Form dari ${firstName} ${lastName}`);
    const bodyText = encodeURIComponent(`Nama: ${firstName} ${lastName}\nNo Telefon: ${mobileNo}\nEmail: ${email}\n\nMesej:\n${message}`);
    
    // Trigger mailto link
    window.location.href = `mailto:schedulify@gmail.com?subject=${subject}&body=${bodyText}`;

    // Tutup pop-up confirmation dan buka pop-up Thank You
    closeModal('confirmModal');
    document.getElementById('thankYouModal').classList.add('active');

    // Reset borang
    document.getElementById('contactForm').reset();
}