// ===== 1. Apparition des éléments au défilement =====
// Chaque élément avec la classe "reveal" apparaît quand il entre dans l'écran.
const elementsReveal = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver((entrees) => {
    entrees.forEach((entree) => {
        if (entree.isIntersecting) {
            entree.target.classList.add("visible");
            observer.unobserve(entree.target); // une seule fois
        }
    });
}, { threshold: 0.2 }); // déclenche quand 20% de l'élément est visible

elementsReveal.forEach((el) => observer.observe(el));


// ===== 2. Photo qui s'incline en suivant la souris =====
const photo = document.querySelector(".photo-ring");

if (photo) {
    photo.addEventListener("mousemove", (e) => {
        const rect = photo.getBoundingClientRect();
        // position de la souris dans la photo, de -0.5 à 0.5
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        const force = 20; // inclinaison max en degrés

        photo.style.transform =
            `perspective(600px) rotateX(${-y * force}deg) rotateY(${x * force}deg) scale(1.05)`;
    });

    // quand la souris sort, la photo revient droite
    photo.addEventListener("mouseleave", () => {
        photo.style.transform = "";
    });
}


// ===== 3. Couleurs qui changent sur le texte autour de la photo =====
// Les mots prennent tour à tour ces couleurs (celles de ton logo + la navbar).
const couleursOrbite = ["#e8558a", "#2b1a21", "#c23d74"];
const motsOrbite = document.querySelectorAll(".orbit-word");
let decalage = 0;

function changerCouleurs() {
    motsOrbite.forEach((mot, i) => {
        // chaque mot a une couleur différente, et elles tournent à chaque fois
        mot.style.fill = couleursOrbite[(i + decalage) % couleursOrbite.length];
    });
    decalage++;
}

changerCouleurs();
setInterval(changerCouleurs, 1500); // toutes les 1,5 secondes


// ===== 4. Ton nom : lettres qui tombent une par une =====
const nom = document.querySelector(".hero-name");

if (nom) {
    const texte = nom.textContent;
    nom.textContent = "";                       // on vide le titre
    nom.setAttribute("aria-label", texte);      // lisible par les lecteurs d'écran

    [...texte].forEach((caractere, i) => {
        const span = document.createElement("span");
        span.setAttribute("aria-hidden", "true");

        if (caractere === " ") {
            span.className = "espace";
        } else {
            span.className = "lettre";
            span.textContent = caractere;
            // chaque lettre arrive un peu après la précédente,
            // et la vague de couleur est décalée pour chaque lettre
            span.style.animationDelay = `${i * 0.08}s, ${i * -0.3}s`;
        }
        nom.appendChild(span);
    });
}


// ===== 5. Images de projets : pile de photos =====
// Les images sont empilées ; toutes les 3,5 s, celle de devant passe derrière.
// data-pos indique la place de chaque image dans la pile (0 = devant).
document.querySelectorAll(".card-gallery").forEach((galerie) => {
    const images = [...galerie.querySelectorAll("img")];
    let devant = 0;

    function ranger() {
        images.forEach((img, k) => {
            const pos = (k - devant + images.length) % images.length;
            img.dataset.pos = Math.min(pos, 3);
            img.classList.toggle("active", pos === 0); // utilisée par l'agrandissement
        });
    }
    ranger();

    if (images.length < 2) return;   // une seule image : pas d'animation

    // badge "3 photos"
    const badge = document.createElement("span");
    badge.className = "gallery-count";
    badge.textContent = `${images.length} photos`;
    galerie.appendChild(badge);

    setInterval(() => {
        if (galerie.matches(":hover")) return;   // pause quand la souris est dessus
        devant = (devant + 1) % images.length;
        ranger();
    }, 3500);
});


// ===== 6. Clic sur une image de projet = affichage en grand =====
// Dans l'image agrandie, on passe aux autres images du même projet avec :
// la molette, les flèches à l'écran, les flèches du clavier, ou en glissant le doigt.
const lightbox = document.createElement("div");
lightbox.className = "lightbox";
lightbox.innerHTML = `
    <button class="lb-prev" aria-label="Previous image">‹</button>
    <img alt="">
    <button class="lb-next" aria-label="Next image">›</button>
    <span class="lb-counter"></span>
    <button class="lb-close" aria-label="Close">×</button>
`;
document.body.appendChild(lightbox);

