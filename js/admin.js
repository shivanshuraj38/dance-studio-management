/* =========================================
   ADMIN DASHBOARD  (step 3)
   Needs data.js, auth.js and ui.js to be loaded first.

   Shared helpers ($, statusBadge, showResult, notifications ...)
   now live in ui.js.

   NOTE: function names here start with "handle" or
   "render" on purpose, so they never clash with the
   functions in data.js (createClass, deleteClass, ...).
   ========================================= */


let editingClassId = null;
let editingUserId = null;


/* "17:00" -> "5:00 PM" */
function formatTime12(value) {

    const parts = value.split(":");
    let hours = Number(parts[0]);
    const minutes = parts[1];
    const suffix = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;

    if (hours === 0) {
        hours = 12;
    }

    return hours + ":" + minutes + " " + suffix;

}


/* =========================================
   STATISTICS
   ========================================= */

function renderStats() {

    const stats = getReportStats();

    setText("statStudents", stats.totalStudents);
    setText("statInstructors", stats.totalInstructors);
    setText("statClasses", stats.totalClasses);
    setText(
        "statPending",
        stats.registrationsByStatus[REG_STATUS.PENDING]
    );

}


/* =========================================
   USER MANAGEMENT
   ========================================= */

function renderUsers() {

    const table = $("adminUserTable");

    if (!table) {
        return;
    }

    const query = $("userSearch").value;
    const roleFilter = $("userRoleFilter").value;
    const me = getCurrentUser();

    const users = getUsers().filter(function (user) {

        return (
            (roleFilter === "" || user.role === roleFilter) &&
            matchesQuery([user.name, user.email], query)
        );

    });

    table.innerHTML = "";

    if (users.length === 0) {

        table.innerHTML = emptyRow(5, "No users found.");

        return;

    }

    users.forEach(function (user) {

        const isSelf = me && me.email === user.email;

        let actions =
            '<button type="button" class="btn-small" ' +
            'onclick="openUserDialog(' + user.id + ')">Edit</button>';

        if (user.status === USER_STATUS.PENDING) {

            actions +=
                '<button type="button" class="btn-small btn-success" ' +
                'onclick="handleApproveUser(' + user.id + ')">Approve</button>';

        } else if (!isSelf) {

            const label =
                user.status === USER_STATUS.ACTIVE ? "Deactivate" : "Activate";

            actions +=
                '<button type="button" class="btn-small btn-secondary" ' +
                'onclick="handleToggleUser(' + user.id + ')">' +
                label + "</button>";

        }

        if (!isSelf) {

            actions +=
                '<button type="button" class="btn-small btn-secondary" ' +
                'onclick="handleResetUserPassword(' + user.id +
                ')">Reset Password</button>';

            actions +=
                '<button type="button" class="btn-small btn-danger" ' +
                'onclick="handleDeleteUser(' + user.id + ')">Delete</button>';

        }

        const row = document.createElement("tr");

        row.innerHTML =
            "<td>" + escapeHTML(user.name) + (isSelf ? " (you)" : "") + "</td>" +
            "<td>" + escapeHTML(user.email) + "</td>" +
            "<td>" + escapeHTML(capitalize(user.role)) + "</td>" +
            "<td>" + statusBadge(user.status) + "</td>" +
            "<td>" + actions + "</td>";

        table.appendChild(row);

    });

}


/* ---------- Edit user (dialog) ---------- */

function openUserDialog(userId) {

    const user = getUsers().find(function (item) {
        return item.id === userId;
    });

    if (!user) {

        showToast("User not found.", "error");

        return;

    }

    const me = getCurrentUser();
    const isSelf = me && me.email === user.email;

    editingUserId = userId;

    $("editUserEmail").value = user.email;
    $("editUserName").value = user.name;
    $("editUserRole").value = user.role;
    $("editUserStatus").value = user.status;

    /* an admin cannot change their own role or status */
    $("editUserRole").disabled = isSelf;
    $("editUserStatus").disabled = isSelf;

    $("userDialog").showModal();

}


function closeUserDialog() {

    editingUserId = null;

    $("userDialog").close();

}


