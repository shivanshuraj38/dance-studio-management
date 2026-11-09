/* =========================================
   DANCE STUDIO DATA LAYER  (step 1)
   All reading/writing of localStorage lives here.
   Other files should call these functions
   instead of touching localStorage directly.
   ========================================= */


/* =========================================
   CONSTANTS
   ========================================= */

/* Bump this number whenever the data shape changes.
   On a mismatch the stored data is reset and re-seeded. */
const DATA_VERSION = 2;

const REG_STATUS = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled"
};

const USER_STATUS = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    PENDING: "Pending"      /* new instructors wait for admin approval */
};


/* =========================================
   DEFAULT DATA
   ========================================= */

const defaultUsers = [

    {
        id: 1,
        name: "Admin User",
        email: "admin@dance.com",
        password: "admin123",
        role: "admin",
        status: USER_STATUS.ACTIVE
    },

    {
        id: 2,
        name: "Alex Instructor",
        email: "alex@dance.com",
        password: "alex123",
        role: "instructor",
        status: USER_STATUS.ACTIVE
    },

    {
        id: 3,
        name: "Sarah Instructor",
        email: "sarah@dance.com",
        password: "sarah123",
        role: "instructor",
        status: USER_STATUS.ACTIVE
    },

    {
        id: 4,
        name: "Rahul Instructor",
        email: "rahul@dance.com",
        password: "rahul123",
        role: "instructor",
        status: USER_STATUS.ACTIVE
    },

    {
        id: 5,
        name: "Aarav Sharma",
        email: "aarav@example.com",
        password: "student123",
        role: "student",
        status: USER_STATUS.ACTIVE
    }

];


/* Classes point to their instructor by EMAIL,
   not by name text, so renaming never breaks the link. */
const defaultClasses = [

    {
        id: 1,
        name: "Hip-Hop Beginners",
        description: "Learn basic hip-hop movements and choreography.",
        style: "Hip-Hop",
        instructorEmail: "alex@dance.com",
        day: "Monday",
        time: "5:00 PM - 6:00 PM",
        level: "Beginner",
        capacity: 20
    },

    {
        id: 2,
        name: "Contemporary Dance",
        description: "Explore expressive movement and contemporary techniques.",
        style: "Contemporary",
        instructorEmail: "sarah@dance.com",
        day: "Wednesday",
        time: "6:00 PM - 7:00 PM",
        level: "Intermediate",
        capacity: 15
    },

    {
        id: 3,
        name: "Bollywood Dance",
        description: "Learn energetic Bollywood choreography.",
        style: "Bollywood",
        instructorEmail: "rahul@dance.com",
        day: "Friday",
        time: "5:30 PM - 6:30 PM",
        level: "Beginner",
        capacity: 25
    }

];


/* =========================================
   LOW-LEVEL STORAGE HELPERS
   ========================================= */

function readStorage(key, fallback) {

    try {

        const raw = localStorage.getItem(key);

        if (raw === null) {
            return fallback;
        }

        return JSON.parse(raw);

    } catch (error) {

        console.error("Could not read '" + key + "':", error);

        return fallback;

    }

}


function writeStorage(key, value) {

    try {

        localStorage.setItem(key, JSON.stringify(value));

    } catch (error) {

        console.error("Could not save '" + key + "':", error);

    }

}


/* =========================================
   GENERAL UTILITIES
   ========================================= */

/* Escape text before putting it into innerHTML (prevents XSS). */
function escapeHTML(value) {

    return String(value === undefined || value === null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

}


/* Next sequential id for a list of records. */
function nextId(list) {

    let max = 0;

    list.forEach(function (item) {

        if (item.id > max) {
            max = item.id;
        }

    });

    return max + 1;

}


function normalizeEmail(email) {

    return String(email || "").trim().toLowerCase();

}


function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

}


function todayISO() {

    return new Date().toISOString().slice(0, 10);

}


