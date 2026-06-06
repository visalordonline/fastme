document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();

        // 1. Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        
        // 2. Add active class to clicked item
        this.classList.add('active');

        // 3. Hide all pages
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

        // 4. Show the target page
        const targetId = this.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
});