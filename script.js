/* =====================================================
   PawSense – script.js
   One script shared by every page. Each part checks
   "does this page have the thing I need?" before it
   runs, so it is safe to load on all pages.

   Sections:
   1. Demo data (made-up numbers)
   2. Mobile menu
   3. Footer year
   4. Fill in demo numbers and the baseline message
   5. Seven-day chart (drawn as SVG)
   6. Show/hide password buttons
   7. Form helpers
   8. Sign-up form (DEMO ONLY)
   9. Log-in form (DEMO ONLY)
   10. Waitlist form (DEMO ONLY)

   SECURITY NOTE: nothing in this file sends, saves or
   stores what a visitor types. Passwords are never put
   in localStorage, sessionStorage or anywhere else.
   ===================================================== */


/* ---------- 1. DEMO DATA ----------
   All numbers here are made up. Later, real data from
   a backend would replace this block. */
const DEMO = {
  week: [
    { day: "Wed",   score: 72 },
    { day: "Thu",   score: 68 },
    { day: "Fri",   score: 75 },
    { day: "Sat",   score: 80 },
    { day: "Sun",   score: 78 },
    { day: "Mon",   score: 70 },
    { day: "Today", score: 52 }
  ]
};

// Baseline = the average of the days BEFORE today.
function getBaseline() {
  const earlierDays = DEMO.week.slice(0, -1);   // everything except the last item
  let total = 0;
  for (const entry of earlierDays) {
    total = total + entry.score;
  }
  return Math.round(total / earlierDays.length);
}

const BASELINE = getBaseline();
const RANGE_WIDTH = 10;                          // "usual range" = baseline plus or minus 10
const USUAL_LOW = BASELINE - RANGE_WIDTH;
const USUAL_HIGH = BASELINE + RANGE_WIDTH;
const TODAY = DEMO.week[DEMO.week.length - 1];


/* ---------- 2. MOBILE MENU ---------- */
const menuButton = document.getElementById("menu-toggle");
const siteNav = document.getElementById("site-nav");

if (menuButton && siteNav) {
  menuButton.addEventListener("click", function () {
    const isOpen = siteNav.classList.toggle("open");   // add or remove the class "open"
    menuButton.setAttribute("aria-expanded", isOpen);  // tells screen readers the state
    menuButton.textContent = isOpen ? "Close" : "Menu";
  });
}


/* ---------- 3. FOOTER YEAR ---------- */
const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}


/* ---------- 4. FILL IN DEMO NUMBERS AND THE BASELINE MESSAGE ---------- */

// Any element like <span data-demo="score"> gets its text from here.
const demoValues = {
  score: TODAY.score,
  baseline: BASELINE,
  low: USUAL_LOW,
  high: USUAL_HIGH
};

document.querySelectorAll("[data-demo]").forEach(function (element) {
  const key = element.dataset.demo;               // reads the word after data-demo=
  if (key in demoValues) {
    element.textContent = demoValues[key];
  }
});

// Any element with the attribute data-notice gets the comparison message.
function buildNotice() {
  const range = "Today's score is " + TODAY.score + " and Max's usual range is " + USUAL_LOW + " to " + USUAL_HIGH + " (demo data).";
  if (TODAY.score < USUAL_LOW) {
    return ["Activity is below Max's usual range today.", range];
  } else if (TODAY.score > USUAL_HIGH) {
    return ["Activity is above Max's usual range today.", range];
  }
  return ["Activity is within Max's usual range today.", range];
}

document.querySelectorAll("[data-notice]").forEach(function (box) {
  const parts = buildNotice();
  box.innerHTML = "";                              // clear the box
  const title = document.createElement("strong");
  title.textContent = parts[0];
  box.append(title, parts[1]);
});


/* ---------- 5. SEVEN-DAY CHART ----------
   Builds an SVG picture with plain JavaScript.
   Every element with the attribute data-chart gets a chart. */