/* "2026-10-31" -> "31 Oct 2026" */
function formatDate(isoDate) {

    const date = new Date(isoDate);

    if (isNaN(date.getTime())) {
        return isoDate || "";
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}


/* =========================================
   USERS
   ========================================= */

function getUsers() {

    return readStorage("users", []);

}


function saveUsers(users) {

    writeStorage("users", users);

}


function getUserByEmail(email) {

    const wanted = normalizeEmail(email);

    return getUsers().find(function (user) {

        return normalizeEmail(user.email) === wanted;

    }) || null;

}


function getUsersByRole(role) {

    return getUsers().filter(function (user) {

        return user.role === role;

    });

}


/* Display name for an email; falls back to the email itself. */
function getUserName(email) {

    const user = getUserByEmail(email);

    return user ? user.name : (email || "Unassigned");

}


/* Create a user. Returns { ok, message, user }. */
function createUser(details) {

    const name = String(details.name || "").trim();
    const email = normalizeEmail(details.email);
    const password = String(details.password || "");
    const role = details.role;

    if (name === "" || email === "" || password === "") {
        return { ok: false, message: "Please fill in all required fields." };
    }

    if (!isValidEmail(email)) {
        return { ok: false, message: "Please enter a valid email address." };
    }

    if (password.length < 6) {
        return { ok: false, message: "Password must be at least 6 characters." };
    }

    if (["student", "instructor", "admin"].indexOf(role) === -1) {
        return { ok: false, message: "Invalid role." };
    }

    if (getUserByEmail(email)) {
        return { ok: false, message: "An account with this email already exists." };
    }

    const users = getUsers();

    const user = {
        id: nextId(users),
        name: name,
        email: email,
        password: password,
        role: role,
        /* instructors need admin approval, everyone else is active */
        status: details.status ||
            (role === "instructor" ? USER_STATUS.PENDING : USER_STATUS.ACTIVE)
    };

    users.push(user);
    saveUsers(users);

    return { ok: true, message: "Account created.", user: user };

}


/* Update name / role / status of a user. Returns { ok, message }. */
function updateUser(userId, changes) {

    const users = getUsers();

    const user = users.find(function (item) {
        return item.id === userId;
    });

    if (!user) {
        return { ok: false, message: "User not found." };
    }

    const roleChanging =
        changes.role !== undefined && changes.role !== user.role;

    const leavingActive =
        changes.status !== undefined && changes.status !== USER_STATUS.ACTIVE;

    if (changes.status !== undefined &&
        [USER_STATUS.ACTIVE, USER_STATUS.INACTIVE, USER_STATUS.PENDING]
            .indexOf(changes.status) === -1) {
        return { ok: false, message: "Invalid status." };
    }

    if (user.role === "admin" &&
        getUsersByRole("admin").length === 1 &&
        (roleChanging || leavingActive)) {
        return {
            ok: false,
            message: "You cannot demote or deactivate the last admin."
        };
    }

    if (user.role === "instructor" &&
        roleChanging &&
        getClassesByInstructor(user.email).length > 0) {
        return {
            ok: false,
            message: "Reassign this instructor's classes before changing their role."
        };
    }

    if (changes.name !== undefined) {

        const name = String(changes.name).trim();

        if (name === "") {
            return { ok: false, message: "Name cannot be empty." };
        }

        user.name = name;

    }

    if (changes.role !== undefined) {

        if (["student", "instructor", "admin"].indexOf(changes.role) === -1) {
            return { ok: false, message: "Invalid role." };
        }

        user.role = changes.role;

    }

    if (changes.status !== undefined) {
        user.status = changes.status;
    }

    saveUsers(users);

    return { ok: true, message: "User updated." };

}


/* Delete a user and everything that belongs to them. */
function deleteUser(userId) {

    const users = getUsers();

    const user = users.find(function (item) {
        return item.id === userId;
    });

    if (!user) {
        return { ok: false, message: "User not found." };
    }

    if (user.role === "admin" && getUsersByRole("admin").length === 1) {
        return { ok: false, message: "You cannot delete the last admin." };
    }

    if (user.role === "instructor") {

        const hasClasses = getClasses().some(function (danceClass) {
            return danceClass.instructorEmail === user.email;
        });

        if (hasClasses) {
            return {
                ok: false,
                message: "Reassign this instructor's classes before deleting them."
            };
        }

    }

    saveUsers(users.filter(function (item) {
        return item.id !== userId;
    }));

    saveRegistrations(getRegistrations().filter(function (registration) {
        return registration.studentEmail !== user.email;
    }));

    saveNotifications(getNotifications().filter(function (notification) {
        return notification.userEmail !== user.email;
    }));

    savePasswordResets(getPasswordResets().filter(function (reset) {
        return reset.email !== user.email;
    }));

    return { ok: true, message: "User deleted." };

}


/* =========================================
   PASSWORDS  (change password + forgot password)

   There is no email server in this project, so the
   "forgot password" code is shown on the screen instead
   of being emailed. A real system would email it.
   ========================================= */

const RESET_MINUTES = 10;         /* how long a reset code works */
const RESET_MAX_ATTEMPTS = 5;     /* wrong codes allowed before it is cancelled */


/* Returns an error message, or "" when the password is fine. */
function validateNewPassword(password, confirmPassword) {

    if (String(password).length < 6) {
        return "Password must be at least 6 characters.";
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
        return "Passwords do not match.";
    }

    return "";

}


/* Logged-in user changes their own password.
   Returns { ok, message }. */
function changePassword(email, currentPassword, newPassword, confirmPassword) {

    const users = getUsers();

    const user = users.find(function (item) {
        return normalizeEmail(item.email) === normalizeEmail(email);
    });

    if (!user) {
        return { ok: false, message: "User not found." };
    }

    if (user.password !== currentPassword) {
        return { ok: false, message: "Your current password is incorrect." };
    }

    const error = validateNewPassword(newPassword, confirmPassword);

    if (error) {
        return { ok: false, message: error };
    }

    if (newPassword === currentPassword) {
        return {
            ok: false,
            message: "The new password must be different from the current one."
        };
    }

    user.password = newPassword;
    saveUsers(users);

    addNotification(user.email, "Your password was changed.");

    return { ok: true, message: "Password changed successfully." };

}


function getPasswordResets() {

    return readStorage("passwordResets", []);

}


function savePasswordResets(resets) {

    writeStorage("passwordResets", resets);

}


/* 6-digit code */
function randomResetCode() {

    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        return String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
    }

    return String(100000 + Math.floor(Math.random() * 900000));

}


