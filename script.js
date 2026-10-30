(() => {
const menuToggle = document.getElementById(“menuToggle”);
const navLinks = document.getElementById(“navLinks”);
const scrollProgress = document.getElementById(“scrollProgress”);
const currentYear = document.getElementById(“currentYear”);

// Automatically update the footer year.
if (currentYear) {
currentYear.textContent = new Date().getFullYear();
}

// Mobile navigation.
if (menuToggle && navLinks) {
menuToggle.addEventListener(“click”, () => {
const isOpen = menuToggle.getAttribute(“aria-expanded”) === “true”;

  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Open navigation" : "Close navigation"
  );
  navLinks.classList.toggle("is-open", !isOpen);
});
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    navLinks.classList.remove("is-open");
  });
});

}

// Reading progress indicator.
const updateProgress = () => {
if (!scrollProgress) return;

const scrollable =
  document.documentElement.scrollHeight - window.innerHeight;
const progress =
  scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
scrollProgress.style.width = `${progress}%`;

};

window.addEventListener(“scroll”, updateProgress, { passive: true });
updateProgress();

// Reveal content as it enters the viewport.
const revealTargets = document.querySelectorAll(
“.section-heading, .project-card, .person-card, .approach-item, .intro-strip, .contact-inner”
);

if (
“IntersectionObserver” in window &&
!window.matchMedia(”(prefers-reduced-motion: reduce)”).matches
) {
revealTargets.forEach((element) => {
element.classList.add(“reveal”);
});

const observer = new IntersectionObserver(
  (entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
revealTargets.forEach((element) => observer.observe(element));

}
})();
