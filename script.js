const header = document.querySelector('.header');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.navigation');

const setMenuOpen = (open) => {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    navigation.classList.toggle('is-open', open);
    if (open && window.gsap && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
        gsap.from(navigation.children, { y: -8, autoAlpha: 0, duration: 0.3, stagger: 0.03, ease: 'power2.out', clearProps: 'all' });
    }
};

menuButton.addEventListener('click', () => setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true'));
navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenuOpen(false);
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
        setMenuOpen(false);
        menuButton.focus();
    }
});

const updateHeader = () => header.classList.toggle('is-stuck', window.scrollY > 8);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

document.querySelector('#year').textContent = String(new Date().getFullYear());

// Marca no menu a seção que está no centro da tela.
const navigationLinks = [...navigation.querySelectorAll('a[href*="#"]')];
const setCurrentLink = (hash) => {
    navigationLinks.forEach((link) => {
        if (link.hash === hash) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
    });
};

// Depois de um clique, o link escolhido prevalece enquanto a rolagem suave acontece.
let clickedAt = 0;
const followsScroll = () => Date.now() - clickedAt > 1000;
navigationLinks.forEach((link) => {
    link.addEventListener('click', () => {
        clickedAt = Date.now();
        setCurrentLink(link.hash);
    });
});

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting && followsScroll()) setCurrentLink(`#${entry.target.dataset.nav}`);
    });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('[data-nav]').forEach((section) => sectionObserver.observe(section));

// Ao chegar de outra página por um link como index.html#faq, a seção indicada prevalece.
if (navigationLinks.some((link) => link.hash === window.location.hash) && document.querySelector(window.location.hash)) {
    clickedAt = Date.now();
    setCurrentLink(window.location.hash);
}

// A última seção é baixa e pode nunca alcançar o centro da tela.
window.addEventListener('scroll', () => {
    const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atEnd && followsScroll() && document.querySelector('#valores')) setCurrentLink('#valores');
}, { passive: true });

const prefersMotion = '(prefers-reduced-motion: no-preference)';
const reducedMotion = () => !window.matchMedia(prefersMotion).matches;
const canAnimate = () => Boolean(window.gsap) && !reducedMotion();

// O FAQ abre e fecha com altura animada; sem GSAP, o <details> segue o comportamento nativo.
document.querySelectorAll('.faq details').forEach((details) => {
    const answer = details.querySelector('p');
    details.querySelector('summary').addEventListener('click', (event) => {
        if (!canAnimate()) return;
        event.preventDefault();
        gsap.killTweensOf(answer);
        if (details.open) {
            gsap.to(answer, {
                height: 0,
                paddingBottom: 0,
                autoAlpha: 0,
                overflow: 'hidden',
                duration: 0.25,
                ease: 'power2.inOut',
                onComplete: () => {
                    details.open = false;
                    gsap.set(answer, { clearProps: 'all' });
                },
            });
            return;
        }
        details.open = true;
        gsap.from(answer, {
            height: 0,
            paddingBottom: 0,
            autoAlpha: 0,
            overflow: 'hidden',
            duration: 0.3,
            ease: 'power2.out',
            clearProps: 'all',
        });
    });
});

