/* =========================================
   INSTRUCTOR DASHBOARD  (step 5)
   Needs data.js, auth.js and ui.js to be loaded first.

   Classes are linked to the instructor by EMAIL, so
   a name spelled slightly differently can't hide classes.
   Approving or rejecting requests is done by the admin;
   instructors can see who is registered.
   ========================================= */


/* =========================================
   MY DATA
   ========================================= */

function getMyClasses() {

    const me = getCurrentUser();

    if (!me) {
        return [];
    }

    return getClassesByInstructor(me.email);

}


/* Registrations for any of my classes. */
function getMyRegistrations() {

    const classIds = getMyClasses().map(function (danceClass) {
        return danceClass.id;
    });

    return getRegistrations().filter(function (registration) {

        return classIds.indexOf(registration.classId) !== -1;

    });

}


/* =========================================
   STATISTICS
   ========================================= */

function renderInstructorStats() {

    const registrations = getMyRegistrations();

    /* count each student once, even if they joined two of my classes */
    const students = [];

    registrations.forEach(function (registration) {

        if (registration.status === REG_STATUS.APPROVED &&
            students.indexOf(registration.studentEmail) === -1) {

            students.push(registration.studentEmail);

        }

    });

    const pending = registrations.filter(function (registration) {
        return registration.status === REG_STATUS.PENDING;
    }).length;

    setText("statClasses", getMyClasses().length);
    setText("statStudents", students.length);
    setText("statPending", pending);

    /* the unread-notifications card is filled by updateNotificationBadge() */

}


/* =========================================
   MY CLASSES
   ========================================= */

function renderInstructorClasses() {

    const table = $("instructorClassTable");

    if (!table) {
        return;
    }

    const classes = sortBySchedule(getMyClasses());

    table.innerHTML = "";

    if (classes.length === 0) {

        table.innerHTML = emptyRow(6, "No classes assigned to you yet.");

        return;

    }

    classes.forEach(function (danceClass) {

        const row = document.createElement("tr");

        row.innerHTML =
            "<td>" + escapeHTML(danceClass.name) + "</td>" +
            "<td>" + escapeHTML(danceClass.style) + "</td>" +
            "<td>" + escapeHTML(danceClass.level) + "</td>" +
            "<td>" + escapeHTML(danceClass.day) + "</td>" +
            "<td>" + escapeHTML(danceClass.time) + "</td>" +
            "<td>" + getSeatsTaken(danceClass.id) + " / " +
                danceClass.capacity + "</td>";

        table.appendChild(row);

    });

}


/* =========================================
   REGISTERED STUDENTS  (search + class + status filters)
   ========================================= */

/* Fill the class drop-down with my classes. */
function populateClassFilter() {

    const select = $("studentClassFilter");

    if (!select) {
        return;
    }

    const current = select.value;

    select.innerHTML = "";

    const all = document.createElement("option");

    all.value = "";
    all.textContent = "All My Classes";

    select.appendChild(all);

    getMyClasses().forEach(function (danceClass) {

        const option = document.createElement("option");

        option.value = danceClass.id;
        option.textContent = danceClass.name;

        select.appendChild(option);

    });

    select.value = current;

}


function renderInstructorStudents() {

    const table = $("instructorStudentTable");

    if (!table) {
        return;
    }

    const query = $("studentSearch").value;
    const classFilter = $("studentClassFilter").value;
    const statusFilter = $("studentStatusFilter").value;

    /* newest first */
    const registrations = getMyRegistrations().slice().reverse();

    table.innerHTML = "";

    let shown = 0;

    registrations.forEach(function (registration) {

        const danceClass = getClassById(registration.classId);

        const studentName = getUserName(registration.studentEmail);
        const className = danceClass ? danceClass.name : "(deleted class)";

        if (classFilter !== "" &&
            registration.classId !== Number(classFilter)) {
            return;
        }

        if (statusFilter !== "" && registration.status !== statusFilter) {
            return;
        }

        if (!matchesQuery(
            [studentName, registration.studentEmail, className],
            query
        )) {
            return;
        }

        const row = document.createElement("tr");

        row.innerHTML =
            "<td>" + escapeHTML(studentName) + "</td>" +
            "<td>" + escapeHTML(registration.studentEmail) + "</td>" +
            "<td>" + escapeHTML(className) + "</td>" +
            "<td>" + escapeHTML(formatDate(registration.date)) + "</td>" +
            "<td>" + statusBadge(registration.status) + "</td>";

        table.appendChild(row);

        shown++;

    });

    if (shown === 0) {

        table.innerHTML = emptyRow(5, "No students found.");

    }

}


/* =========================================
   SCHEDULE  (built from my classes, in weekday order)
   ========================================= */

function renderInstructorSchedule() {

    const list = $("scheduleList");

    if (!list) {
        return;
    }

    const classes = sortBySchedule(getMyClasses());

    list.innerHTML = "";

    if (classes.length === 0) {

        list.innerHTML = "<li>You have no scheduled classes.</li>";

        return;

    }

    classes.forEach(function (danceClass) {

        const item = document.createElement("li");

        item.innerHTML =
            "<strong>" + escapeHTML(danceClass.day) + "</strong> — " +
            escapeHTML(danceClass.name) + ", " +
            escapeHTML(danceClass.time) + " (" +
            getSeatsTaken(danceClass.id) + " of " +
            danceClass.capacity + " seats taken)";

        list.appendChild(item);

    });

}


/* =========================================
   REFRESH + START
   ========================================= */

function refreshInstructorDashboard() {

    renderInstructorStats();
    renderInstructorClasses();
    populateClassFilter();
    renderInstructorStudents();
    renderInstructorSchedule();
    renderNotifications();
    updateNotificationBadge();

}


function initializeInstructorDashboard() {

    refreshInstructorDashboard();

}
