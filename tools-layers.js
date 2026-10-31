(() => {
    const tabs = document.querySelector('.tools-page .tools-tabs');
    if (!tabs) return;
    const buttons = [...tabs.querySelectorAll('[role="tab"]')];
    const panels = buttons.map(button => document.getElementById(button.getAttribute('aria-controls')));
    let current = Math.max(0, panels.findIndex(panel => `#${panel.id}` === location.hash || [...panel.querySelectorAll('[id]')].some(node => `#${node.id}` === location.hash)));
    function select(index) {
        panels.forEach((panel, i) => {
            if (i !== index && panel.contains(document.activeElement)) buttons[index].focus();
            panel.hidden = i !== index;
            panel.inert = i !== index;
            buttons[i].setAttribute('aria-selected', String(i === index));
            buttons[i].tabIndex = i === index ? 0 : -1;
        });
        current = index;
    }
    panels.forEach((panel, i) => {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', buttons[i].id);
        panel.tabIndex = 0;
    });
    buttons.forEach((button, i) => {
        button.addEventListener('click', () => select(i));
        button.addEventListener('keydown', event => {
            const destinations = { ArrowRight: (i + 1) % buttons.length, ArrowLeft: (i + buttons.length - 1) % buttons.length, Home: 0, End: buttons.length - 1 };
            if (!(event.key in destinations)) return;
            event.preventDefault();
            const next = destinations[event.key];
            buttons[next].focus();
            select(next);
        });
    });
    window.addEventListener('hashchange', () => {
        const index = panels.findIndex(panel => `#${panel.id}` === location.hash || [...panel.querySelectorAll('[id]')].some(node => `#${node.id}` === location.hash));
        if (index >= 0) select(index);
    });
    select(current);
    tabs.hidden = false;
})();