/* Step 1 of "forgot password": make a code for this email.
   Returns { ok, message, code, minutes }. */
function createPasswordReset(email) {

    const user = getUserByEmail(email);

    if (!user) {
        return { ok: false, message: "No account found with this email." };
    }

    /* a new request replaces any older one for the same account */
    const resets = getPasswordResets().filter(function (item) {
        return item.email !== user.email;
    });

    const code = randomResetCode();

    resets.push({
        email: user.email,
        code: code,
        expires: Date.now() + RESET_MINUTES * 60 * 1000,
        attempts: 0
    });

    savePasswordResets(resets);

    return {
        ok: true,
        message: "Reset code created.",
        code: code,
        minutes: RESET_MINUTES
    };

}


/* Step 2 of "forgot password": code + new password.
   Returns { ok, message, restart } - restart is true when the
   person has to ask for a new code. */
function resetPasswordWithCode(email, code, newPassword, confirmPassword) {

    const wanted = normalizeEmail(email);

    const users = getUsers();

    const user = users.find(function (item) {
        return normalizeEmail(item.email) === wanted;
    });

    const resets = getPasswordResets();

    const reset = resets.find(function (item) {
        return item.email === wanted;
    });

    if (!user || !reset) {
        return {
            ok: false,
            restart: true,
            message: "No reset request found. Please request a new code."
        };
    }

    if (Date.now() > reset.expires) {

        savePasswordResets(resets.filter(function (item) {
            return item !== reset;
        }));

        return {
            ok: false,
            restart: true,
            message: "This code has expired. Please request a new one."
        };

    }

    if (String(code).trim() !== reset.code) {

        reset.attempts++;

        if (reset.attempts >= RESET_MAX_ATTEMPTS) {

            savePasswordResets(resets.filter(function (item) {
                return item !== reset;
            }));

            return {
                ok: false,
                restart: true,
                message: "Too many wrong attempts. Please request a new code."
            };

        }

        savePasswordResets(resets);

        return { ok: false, message: "Incorrect code." };

    }

    /* the code is right; a bad password does not use it up */
    const error = validateNewPassword(newPassword, confirmPassword);

    if (error) {
        return { ok: false, message: error };
    }

    user.password = newPassword;
    saveUsers(users);

    savePasswordResets(resets.filter(function (item) {
        return item !== reset;
    }));

    addNotification(user.email, "Your password was reset.");

    return {
        ok: true,
        message: "Password reset successfully. You can now log in."
    };

}


/* Admin sets a random temporary password for another user.
   Returns { ok, message, password } - the password is shown to the
   admin once; the user should change it after logging in. */
