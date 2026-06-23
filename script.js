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


// Interactive 3D tilt effect on the card element
const card = document.getElementById('interactiveCard');

if (card) {
    document.addEventListener('mousemove', (e) => {
        const xAxis = (window.innerWidth / 2 - e.pageX) / 30;
        const yAxis = (window.innerHeight / 2 - e.pageY) / 30;
        
        // Tilt execution
        card.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    });

    // Reset position when mouse leaves window focus
    document.addEventListener('mouseleave', () => {
        card.style.transform = `rotateY(0deg) rotateX(0deg)`;
        card.style.transition = 'transform 0.5s ease';
    });
    
    document.addEventListener('mouseenter', () => {
        card.style.transition = 'none';
    });
}

const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});