function drawChart(box) {
  const days = DEMO.week;

  // Size of the drawing and the empty margins around the bars
  const W = 560, H = 250;
  const left = 34, right = 10, top = 22, bottom = 34;
  const plotW = W - left - right;
  const plotH = H - top - bottom;
  const slot = plotW / days.length;               // space for each day
  const barW = slot * 0.56;                       // bar is a bit narrower than its space

  // Converts a score (0 to 100) into a vertical position. 0 is at the bottom.
  function y(value) {
    return top + plotH - (value / 100) * plotH;
  }

  let parts = "";

  // Light grid lines at 0, 50 and 100
  for (const g of [0, 50, 100]) {
    parts += '<line class="chart-grid" x1="' + left + '" x2="' + (W - right) + '" y1="' + y(g) + '" y2="' + y(g) + '"/>';
    parts += '<text class="chart-text" x="' + (left - 8) + '" y="' + (y(g) + 4) + '" text-anchor="end">' + g + '</text>';
  }

  // The shaded "usual range" band
  parts += '<rect class="chart-band" x="' + left + '" y="' + y(USUAL_HIGH) + '" width="' + plotW +
           '" height="' + (y(USUAL_LOW) - y(USUAL_HIGH)) + '" rx="6"/>';

  // One bar, one value label and one day label for each day
  days.forEach(function (d, i) {
    const x = left + slot * i + (slot - barW) / 2;
    const isToday = (i === days.length - 1);
    parts += '<rect class="chart-bar' + (isToday ? ' today' : '') + '" x="' + x + '" y="' + y(d.score) +
             '" width="' + barW + '" height="' + (y(0) - y(d.score)) + '" rx="6"/>';
    parts += '<text class="chart-text chart-value" x="' + (x + barW / 2) + '" y="' + (y(d.score) - 6) + '" text-anchor="middle">' + d.score + '</text>';
    parts += '<text class="chart-text" x="' + (x + barW / 2) + '" y="' + (H - 10) + '" text-anchor="middle">' + d.day + '</text>';
  });

  // Label for the band, drawn last so it sits on top
  parts += '<text class="chart-text chart-band-label" x="' + (W - right - 6) + '" y="' + (y(USUAL_HIGH) + 15) + '" text-anchor="end">Usual range</text>';

  // A text version of the chart for screen readers
  const summary = days.map(function (d) { return d.day + " " + d.score; }).join(", ");
  const label = "Bar chart of demo activity scores for the last seven days: " + summary +
                ". The usual range is " + USUAL_LOW + " to " + USUAL_HIGH + ".";

  box.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + label + '">' + parts + '</svg>';
}

document.querySelectorAll("[data-chart]").forEach(drawChart);


/* ---------- 6. SHOW / HIDE PASSWORD ---------- */
document.querySelectorAll(".toggle-password").forEach(function (button) {
  button.addEventListener("click", function () {
    const input = document.getElementById(button.dataset.target);
    const isHidden = (input.type === "password");
    input.type = isHidden ? "text" : "password";   // switch between dots and visible text
    button.textContent = isHidden ? "Hide" : "Show";
    button.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
  });
});


/* ---------- 7. FORM HELPERS ---------- */

// Shows (or clears) an error under a field. The error paragraph's id is the field's id + "-error".
function setError(input, message) {
  const errorBox = document.getElementById(input.id + "-error");
  if (errorBox) {
    errorBox.textContent = message;
  }
  input.setAttribute("aria-invalid", message ? "true" : "false");
}

// A simple email check: something@something.something
function looksLikeEmail(text) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
}

// Shows a message in the green or amber status box under a form.
function showStatus(box, message, isInfo) {
  box.textContent = message;
  box.classList.toggle("is-info", Boolean(isInfo));
}


/* ---------- 8. SIGN-UP FORM (DEMO ONLY) ---------- */
const signupForm = document.getElementById("signup-form");