if (window.gsap) {
    gsap.registerPlugin(ScrollTrigger);
    // O mesmo script atende às três páginas; nem todo seletor existe em cada uma.
    gsap.config({ nullTargetWarn: false });

    gsap.matchMedia().add(prefersMotion, () => {
        // A página inicial é estática de propósito: nada entra em cena.
        if (document.body.hasAttribute('data-calm')) return undefined;

        // clearProps devolve o controle ao CSS, de onde vêm os estados de hover.
        const reveal = { y: 24, autoAlpha: 0, duration: 0.7, ease: 'power3.out', clearProps: 'all' };
        const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        const cleanups = [];

        // Títulos sobem palavra por palavra, de dentro de uma máscara.
        const splitWords = (element) => {
            [...element.childNodes].forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.tagName !== 'BR') splitWords(node);
                    return;
                }
                const fragment = document.createDocumentFragment();
                node.textContent.split(/(\s+)/).filter(Boolean).forEach((part) => {
                    if (/^\s+$/.test(part)) {
                        fragment.append(' ');
                        return;
                    }
                    const word = document.createElement('span');
                    const inner = document.createElement('span');
                    word.className = 'word';
                    inner.className = 'word-inner';
                    inner.textContent = part;
                    word.append(inner);
                    fragment.append(word);
                });
                node.replaceWith(fragment);
            });
            return element.querySelectorAll('.word-inner');
        };
        const wordReveal = { yPercent: 115, duration: 0.9, ease: 'power4.out', stagger: 0.055, clearProps: 'transform' };

        const intro = gsap.timeline();
        intro.from(splitWords(document.querySelector('h1')), wordReveal, 0.05);
        intro.from('.hero-copy > :not(h1):not(.hero-points)', { ...reveal, stagger: 0.12 }, 0.15);
        intro.from('.hero-points li', { ...reveal, y: 12, stagger: 0.07 }, 0.55);
        // As folhas do hero reagem de leve ao ponteiro.
        const hero = document.querySelector('.hero');
        if (hasFinePointer && hero) {
            const onPointerMove = (event) => {
                const bounds = hero.getBoundingClientRect();
                const ratioX = (event.clientX - bounds.left) / bounds.width - 0.5;
                const ratioY = (event.clientY - bounds.top) / bounds.height - 0.5;
                gsap.to(hero, { '--leaf-x': `${ratioX * 18}px`, '--leaf-y': `${ratioY * 12}px`, duration: 1.2, ease: 'power3.out', overwrite: 'auto' });
            };
            hero.addEventListener('pointermove', onPointerMove);
            cleanups.push(() => hero.removeEventListener('pointermove', onPointerMove));

            gsap.utils.toArray('.hero-actions .button').forEach((button) => {
                const pullX = gsap.quickTo(button, 'x', { duration: 0.5, ease: 'power3.out' });
                const pullY = gsap.quickTo(button, 'y', { duration: 0.5, ease: 'power3.out' });
                button.addEventListener('pointermove', (event) => {
                    const bounds = button.getBoundingClientRect();
                    pullX((event.clientX - bounds.left - bounds.width / 2) * 0.18);
                    pullY((event.clientY - bounds.top - bounds.height / 2) * 0.28);
                });
                button.addEventListener('pointerleave', () => {
                    gsap.to(button, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
                });
            });
        }

        ScrollTrigger.batch('.benefits li, .trust-card, .faq > *, .closing-aside, .closing-inner .eyebrow, .security-card, .control-list li, .control-lead', {
            once: true,
            start: 'top 90%',
            onEnter: (elements) => {
                gsap.set(elements, { transition: 'none' });
                gsap.from(elements, { ...reveal, stagger: 0.08 });
            },
        });

        // Cards de recurso se levantam como páginas, e o conteúdo aparece depois.
        ScrollTrigger.batch('.feature', {
            once: true,
            start: 'top 88%',
            onEnter: (elements) => {
                gsap.set(elements, { transition: 'none' });
                gsap.from(elements, {
                    y: 36,
                    rotateX: -14,
                    transformPerspective: 1000,
                    transformOrigin: '50% 100%',
                    autoAlpha: 0,
                    duration: 0.9,
                    ease: 'power3.out',
                    stagger: 0.1,
                    clearProps: 'all',
                });
                elements.forEach((feature, index) => {
                    gsap.from(feature.querySelectorAll('.feature-preview > *'), {
                        autoAlpha: 0,
                        duration: 0.5,
                        stagger: 0.09,
                        delay: 0.35 + index * 0.1,
                        clearProps: 'opacity,visibility',
                    });
                });
            },
        });

        // Passos entram em sequência.
        gsap.utils.toArray('.step').forEach((step, index) => {
            gsap.set(step, { transition: 'none' });
            gsap.from(step, { ...reveal, delay: index * 0.1, scrollTrigger: { trigger: '.steps', start: 'top 88%', once: true } });
        });

        // Pilares: a linha acompanha a rolagem e acende cada etapa ao alcançá-la.
        const pillars = document.querySelector('[data-pillars]');
        if (pillars) {
            const items = gsap.utils.toArray('.pillar', pillars);
            pillars.classList.add('is-tracking');
            gsap.fromTo('.pillars-track span', { scaleX: 0 }, {
                scaleX: 1,
                ease: 'none',
                scrollTrigger: {
                    trigger: pillars,
                    start: 'top 85%',
                    end: 'top 35%',
                    scrub: 0.5,
                    onUpdate: ({ progress }) => {
                        items.forEach((item, index) => {
                            item.classList.toggle('is-active', progress >= index / (items.length - 1) - 0.001);
                        });
                    },
                },
            });
        }

        gsap.utils.toArray('.closing h2').forEach((title) => {
            gsap.from(splitWords(title), { ...wordReveal, stagger: 0.04, scrollTrigger: { trigger: title, start: 'top 90%', once: true } });
        });

        // Folhagem e paisagem do fechamento se deslocam em sentidos opostos.
        gsap.fromTo('.closing', { '--drift': '-20px' }, {
            '--drift': '20px',
            ease: 'none',
            scrollTrigger: { trigger: '.closing', start: 'top bottom', end: 'bottom top', scrub: 0.6 },
        });

        gsap.utils.toArray('[data-sweep]').forEach((container) => {
            gsap.from(container.querySelectorAll('mark'), {
                backgroundSize: '0% 100%',
                duration: 0.7,
                ease: 'power2.inOut',
                stagger: 0.45,
                delay: 0.25,
                clearProps: 'backgroundSize',
                scrollTrigger: { trigger: container, start: 'top 85%', once: true },
            });
        });

        gsap.utils.toArray('.week-bars').forEach((chart) => {
            const timeline = gsap.timeline({ scrollTrigger: { trigger: chart, start: 'top 90%', once: true } });
            timeline.from(chart.querySelectorAll('i'), { scaleY: 0, transformOrigin: 'bottom', duration: 0.7, ease: 'power3.out', stagger: 0.08, clearProps: 'transform' }, 0.2);
            timeline.from(chart.querySelectorAll('b'), { autoAlpha: 0, duration: 0.3, stagger: 0.08, clearProps: 'opacity,visibility' }, 0.5);
        });


        return () => cleanups.forEach((cleanup) => cleanup());
    });
}

document.documentElement.classList.add('motion-ready');