function handleSaveUser(event) {

    event.preventDefault();

    const result = updateUser(editingUserId, {
        name: $("editUserName").value,
        role: $("editUserRole").value,
        status: $("editUserStatus").value
    });

    showResult(result);

    if (result.ok) {

        closeUserDialog();

        refreshDashboard();

    }

}


/* ---------- Reset a user's password ---------- */

function handleResetUserPassword(userId) {

    const user = getUsers().find(function (item) {
        return item.id === userId;
    });

    if (!user) {
        return;
    }

    const confirmed = confirm(
        "Reset the password for " + user.name + "? " +
        "Their current password will stop working."
    );

    if (!confirmed) {
        return;
    }

    const me = getCurrentUser();

    const result = adminResetPassword(userId, me ? me.email : "");

    if (!result.ok) {

        showToast(result.message, "error");

        return;

    }

    setText("tempPasswordUser", user.name);
    setText("tempPasswordValue", result.password);

    $("tempPasswordDialog").showModal();

    renderNotifications();

}


function closeTempPasswordDialog() {

    /* do not leave the password sitting in the page */
    setText("tempPasswordValue", "");

    $("tempPasswordDialog").close();

}


/* ---------- Approve / activate / deactivate / delete ---------- */

function handleApproveUser(userId) {

    const result = updateUser(userId, { status: USER_STATUS.ACTIVE });

    if (result.ok) {

        const user = getUsers().find(function (item) {
            return item.id === userId;
        });

        addNotification(
            user.email,
            "Your account has been approved. Welcome to the studio!"
        );

        showToast(user.name + " has been approved.", "success");

    } else {

        showResult(result);

    }

    refreshDashboard();

}


function handleToggleUser(userId) {

    const user = getUsers().find(function (item) {
        return item.id === userId;
    });

    if (!user) {
        return;
    }

    const newStatus =
        user.status === USER_STATUS.ACTIVE
            ? USER_STATUS.INACTIVE
            : USER_STATUS.ACTIVE;

    const result = updateUser(userId, { status: newStatus });

    if (result.ok) {

        showToast(user.name + " is now " + newStatus + ".", "success");

    } else {

        showResult(result);

    }

    refreshDashboard();

}


function handleDeleteUser(userId) {

    const user = getUsers().find(function (item) {
        return item.id === userId;
    });

    if (!user) {
        return;
    }

    const confirmed = confirm(
        "Delete " + user.name + "? Their registrations and " +
        "notifications will also be removed."
    );

    if (!confirmed) {
        return;
    }

    showResult(deleteUser(userId));

    refreshDashboard();

}


/* =========================================
   CLASS MANAGEMENT
   ========================================= */

/* Fill the instructor drop-down with active instructors. */
function populateInstructorSelect(keepEmail) {

    const select = $("classInstructor");

    if (!select) {
        return;
    }

    const current = keepEmail !== undefined ? keepEmail : select.value;

    select.innerHTML = "";

    const placeholder = document.createElement("option");

    placeholder.value = "";
    placeholder.textContent = "Select Instructor";

    select.appendChild(placeholder);

    getUsersByRole("instructor").forEach(function (instructor) {

        /* include an inactive instructor only if this class
           already belongs to them */
        if (instructor.status !== USER_STATUS.ACTIVE &&
            instructor.email !== current) {
            return;
        }

        const option = document.createElement("option");

        option.value = instructor.email;
        option.textContent = instructor.name;

        select.appendChild(option);

    });

    select.value = current || "";

}


