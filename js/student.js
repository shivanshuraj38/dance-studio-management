/* =========================================
   STUDENT DASHBOARD  (step 4)
   Needs data.js, auth.js and ui.js to be loaded first.
   ========================================= */


/* =========================================
   STATISTICS
   ========================================= */

function renderStudentStats() {

    const me = getCurrentUser();

    if (!me) {
        return;
    }

    const mine = getRegistrationsForStudent(me.email);

    const approved = mine.filter(function (registration) {
        return registration.status === REG_STATUS.APPROVED;
    }).length;

    const pending = mine.filter(function (registration) {
        return registration.status === REG_STATUS.PENDING;
    }).length;

    setText("statApproved", approved);
    setText("statPending", pending);
    setText("statAvailable", getClasses().length);

    /* the unread-notifications card is filled by updateNotificationBadge() */

}


/* =========================================
   BROWSE CLASSES  (search + style + level work together)
   ========================================= */

/* Fill the style drop-down from the classes that really exist. */
function populateStyleFilter() {

    const select = $("danceStyle");

    if (!select) {
        return;
    }

    const current = select.value;

    const styles = [];

    getClasses().forEach(function (danceClass) {

        if (styles.indexOf(danceClass.style) === -1) {
            styles.push(danceClass.style);
        }

    });

    styles.sort();

    select.innerHTML = "";

    const all = document.createElement("option");

    all.value = "";
    all.textContent = "All Styles";

    select.appendChild(all);

    styles.forEach(function (style) {

        const option = document.createElement("option");

        option.value = style;
        option.textContent = style;

        select.appendChild(option);

    });

    select.value = current;

}


/* The student's Pending/Approved registration for a class, if any. */
function findMyActiveRegistration(email, classId) {

    return getRegistrationsForStudent(email).find(function (registration) {

        return registration.classId === classId && isActiveRegistration(registration);

    }) || null;

}


function renderClassCards() {

    const grid = $("classGrid");
    const me = getCurrentUser();

    if (!grid || !me) {
        return;
    }

    const query = $("classSearch").value;
    const styleFilter = $("danceStyle").value;
    const levelFilter = $("levelFilter").value;

    const classes = getClasses().filter(function (danceClass) {

        return (
            (styleFilter === "" || danceClass.style === styleFilter) &&
            (levelFilter === "" || danceClass.level === levelFilter) &&
            matchesQuery(
                [
                    danceClass.name,
                    danceClass.description || "",
                    danceClass.style,
                    getUserName(danceClass.instructorEmail)
                ],
                query
            )
        );

    });

    grid.innerHTML = "";

    if (classes.length === 0) {

        grid.innerHTML =
            '<p class="empty-message">No classes match your search.</p>';

        return;

    }

    classes.forEach(function (danceClass) {

        const myRegistration =
            findMyActiveRegistration(me.email, danceClass.id);

        const seatsLeft = getSeatsLeft(danceClass.id);

        let action;

        if (myRegistration && myRegistration.status === REG_STATUS.APPROVED) {

            action = statusBadge("Approved");

        } else if (myRegistration) {

            action = statusBadge("Pending");

        } else if (seatsLeft === 0) {

            action = '<button type="button" disabled>Class Full</button>';

        } else {

            action =
                '<button type="button" onclick="handleRegister(' +
                danceClass.id + ')">Register</button>';

        }

        const card = document.createElement("article");

        card.className = "class-card";

        card.innerHTML =
            "<h3>" + escapeHTML(danceClass.name) + "</h3>" +
            (danceClass.description
                ? "<p>" + escapeHTML(danceClass.description) + "</p>"
                : "") +
            "<p><strong>Style:</strong> " + escapeHTML(danceClass.style) + "</p>" +
            "<p><strong>Instructor:</strong> " +
                escapeHTML(getUserName(danceClass.instructorEmail)) + "</p>" +
            "<p><strong>Day:</strong> " + escapeHTML(danceClass.day) + "</p>" +
            "<p><strong>Time:</strong> " + escapeHTML(danceClass.time) + "</p>" +
            "<p><strong>Level:</strong> " + escapeHTML(danceClass.level) + "</p>" +
            "<p><strong>Seats left:</strong> " + seatsLeft +
                " of " + danceClass.capacity + "</p>" +
            action;

        grid.appendChild(card);

    });

}


