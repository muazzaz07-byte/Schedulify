// Fungsi untuk tukar page (Single Page Application logic)
        function showPage(pageId) {
            // Sembunyikan semua page
            const pages = document.querySelectorAll('.page');
            pages.forEach(page => page.classList.remove('active-page'));
            
            // Tunjukkan page yang diminta
            document.getElementById(pageId).classList.add('active-page');
            
            // Scroll ke atas balik bila tukar page
            window.scrollTo(0, 0);
        }

        // Fungsi untuk buka/tutup FAQ
        function toggleFaq(element) {
            const item = element.parentElement;
            item.classList.toggle('active');
            
            // Tukar icon arrow
            const span = element.querySelector('span');
            if (item.classList.contains('active')) {
                span.innerText = '^';
            } else {
                span.innerText = 'v';
            }
        }