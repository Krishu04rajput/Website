"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  const scrollProgress = document.getElementById("scrollProgress");
  const year = document.getElementById("currentYear");

  // Automatically update the copyright year.
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // Mobile navigation.
  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
      navLinks.classList.toggle("open", !isOpen);
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation");
      });
    });

    document.addEventListener("click", (event) => {
      if (
        navLinks.classList.contains("open") &&
        !navLinks.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        navLinks.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation");
      }
    });
  }

  // Scroll progress indicator.
  function updateScrollProgress() {
    if (!scrollProgress) return;

    const scrollableHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    const progress =
      scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;

    scrollProgress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }

  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  updateScrollProgress();

  // Reveal elements as they enter the viewport.
  const revealElements = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
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

    revealElements.forEach((element) => observer.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }

  // Contact form: submit to the existing Vercel /api/contact endpoint.
  const contactForm = document.getElementById("contactForm");
  const formStatus = document.getElementById("formStatus");
  const submitButton = document.getElementById("submitButton");

  if (contactForm && formStatus && submitButton) {
    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      formStatus.textContent = "";
      formStatus.className = "";

      const originalButtonText = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";

      const formData = new FormData(contactForm);

      const payload = {
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        message: String(formData.get("message") || "").trim()
      };

      if (!payload.name || !payload.email || !payload.message) {
        formStatus.textContent = "Please complete every field.";
        formStatus.className = "error";
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
        return;
      }

      try {
        const response = await fetch(contactForm.action || "/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.error || result.message || "Message could not be sent.");
        }

        formStatus.textContent = result.message || "Message sent successfully. Thanks for reaching out!";
        formStatus.className = "success";
        contactForm.reset();
      } catch (error) {
        console.error("Contact form error:", error);

        formStatus.textContent =
          error.message ||
          "Unable to send your message right now. Please try again later.";

        formStatus.className = "error";
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
    });
  }
});
