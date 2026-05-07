function showPage(pageId) {
    // Hide all elements with the class "page"
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active-page');
    });

    // Show the target page
    const target = document.getElementById(pageId);
    if (target) {
        target.style.display = 'block';
        target.classList.add('active-page');
        window.scrollTo(0, 0);
    } else {
        console.error("Page ID not found: " + pageId);
    }
}