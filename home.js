/* =========================================
   HOME PAGE  (final step)
   Needs data.js, auth.js and ui.js to be loaded first.
   ========================================= */


/* Show Login/Register to visitors and Dashboard/Logout to
   logged-in users. */
function renderHomeNavigation() {

    const me = getCurrentUser();

    document.querySelectorAll(".guest-only").forEach(function (element) {
        element.hidden = me !== null;
    });

    document.querySelectorAll(".user-only").forEach(function (element) {
        element.hidden = me === null;
    });

    if (me) {

        const pages = {
            admin: "admin.html",
            instructor: "instructor.html",
            student: "student.html"
        };

        document.querySelectorAll(".dashboard-link").forEach(function (link) {
            link.setAttribute("href", pages[me.role]);
        });

    }

}


/* Build the class list from the real classes in storage. */
function renderHomeClasses() {

    const container = $("homeClasses");

    if (!container) {
        return;
    }

    const classes = sortBySchedule(getClasses());

    container.innerHTML = "";

    if (classes.length === 0) {

        container.innerHTML = "<p>Classes will be announced soon.</p>";

        return;

    }

    classes.forEach(function (danceClass) {

        const card = document.createElement("div");

        card.className = "home-class-card";

        card.innerHTML =
            "<h3>" + escapeHTML(danceClass.name) + "</h3>" +
            (danceClass.description
                ? "<p>" + escapeHTML(danceClass.description) + "</p>"
                : "") +
            "<p><strong>Style:</strong> " + escapeHTML(danceClass.style) + "</p>" +
            "<p><strong>Level:</strong> " + escapeHTML(danceClass.level) + "</p>" +
            "<p><strong>When:</strong> " +
                escapeHTML(danceClass.day + ", " + danceClass.time) + "</p>" +
            "<p><strong>Instructor:</strong> " +
                escapeHTML(getUserName(danceClass.instructorEmail)) + "</p>" +
            "<p><strong>Seats left:</strong> " +
                getSeatsLeft(danceClass.id) + "</p>";

        container.appendChild(card);

    });

}


renderHomeNavigation();
renderHomeClasses();