if (signupForm) {
  signupForm.addEventListener("submit", function (event) {
    event.preventDefault();                         // stop the browser from reloading the page

    const name = document.getElementById("su-name");
    const email = document.getElementById("su-email");
    const password = document.getElementById("su-password");
    const confirm = document.getElementById("su-confirm");
    const terms = document.getElementById("su-terms");
    const result = document.getElementById("signup-result");

    let allGood = true;

    if (name.value.trim() === "") {
      setError(name, "Please enter your name.");
      allGood = false;
    } else { setError(name, ""); }

    if (!looksLikeEmail(email.value.trim())) {
      setError(email, "Please enter an email address like name@example.com.");
      allGood = false;
    } else { setError(email, ""); }

    if (password.value.length < 8) {
      setError(password, "Your password needs at least 8 characters.");
      allGood = false;
    } else { setError(password, ""); }

    if (confirm.value !== password.value || confirm.value === "") {
      setError(confirm, "The two passwords do not match.");
      allGood = false;
    } else { setError(confirm, ""); }

    if (!terms.checked) {
      setError(terms, "Please tick the box to continue.");
      allGood = false;
    } else { setError(terms, ""); }

    if (!allGood) {
      showStatus(result, "", false);
      return;                                       // stop here and let the person fix the errors
    }

    // Success: but nothing is created, sent or saved.
    signupForm.reset();                             // wipes the fields, including the passwords
    showStatus(result, "Demo only: the form is filled in correctly, but no account was created. Nothing was sent or saved. Real accounts will need a secure sign-in service.", true);
  });
}


/* ---------- 9. LOG-IN FORM (DEMO ONLY) ---------- */
const loginForm = document.getElementById("login-form");

if (loginForm) {
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("li-email");
    const password = document.getElementById("li-password");
    const result = document.getElementById("login-result");

    let allGood = true;

    if (!looksLikeEmail(email.value.trim())) {
      setError(email, "Please enter an email address like name@example.com.");
      allGood = false;
    } else { setError(email, ""); }

    if (password.value === "") {
      setError(password, "Please enter your password.");
      allGood = false;
    } else { setError(password, ""); }

    if (!allGood) {
      showStatus(result, "", false);
      return;
    }

    loginForm.reset();                              // "Remember me" is not used: nothing is stored
    showStatus(result, "Demo only: log-in is not connected yet, so nobody was logged in. Nothing was sent or saved. You can look at the dashboard preview instead.", true);
  });

  // "Forgot password?" shows an honest message instead of pretending
  const forgotLink = document.getElementById("forgot-link");
  const loginResult = document.getElementById("login-result");
  if (forgotLink) {
    forgotLink.addEventListener("click", function (event) {
      event.preventDefault();
      showStatus(loginResult, "Password recovery is not built yet. There are no real accounts in this demo, so there is nothing to recover.", true);
    });
  }
}


/* ---------- 10. WAITLIST FORM (DEMO ONLY) ---------- */
const waitlistButton = document.getElementById("waitlist-btn");
const waitlistPanel = document.getElementById("waitlist-panel");
const waitlistForm = document.getElementById("waitlist-form");

if (waitlistButton && waitlistPanel) {
  // Open or close the form when the button is pressed
  waitlistButton.addEventListener("click", function () {
    const willOpen = waitlistPanel.hidden;          // hidden now means it will open
    waitlistPanel.hidden = !willOpen;
    waitlistButton.setAttribute("aria-expanded", willOpen);
    if (willOpen) {
      document.getElementById("wl-email").focus();  // put the cursor in the email box
    }
  });
}

if (waitlistForm) {
  waitlistForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById("wl-email");
    const result = document.getElementById("waitlist-result");

    if (!looksLikeEmail(email.value.trim())) {
      setError(email, "Please enter an email address like name@example.com.");
      showStatus(result, "", false);
      return;
    }
    setError(email, "");
    waitlistForm.reset();
    showStatus(result, "Demo only: your email was not saved or sent anywhere. A real waitlist needs a backend or an external form service.", true);
  });
}