/* ---------- Register ---------- */

function handleRegister(classId) {

    const me = getCurrentUser();

    if (!me) {

        window.location.href = "login.html";

        return;

    }

    showResult(createRegistration(me.email, classId));

    refreshStudentDashboard();

}


/* =========================================
   MY REGISTRATIONS
   ========================================= */

function renderStudentRegistrations() {

    const table = $("registrationTable");
    const me = getCurrentUser();

    if (!table || !me) {
        return;
    }

    /* newest first */
    const mine = getRegistrationsForStudent(me.email).slice().reverse();

    table.innerHTML = "";

    if (mine.length === 0) {

        table.innerHTML = emptyRow(5, "You have not registered for any class yet.");

        return;

    }

    mine.forEach(function (registration) {

        const danceClass = getClassById(registration.classId);

        const className = danceClass ? danceClass.name : "(deleted class)";
        const instructor =
            danceClass ? getUserName(danceClass.instructorEmail) : "-";

        let action = "—";

        if (isActiveRegistration(registration)) {

            action =
                '<button type="button" class="btn-small btn-danger" ' +
                'onclick="handleCancelRegistration(' + registration.id +
                ')">Cancel</button>';

        }

        const row = document.createElement("tr");

        row.innerHTML =
            "<td>" + escapeHTML(className) + "</td>" +
            "<td>" + escapeHTML(instructor) + "</td>" +
            "<td>" + escapeHTML(formatDate(registration.date)) + "</td>" +
            "<td>" + statusBadge(registration.status) + "</td>" +
            "<td>" + action + "</td>";

        table.appendChild(row);

    });

}


function handleCancelRegistration(registrationId) {

    const me = getCurrentUser();
    const registration = getRegistrationById(registrationId);

    if (!me || !registration || registration.studentEmail !== me.email) {

        showToast("Registration not found.", "error");

        return;

    }

    const danceClass = getClassById(registration.classId);

    const name = danceClass ? danceClass.name : "this class";

    if (!confirm("Cancel your registration for " + name + "?")) {
        return;
    }

    showResult(setRegistrationStatus(registrationId, REG_STATUS.CANCELLED));

    refreshStudentDashboard();

}


/* =========================================
   SCHEDULE  (approved classes only, in weekday order)
   ========================================= */

function renderSchedule() {

    const list = $("scheduleList");
    const me = getCurrentUser();

    if (!list || !me) {
        return;
    }

    const classes = getRegistrationsForStudent(me.email)
        .filter(function (registration) {
            return registration.status === REG_STATUS.APPROVED;
        })
        .map(function (registration) {
            return getClassById(registration.classId);
        })
        .filter(function (danceClass) {
            return danceClass !== null;
        });

    const sortedClasses = sortBySchedule(classes);

    list.innerHTML = "";

    if (classes.length === 0) {

        list.innerHTML =
            "<li>You have no approved classes yet. " +
            "Register for a class above and wait for approval.</li>";

        return;

    }

    sortedClasses.forEach(function (danceClass) {

        const item = document.createElement("li");

        item.innerHTML =
            "<strong>" + escapeHTML(danceClass.day) + "</strong> — " +
            escapeHTML(danceClass.name) + ", " +
            escapeHTML(danceClass.time) + " (" +
            escapeHTML(getUserName(danceClass.instructorEmail)) + ")";

        list.appendChild(item);

    });

}


/* =========================================
   REFRESH + START
   ========================================= */

function refreshStudentDashboard() {

    renderStudentStats();
    populateStyleFilter();
    renderClassCards();
    renderStudentRegistrations();
    renderSchedule();
    renderNotifications();
    updateNotificationBadge();

}


function initializeStudentDashboard() {

    refreshStudentDashboard();

}