function adminResetPassword(userId, adminEmail) {

    const users = getUsers();

    const user = users.find(function (item) {
        return item.id === userId;
    });

    if (!user) {
        return { ok: false, message: "User not found." };
    }

    if (normalizeEmail(user.email) === normalizeEmail(adminEmail)) {
        return {
            ok: false,
            message: "Use Change Password to change your own password."
        };
    }

    /* no confusing characters such as 0/O or 1/l/I */
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

    let password = "";

    for (let i = 0; i < 8; i++) {

        const number = (typeof crypto !== "undefined" && crypto.getRandomValues)
            ? crypto.getRandomValues(new Uint32Array(1))[0]
            : Math.floor(Math.random() * 4294967296);

        password += letters.charAt(number % letters.length);

    }

    user.password = password;
    saveUsers(users);

    /* any pending "forgot password" code is no longer needed */
    savePasswordResets(getPasswordResets().filter(function (reset) {
        return reset.email !== user.email;
    }));

    addNotification(
        user.email,
        "An admin reset your password. Please change it after you log in."
    );

    return {
        ok: true,
        message: "Password reset for " + user.name + ".",
        password: password
    };

}


/* =========================================
   CLASSES
   ========================================= */

function getClasses() {

    return readStorage("classes", []);

}


function saveClasses(classes) {

    writeStorage("classes", classes);

}


function getClassById(classId) {

    return getClasses().find(function (danceClass) {

        return danceClass.id === classId;

    }) || null;

}


function getClassesByInstructor(email) {

    const wanted = normalizeEmail(email);

    return getClasses().filter(function (danceClass) {

        return normalizeEmail(danceClass.instructorEmail) === wanted;

    });

}


/* Validate class details. Returns an error message or "". */
function validateClassDetails(details) {

    if (!details.name || !details.style || !details.instructorEmail ||
        !details.day || !details.time || !details.level) {
        return "Please fill in all class details.";
    }

    if (!getUserByEmail(details.instructorEmail) ||
        getUserByEmail(details.instructorEmail).role !== "instructor") {
        return "Please choose a valid instructor.";
    }

    if (!Number.isInteger(details.capacity) || details.capacity < 1) {
        return "Capacity must be a whole number of at least 1.";
    }

    return "";

}


/* Create a class. Returns { ok, message, danceClass }. */
function createClass(details) {

    const cleaned = {
        name: String(details.name || "").trim(),
        description: String(details.description || "").trim(),
        style: String(details.style || "").trim(),
        instructorEmail: normalizeEmail(details.instructorEmail),
        day: String(details.day || "").trim(),
        time: String(details.time || "").trim(),
        level: String(details.level || "").trim(),
        capacity: Number(details.capacity)
    };

    const error = validateClassDetails(cleaned);

    if (error) {
        return { ok: false, message: error };
    }

    const classes = getClasses();

    cleaned.id = nextId(classes);

    classes.push(cleaned);
    saveClasses(classes);

    return { ok: true, message: "Class added successfully.", danceClass: cleaned };

}


/* Update a class. Returns { ok, message }. */
function updateClass(classId, changes) {

    const classes = getClasses();

    const danceClass = classes.find(function (item) {
        return item.id === classId;
    });

    if (!danceClass) {
        return { ok: false, message: "Class not found." };
    }

    const updated = Object.assign({}, danceClass, changes);

    updated.name = String(updated.name || "").trim();
    updated.style = String(updated.style || "").trim();
    updated.day = String(updated.day || "").trim();
    updated.time = String(updated.time || "").trim();
    updated.level = String(updated.level || "").trim();
    updated.description = String(updated.description || "").trim();
    updated.instructorEmail = normalizeEmail(updated.instructorEmail);
    updated.capacity = Number(updated.capacity);

    const error = validateClassDetails(updated);

    if (error) {
        return { ok: false, message: error };
    }

    /* capacity cannot drop below seats already taken */
    const taken = getSeatsTaken(classId);

    if (updated.capacity < taken) {
        return {
            ok: false,
            message: "Capacity cannot be lower than the " + taken +
                " seat(s) already taken."
        };
    }

    Object.assign(danceClass, updated);
    saveClasses(classes);

    return { ok: true, message: "Class updated successfully." };

}


/* Delete a class, its registrations, and tell affected students. */
function deleteClass(classId) {

    const danceClass = getClassById(classId);

    if (!danceClass) {
        return { ok: false, message: "Class not found." };
    }

    getRegistrationsForClass(classId).forEach(function (registration) {

        if (isActiveRegistration(registration)) {

            addNotification(
                registration.studentEmail,
                "The class \"" + danceClass.name + "\" has been cancelled by the studio."
            );

        }

    });

    saveRegistrations(getRegistrations().filter(function (registration) {
        return registration.classId !== classId;
    }));

    saveClasses(getClasses().filter(function (item) {
        return item.id !== classId;
    }));

    return { ok: true, message: "Class deleted successfully." };

}


