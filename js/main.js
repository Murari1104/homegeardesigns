(function () {
  var BUDGETS = [
    "0",
    "Up to 2 Lakhs",
    "Up to 5 Lakhs",
    "Up to 8 Lakhs",
    "Up to 12 Lakhs",
    "Up to 15 Lakhs",
    "Up to 20 Lakhs",
    "Up to 30 Lakhs",
    "Above 30 Lakhs"
  ];
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  var menuButton = document.getElementById("menu-toggle");
  var navLinks = document.getElementById("nav-links");
  if (menuButton && navLinks) {
    menuButton.addEventListener("click", function () {
      var open = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", open ? "false" : "true");
      menuButton.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      navLinks.classList.toggle("is-open", !open);
    });
    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        menuButton.setAttribute("aria-expanded", "false");
        navLinks.classList.remove("is-open");
      });
    });
  }

  document.querySelectorAll("[data-close-dialog]").forEach(function (button) {
    button.addEventListener("click", function () {
      var dialog = button.closest("dialog");
      if (dialog) dialog.close();
    });
  });
  document.querySelectorAll("dialog").forEach(function (dialog) {
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
  });

  var projectOpen = document.getElementById("open-project");
  var projectDialog = document.getElementById("project-dialog");
  if (projectOpen && projectDialog) {
    projectOpen.addEventListener("click", function () {
      projectDialog.showModal();
    });
  }

  setupQuotePrompt();
  setupBudget();
  setupOthers(document.getElementById("quote-location"), document.getElementById("quote-other-wrap"), document.getElementById("quote-location-other"));
  setupPhone(document.getElementById("quote-phone"));
  setupPhone(document.getElementById("brochure-phone"));
  setupQuoteForm();
  setupBrochure();

  function setupQuotePrompt() {
    var prompt = document.getElementById("quote-prompt");
    if (!prompt || sessionStorage.getItem("homegear-quote-prompt")) return;
    sessionStorage.setItem("homegear-quote-prompt", "1");
    prompt.hidden = false;
    prompt.classList.add(reduceMotion ? "is-hold" : "is-in");
    var hideTimer = window.setTimeout(hide, 3000);
    prompt.addEventListener("click", function () {
      window.clearTimeout(hideTimer);
      prompt.hidden = true;
      var quote = document.getElementById("quote");
      if (quote) quote.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      var phone = document.getElementById("quote-phone");
      if (phone) phone.focus();
    });

    function hide() {
      if (reduceMotion) {
        prompt.hidden = true;
        return;
      }
      prompt.classList.remove("is-in");
      prompt.classList.add("is-out");
      window.setTimeout(function () { prompt.hidden = true; }, 450);
    }
  }

  function setupBudget() {
    var slider = document.getElementById("quote-budget");
    var label = document.getElementById("budget-label");
    if (!slider || !label) return;
    var paint = function () {
      var index = Number(slider.value);
      var text = BUDGETS[index] || BUDGETS[0];
      label.textContent = text;
      slider.setAttribute("aria-valuenow", String(index));
      slider.setAttribute("aria-valuetext", text);
    };
    slider.addEventListener("input", paint);
    paint();
  }

  function setupOthers(select, wrap, input) {
    if (!select || !wrap || !input) return;
    var sync = function () {
      var others = select.value === "Others";
      wrap.hidden = !others;
      input.required = others;
      if (!others) input.value = "";
    };
    select.addEventListener("change", sync);
    sync();
  }

  function setupPhone(input) {
    if (!input) return;
    input.addEventListener("input", function () {
      input.value = phoneDigits(input.value);
    });
  }

  function phoneDigits(value) {
    var digits = String(value || "").replace(/\D/g, "");
    if (digits.length > 10 && digits.indexOf("91") === 0) digits = digits.slice(2);
    if (digits.indexOf("0") === 0) digits = digits.slice(1);
    return digits.slice(0, 10);
  }

  function validPhone(digits) {
    return /^[6-9]\d{9}$/.test(digits);
  }

  function webAppUrl() {
    return String(window.HOMEGEAR_LEAD_WEB_APP_URL || "").trim();
  }

  function sendLead(payload) {
    var url = webAppUrl();
    if (!url) return Promise.reject(new Error("missing-url"));
    if (payload.company) return Promise.resolve();
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var timer = controller ? window.setTimeout(function () { controller.abort(); }, 12000) : null;
    return fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    }).finally(function () {
      if (timer) window.clearTimeout(timer);
    });
  }

  function setupQuoteForm() {
    var form = document.getElementById("quote-form");
    if (!form) return;
    var submit = document.getElementById("quote-submit");
    var success = document.getElementById("quote-success");
    var error = document.getElementById("quote-error");
    var sending = false;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (sending) return;
      error.textContent = "";
      var name = document.getElementById("quote-name").value.trim();
      var phone = phoneDigits(document.getElementById("quote-phone").value);
      var location = document.getElementById("quote-location").value;
      var other = document.getElementById("quote-location-other").value.trim();
      var budgetIndex = Number(document.getElementById("quote-budget").value);
      var company = document.getElementById("quote-company").value;
      var phoneError = document.getElementById("quote-phone-error");
      var locationError = document.getElementById("quote-location-error");
      var valid = true;

      if (!validPhone(phone)) {
        phoneError.textContent = "Enter a 10-digit mobile number starting with 6, 7, 8 or 9.";
        valid = false;
      } else {
        phoneError.textContent = "";
      }
      if (!location) {
        locationError.textContent = "Choose a location.";
        valid = false;
      } else if (location === "Others" && other.length < 2) {
        locationError.textContent = "Enter the city or area.";
        valid = false;
      } else {
        locationError.textContent = "";
      }
      if (!valid) return;

      sending = true;
      submit.disabled = true;
      var place = location === "Others" ? other : location;
      sendLead({
        source: "quote",
        name: name,
        phone: "+91" + phone,
        location: place,
        budget: BUDGETS[budgetIndex] || BUDGETS[0],
        page: window.location.href,
        company: company
      }).then(function () {
        form.hidden = true;
        success.hidden = false;
      }).catch(function (err) {
        sending = false;
        submit.disabled = false;
        error.textContent = err && err.message === "missing-url"
          ? "This form is not connected yet. Paste the Web App URL into js/config.js and try again."
          : "Could not send just now. Check your connection and try again.";
      });
    });
  }

  function setupBrochure() {
    var open = document.getElementById("open-brochure");
    var dialog = document.getElementById("brochure-dialog");
    var form = document.getElementById("brochure-form");
    if (!open || !dialog || !form) return;
    var submit = document.getElementById("brochure-submit");
    var error = document.getElementById("brochure-error");
    var status = document.getElementById("brochure-status");
    var sending = false;

    open.addEventListener("click", function () {
      error.textContent = "";
      status.textContent = "";
      dialog.showModal();
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (sending) return;
      var phone = phoneDigits(document.getElementById("brochure-phone").value);
      var company = document.getElementById("brochure-company").value;
      if (!validPhone(phone)) {
        error.textContent = "Enter a 10-digit mobile number starting with 6, 7, 8 or 9.";
        return;
      }
      error.textContent = "";
      sending = true;
      submit.disabled = true;
      downloadBrochure();
      sendLead({
        source: "brochure",
        name: "",
        phone: "+91" + phone,
        location: "",
        budget: "",
        page: window.location.href,
        company: company
      }).then(function () {
        status.textContent = "The brochure is downloading.";
      }).catch(function () {
        status.textContent = "The brochure is downloading. Your number could not be saved just now.";
      }).finally(function () {
        sending = false;
        submit.disabled = false;
      });
    });
  }

  function downloadBrochure() {
    var link = document.createElement("a");
    link.href = "assets/Homegear_Brochure_6x9in.pdf";
    link.download = "Homegear_Brochure_6x9in.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
})();