function renderClasses() {

    const table = $("adminClassTable");

    if (!table) {
        return;
    }

    const query = $("classSearch").value;

    const classes = getClasses().filter(function (danceClass) {

        return matchesQuery(
            [
                danceClass.name,
                danceClass.style,
                danceClass.level,
                danceClass.day,
                getUserName(danceClass.instructorEmail)
            ],
            query
        );

    });

    table.innerHTML = "";

    if (classes.length === 0) {

        table.innerHTML = emptyRow(7, "No classes found.");

        return;

    }

    classes.forEach(function (danceClass) {

        const row = document.createElement("tr");

        row.innerHTML =
            "<td>" + escapeHTML(danceClass.name) + "</td>" +
            "<td>" + escapeHTML(danceClass.style) + "</td>" +
            "<td>" + escapeHTML(danceClass.level) + "</td>" +
            "<td>" + escapeHTML(getUserName(danceClass.instructorEmail)) + "</td>" +
            "<td>" + escapeHTML(danceClass.day + ", " + danceClass.time) + "</td>" +
            "<td>" + getSeatsTaken(danceClass.id) + " / " +
                danceClass.capacity + "</td>" +
            "<td>" +
                '<button type="button" class="btn-small" ' +
                'onclick="handleEditClass(' + danceClass.id + ')">Edit</button>' +
                '<button type="button" class="btn-small btn-danger" ' +
                'onclick="handleDeleteClass(' + danceClass.id + ')">Delete</button>' +
            "</td>";

        table.appendChild(row);

    });

}


/* ---------- Add / save class ---------- */

function handleSubmitClassForm() {

    const start = $("classStart").value;
    const end = $("classEnd").value;

    if (start === "" || end === "") {

        showToast("Please choose a start and end time.", "error");

        return;

    }

    /* "HH:MM" strings compare correctly as text */
    if (end <= start) {

        showToast("End time must be after the start time.", "error");

        return;

    }

    const details = {
        name: $("className").value,
        description: $("classDescription").value,
        style: $("classStyle").value,
        instructorEmail: $("classInstructor").value,
        day: $("classDay").value,
        time: formatTime12(start) + " - " + formatTime12(end),
        level: $("classLevel").value,
        capacity: Number($("classCapacity").value)
    };

    const result =
        editingClassId === null
            ? createClass(details)
            : updateClass(editingClassId, details);

    showResult(result);

    if (result.ok) {

        resetClassForm();

        refreshDashboard();

    }

}


/* ---------- Edit class (fills the form above) ---------- */

function handleEditClass(classId) {

    const danceClass = getClassById(classId);

    if (!danceClass) {

        showToast("Class not found.", "error");

        return;

    }

    editingClassId = classId;

    populateInstructorSelect(danceClass.instructorEmail);

    const times = String(danceClass.time).split("-");

    $("className").value = danceClass.name;
    $("classDescription").value = danceClass.description || "";
    $("classStyle").value = danceClass.style;
    $("classInstructor").value = danceClass.instructorEmail;
    $("classDay").value = danceClass.day;
    $("classStart").value = times[0] ? parseTime24(times[0]) : "";
    $("classEnd").value = times[1] ? parseTime24(times[1]) : "";
    $("classLevel").value = danceClass.level;
    $("classCapacity").value = danceClass.capacity;

    $("classFormTitle").textContent = "Edit Dance Class";
    $("classSubmitButton").textContent = "Save Changes";
    $("classCancelButton").hidden = false;

    $("classFormBox").scrollIntoView({ behavior: "smooth" });

}


function resetClassForm() {

    editingClassId = null;

    $("className").value = "";
    $("classDescription").value = "";
    $("classStyle").value = "";
    $("classDay").value = "";
    $("classStart").value = "";
    $("classEnd").value = "";
    $("classLevel").value = "";
    $("classCapacity").value = "";

    populateInstructorSelect("");

    $("classFormTitle").textContent = "Add New Dance Class";
    $("classSubmitButton").textContent = "Add Class";
    $("classCancelButton").hidden = true;

}


/* ---------- Delete class ---------- */

function handleDeleteClass(classId) {

    const danceClass = getClassById(classId);

    if (!danceClass) {
        return;
    }

    const count = getRegistrationsForClass(classId).length;

    let message = "Delete \"" + danceClass.name + "\"?";

    if (count > 0) {
        message += " Its " + count + " registration(s) will also be removed.";
    }

    if (!confirm(message)) {
        return;
    }

    if (editingClassId === classId) {
        resetClassForm();
    }

    showResult(deleteClass(classId));

    refreshDashboard();

}


/* =========================================
   REGISTRATION REQUESTS
   ========================================= */