/* =========================================
   REGISTRATIONS
   A registration stores only ids/emails; names are
   looked up when displaying, so they never go stale.
   ========================================= */

function getRegistrations() {

    return readStorage("registrations", []);

}


function saveRegistrations(registrations) {

    writeStorage("registrations", registrations);

}


function getRegistrationById(registrationId) {

    return getRegistrations().find(function (registration) {

        return registration.id === registrationId;

    }) || null;

}


function getRegistrationsForClass(classId) {

    return getRegistrations().filter(function (registration) {

        return registration.classId === classId;

    });

}


function getRegistrationsForStudent(email) {

    const wanted = normalizeEmail(email);

    return getRegistrations().filter(function (registration) {

        return normalizeEmail(registration.studentEmail) === wanted;

    });

}


/* Registrations that still use up a seat (Pending or Approved). */
function isActiveRegistration(registration) {

    return (
        registration.status === REG_STATUS.PENDING ||
        registration.status === REG_STATUS.APPROVED
    );

}


/* Seats used = Pending + Approved. */
function getSeatsTaken(classId) {

    return getRegistrationsForClass(classId).filter(isActiveRegistration).length;

}


function getSeatsLeft(classId) {

    const danceClass = getClassById(classId);

    if (!danceClass) {
        return 0;
    }

    return Math.max(danceClass.capacity - getSeatsTaken(classId), 0);

}


function isClassFull(classId) {

    return getSeatsLeft(classId) === 0;

}


/* Student asks to join a class. Returns { ok, message }. */
function createRegistration(studentEmail, classId) {

    const student = getUserByEmail(studentEmail);

    if (!student || student.role !== "student") {
        return { ok: false, message: "Only students can register for classes." };
    }

    const danceClass = getClassById(classId);

    if (!danceClass) {
        return { ok: false, message: "Class not found." };
    }

    const duplicate = getRegistrationsForStudent(studentEmail).some(function (registration) {

        return registration.classId === classId && isActiveRegistration(registration);

    });

    if (duplicate) {
        return { ok: false, message: "You have already registered for this class." };
    }

    if (isClassFull(classId)) {
        return { ok: false, message: "This class is currently full." };
    }

    const registrations = getRegistrations();

    registrations.push({
        id: nextId(registrations),
        classId: classId,
        studentEmail: student.email,
        date: todayISO(),
        status: REG_STATUS.PENDING
    });

    saveRegistrations(registrations);

    /* confirmation for the student */
    addNotification(
        student.email,
        "Your registration for " + danceClass.name + " has been submitted and is Pending."
    );

    /* heads-up for the instructor and admins */
    addNotification(
        danceClass.instructorEmail,
        student.name + " requested to join " + danceClass.name + "."
    );

    getUsersByRole("admin").forEach(function (admin) {

        addNotification(
            admin.email,
            student.name + " requested to join " + danceClass.name + "."
        );

    });

    return { ok: true, message: "Registration submitted successfully! Status: Pending" };

}


/* Change the status of a registration (admin approve/reject,
   student cancel). Returns { ok, message }. */
function setRegistrationStatus(registrationId, newStatus) {

    const allowed = [
        REG_STATUS.APPROVED,
        REG_STATUS.REJECTED,
        REG_STATUS.CANCELLED
    ];

    if (allowed.indexOf(newStatus) === -1) {
        return { ok: false, message: "Invalid status." };
    }

    const registrations = getRegistrations();

    const registration = registrations.find(function (item) {
        return item.id === registrationId;
    });

    if (!registration) {
        return { ok: false, message: "Registration not found." };
    }

    if (registration.status === newStatus) {
        return { ok: false, message: "Registration is already " + newStatus + "." };
    }

    if (registration.status === REG_STATUS.CANCELLED) {
        return { ok: false, message: "A cancelled registration cannot be changed." };
    }

    if (newStatus === REG_STATUS.CANCELLED && !isActiveRegistration(registration)) {
        return { ok: false, message: "Only pending or approved registrations can be cancelled." };
    }

    /* bringing back a Rejected registration needs a free seat */
    if (newStatus === REG_STATUS.APPROVED &&
        !isActiveRegistration(registration) &&
        isClassFull(registration.classId)) {
        return {
            ok: false,
            message: "This class is full, so the registration cannot be approved."
        };
    }

    registration.status = newStatus;
    saveRegistrations(registrations);

    const danceClass = getClassById(registration.classId);
    const className = danceClass ? danceClass.name : "a class";

    if (newStatus === REG_STATUS.CANCELLED) {

        if (danceClass) {

            addNotification(
                danceClass.instructorEmail,
                getUserName(registration.studentEmail) +
                " cancelled their registration for " + className + "."
            );

        }

    } else {

        addNotification(
            registration.studentEmail,
            "Your registration for " + className + " has been " + newStatus + "."
        );

    }

    return { ok: true, message: "Registration " + newStatus.toLowerCase() + "." };

}