const lbImage = lightbox.querySelector("img");
const lbCompteur = lightbox.querySelector(".lb-counter");
let lbImages = [];   // les images du projet ouvert
let lbIndex = 0;     // l'image affichée

function lbAfficher(i) {
    // modulo : après la dernière on revient à la première (et inversement)
    lbIndex = (i + lbImages.length) % lbImages.length;
    lbImage.src = lbImages[lbIndex].src;
    lbImage.alt = lbImages[lbIndex].alt;
    // petit fondu à chaque changement d'image
    lbImage.animate(
        [{ opacity: 0, transform: "scale(0.97)" }, { opacity: 1, transform: "scale(1)" }],
        { duration: 300, easing: "ease-out" }
    );
    lbCompteur.textContent = `${lbIndex + 1} / ${lbImages.length}`;
    // pas de flèches ni de compteur s'il n'y a qu'une image
    lightbox.classList.toggle("une-seule", lbImages.length < 2);
}

function lbFermer() {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";   // la page peut de nouveau défiler
}

document.querySelectorAll(".card-gallery").forEach((galerie) => {
    galerie.addEventListener("click", () => {
        lbImages = [...galerie.querySelectorAll("img")];
        const active = galerie.querySelector("img.active");
        lbAfficher(lbImages.indexOf(active));
        lightbox.classList.add("open");
        document.body.style.overflow = "hidden"; // bloque le défilement de la page derrière
    });
});

// flèches à l'écran
lightbox.querySelector(".lb-prev").addEventListener("click", (e) => {
    e.stopPropagation();   // ne pas fermer
    lbAfficher(lbIndex - 1);
});
lightbox.querySelector(".lb-next").addEventListener("click", (e) => {
    e.stopPropagation();
    lbAfficher(lbIndex + 1);
});

// clic sur l'image : rien ; clic à côté : fermer
lbImage.addEventListener("click", (e) => e.stopPropagation());
lightbox.addEventListener("click", lbFermer);
lightbox.querySelector(".lb-close").addEventListener("click", lbFermer);

// molette de la souris (avec une petite pause pour ne pas sauter plusieurs images)
let molettePause = false;
lightbox.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (molettePause || Math.abs(e.deltaY) < 10) return;
    lbAfficher(e.deltaY > 0 ? lbIndex + 1 : lbIndex - 1);
    molettePause = true;
    setTimeout(() => (molettePause = false), 400);
}, { passive: false });

// clavier : flèches et Échap
document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") lbAfficher(lbIndex + 1);
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") lbAfficher(lbIndex - 1);
    if (e.key === "Escape") lbFermer();
});

// téléphone : glisser le doigt à gauche / à droite
let debutX = 0;
lightbox.addEventListener("touchstart", (e) => (debutX = e.touches[0].clientX));
lightbox.addEventListener("touchend", (e) => {
    const ecart = e.changedTouches[0].clientX - debutX;
    if (Math.abs(ecart) > 50) lbAfficher(ecart < 0 ? lbIndex + 1 : lbIndex - 1);
});


// ===== 7. Contact : bouton "Copy" pour l'email =====
document.querySelectorAll(".copy-btn").forEach((bouton) => {
    bouton.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(bouton.dataset.copy);
            bouton.textContent = "Copied ✓";
        } catch {
            bouton.textContent = "Error";   // copie bloquée par le navigateur
        }
        bouton.classList.add("copied");
        // remet le texte d'origine après 2 secondes
        setTimeout(() => {
            bouton.textContent = "Copy";
            bouton.classList.remove("copied");
        }, 2000);
    });
});


// ===== 8. Pied de page : année automatique =====
const annee = document.getElementById("annee");
if (annee) annee.textContent = new Date().getFullYear();
