(() => {
    "use strict";
    const slides = [
        { src: "EMJ_logo2026.png", alt: "Eighty's Mind Judgement" },
        { src: "First Meltdown.JPEG", alt: "First Meltdown" },
        { src: "Edge of the Knife.JPEG", alt: "Edge of the Knife" },
        { src: "Heavy Duty.JPEG", alt: "Heavy Duty" },
        { src: "Awakening of Recognition.JPEG", alt: "Awakening of Recognition" },
        { src: "Mighty Souls.JPEG", alt: "Mighty Souls" },
        { src: "Mission of Humanity.JPEG", alt: "Mission of Humanity" },
        { src: "We Become What We See.JPEG", alt: "We Become What We See" },
        { src: "Primal Pulse.JPEG", alt: "Primal Pulse" },
        { src: "Shred Wars.JPEG", alt: "Shred Wars" },
        { src: "Mind Wall Resistance.jpg", alt: "Mind Wall Resistance" },
        { src: "EMJ-logo1.png", alt: "Eighty's Mind Judgement original logo" }
    ];
    const durations = slides.map((_, i) => i === 0 ? 3000 : i === slides.length - 1 ? 2500 : 1500);
    const images = [...document.querySelectorAll(".visions-slide")];
    let index = 0, activeSlot = 0, playing = true, timer = 0, deadline = 0, remaining = durations[0], transitionToken = 0;

    function preload(i) {
        if (i < 0 || i >= slides.length) return;
        const image = new Image();
        image.src = slides[i].src;
    }
    function clearTimer() { window.clearTimeout(timer); timer = 0; }
    function schedule(delay) {
        clearTimer();
        remaining = delay;
        if (!playing || document.hidden) return;
        deadline = performance.now() + delay;
        timer = window.setTimeout(() => {
            timer = 0;
            if (index === slides.length - 1) {
                playing = false;
            } else {
                show(index + 1);
            }
        }, delay);
    }
    function show(target) {
        if (target < 0 || target >= slides.length) return;
        clearTimer();
        const token = ++transitionToken, slot = 1 - activeSlot, image = images[slot];
        const outgoing = images[activeSlot];
        index = target;
        const reveal = () => {
            if (token !== transitionToken) return;
            image.classList.add("is-active");
            outgoing.classList.remove("is-active");
            outgoing.setAttribute("aria-hidden", "true");
            if (outgoing.classList.contains("is-intro")) {
                outgoing.classList.remove("is-intro");
                outgoing.classList.add("is-intro-leaving");
            }
            image.classList.remove("is-intro-leaving");
            if (index === 0) image.classList.add("is-intro");
            else image.classList.remove("is-intro");
            activeSlot = slot;
            image.onload = null;
            image.onerror = null;
            preload(index + 1);
        };
        image.onload = reveal;
        image.onerror = reveal;
        image.alt = slides[index].alt;
        image.removeAttribute("aria-hidden");
        image.src = slides[index].src;
        if (image.complete) reveal();
        schedule(durations[index]);
    }
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && playing && timer) {
            remaining = Math.max(0, deadline - performance.now());
            clearTimer();
        } else if (!document.hidden && playing && !timer) {
            schedule(remaining);
        }
    });
    preload(1);
    schedule(durations[0]);
})();