/* =========================================
   NOTIFICATIONS
   ========================================= */

function getNotifications() {

    return readStorage("notifications", []);

}


function saveNotifications(notifications) {

    writeStorage("notifications", notifications);

}


function addNotification(userEmail, message) {

    const notifications = getNotifications();

    notifications.push({
        id: nextId(notifications),
        userEmail: normalizeEmail(userEmail),
        message: message,
        date: new Date().toISOString(),
        read: false
    });

    saveNotifications(notifications);

}


/* Newest first. */
function getUserNotifications(userEmail) {

    const wanted = normalizeEmail(userEmail);

    return getNotifications()
        .filter(function (notification) {
            return notification.userEmail === wanted;
        })
        .reverse();

}


function getUnreadCount(userEmail) {

    return getUserNotifications(userEmail).filter(function (notification) {
        return !notification.read;
    }).length;

}


function markNotificationRead(notificationId) {

    const notifications = getNotifications();

    const notification = notifications.find(function (item) {
        return item.id === notificationId;
    });

    if (notification) {

        notification.read = true;
        saveNotifications(notifications);

    }

}


function markAllNotificationsRead(userEmail) {

    const wanted = normalizeEmail(userEmail);
    const notifications = getNotifications();

    notifications.forEach(function (notification) {

        if (notification.userEmail === wanted) {
            notification.read = true;
        }

    });

    saveNotifications(notifications);

}


/* =========================================
   REPORTS  (live numbers for the dashboards)
   ========================================= */

function countRegistrationsByStatus(registrations) {

    const counts = {};

    counts[REG_STATUS.PENDING] = 0;
    counts[REG_STATUS.APPROVED] = 0;
    counts[REG_STATUS.REJECTED] = 0;
    counts[REG_STATUS.CANCELLED] = 0;

    registrations.forEach(function (registration) {
        counts[registration.status] = (counts[registration.status] || 0) + 1;
    });

    return counts;

}


function getReportStats() {

    const users = getUsers();
    const classes = getClasses();
    const registrations = getRegistrations();

    const students = users.filter(function (user) { return user.role === "student"; });
    const instructors = users.filter(function (user) { return user.role === "instructor"; });

    const byStatus = countRegistrationsByStatus(registrations);

    /* seats per class for the "class fill" report */
    const classUsage = classes.map(function (danceClass) {

        return {
            id: danceClass.id,
            name: danceClass.name,
            capacity: danceClass.capacity,
            taken: getSeatsTaken(danceClass.id)
        };

    });

    return {
        totalStudents: students.length,
        activeStudents: students.filter(function (user) {
            return user.status === USER_STATUS.ACTIVE;
        }).length,
        totalInstructors: instructors.length,
        pendingInstructors: instructors.filter(function (user) {
            return user.status === USER_STATUS.PENDING;
        }).length,
        totalClasses: classes.length,
        totalRegistrations: registrations.length,
        registrationsByStatus: byStatus,
        classUsage: classUsage
    };

}


/* =========================================
   INITIALIZE DATA
   ========================================= */

function initializeData() {

    const storedVersion = Number(localStorage.getItem("dataVersion"));

    /* Old/incompatible data (from the first version of the project)
       is cleared once and replaced with fresh sample data. */
    if (storedVersion !== DATA_VERSION) {

        ["users", "classes", "registrations", "notifications", "currentUser"]
            .forEach(function (key) {
                localStorage.removeItem(key);
            });

        localStorage.setItem("dataVersion", String(DATA_VERSION));

    }

    if (localStorage.getItem("users") === null) {
        saveUsers(defaultUsers);
    }

    if (localStorage.getItem("classes") === null) {
        saveClasses(defaultClasses);
    }

    if (localStorage.getItem("registrations") === null) {
        saveRegistrations([]);
    }

    if (localStorage.getItem("notifications") === null) {
        saveNotifications([]);
    }

}


initializeData();