function renderRegistrations() {

    const table = $("adminRegistrationTable");

    if (!table) {
        return;
    }

    const query = $("registrationSearch").value;
    const statusFilter = $("registrationStatusFilter").value;

    /* newest first */
    const registrations = getRegistrations().slice().reverse();

    table.innerHTML = "";

    let shown = 0;

    registrations.forEach(function (registration) {

        const danceClass = getClassById(registration.classId);

        const studentName = getUserName(registration.studentEmail);
        const className = danceClass ? danceClass.name : "(deleted class)";
        const instructorName =
            danceClass ? getUserName(danceClass.instructorEmail) : "-";

        if (statusFilter !== "" && registration.status !== statusFilter) {
            return;
        }

        if (!matchesQuery([studentName, className, instructorName], query)) {
            return;
        }

        let actions = "—";

        const approveButton =
            '<button type="button" class="btn-small btn-success" ' +
            'onclick="handleRegistrationStatus(' + registration.id +
            ", 'Approved')\">Approve</button>";

        const rejectButton =
            '<button type="button" class="btn-small btn-danger" ' +
            'onclick="handleRegistrationStatus(' + registration.id +
            ", 'Rejected')\">Reject</button>";

        if (registration.status === REG_STATUS.PENDING) {

            actions = approveButton + rejectButton;

        } else if (registration.status === REG_STATUS.APPROVED) {

            actions = rejectButton;

        } else if (registration.status === REG_STATUS.REJECTED) {

            actions = approveButton;

        }

        const row = document.createElement("tr");

        row.innerHTML =
            "<td>" + escapeHTML(studentName) + "</td>" +
            "<td>" + escapeHTML(className) + "</td>" +
            "<td>" + escapeHTML(instructorName) + "</td>" +
            "<td>" + escapeHTML(formatDate(registration.date)) + "</td>" +
            "<td>" + statusBadge(registration.status) + "</td>" +
            "<td>" + actions + "</td>";

        table.appendChild(row);

        shown++;

    });

    if (shown === 0) {

        table.innerHTML = emptyRow(6, "No registration requests found.");

    }

}


function handleRegistrationStatus(registrationId, newStatus) {

    showResult(setRegistrationStatus(registrationId, newStatus));

    refreshDashboard();

}


/* =========================================
   REPORTS  (all numbers come from live data)
   ========================================= */

function renderReports() {

    const stats = getReportStats();
    const byStatus = stats.registrationsByStatus;

    $("studentReport").innerHTML =
        "<p>Total Students: " + stats.totalStudents + "</p>" +
        "<p>Active Students: " + stats.activeStudents + "</p>" +
        "<p>Instructors: " + stats.totalInstructors + "</p>" +
        "<p>Instructors awaiting approval: " + stats.pendingInstructors + "</p>";

    $("classReport").innerHTML =
        "<p>Total Classes: " + stats.totalClasses + "</p>" +
        "<p>Total Registrations: " + stats.totalRegistrations + "</p>";

    $("registrationReport").innerHTML =
        "<p>Pending: " + byStatus[REG_STATUS.PENDING] + "</p>" +
        "<p>Approved: " + byStatus[REG_STATUS.APPROVED] + "</p>" +
        "<p>Rejected: " + byStatus[REG_STATUS.REJECTED] + "</p>" +
        "<p>Cancelled: " + byStatus[REG_STATUS.CANCELLED] + "</p>";

    if (stats.classUsage.length === 0) {

        $("usageReport").innerHTML = "<p>No classes yet.</p>";

        return;

    }

    $("usageReport").innerHTML = stats.classUsage.map(function (item) {

        return (
            "<p>" + escapeHTML(item.name) + ": " +
            item.taken + " / " + item.capacity + " seats</p>" +
            '<progress value="' + item.taken +
            '" max="' + item.capacity + '"></progress>'
        );

    }).join("");

}


/* =========================================
   REFRESH + START
   ========================================= */

function refreshDashboard() {

    renderStats();
    renderUsers();
    populateInstructorSelect();
    renderClasses();
    renderRegistrations();
    renderReports();
    renderNotifications();
    updateNotificationBadge();

}


function initializeAdminDashboard() {

    populateInstructorSelect("");

    refreshDashboard();

}
