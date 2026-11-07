(() => {
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const machines = document.querySelectorAll('.games-machine-grid .arcade-machine');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.remove('machine-enter-pending');
            observer.unobserve(entry.target);
        });
    }, { rootMargin: '0px 0px -24px 0px', threshold: 0.08 });

    machines.forEach((machine) => {
        machine.classList.add('machine-enter-pending');
        observer.observe(machine);
    });
})();
