/* =========================================
   AUTHENTICATION SYSTEM  (step 2)
   Needs data.js to be loaded first.
   ========================================= */


/* =========================================
   TOAST MESSAGES  (replaces alert())
   ========================================= */

function showToast(message, type) {

    type = type || "info";      /* "success" | "error" | "info" */

    let container = document.getElementById("toastContainer");

    if (!container) {

        container = document.createElement("div");
        container.id = "toastContainer";
        container.setAttribute("aria-live", "polite");

        document.body.appendChild(container);

    }

    const toast = document.createElement("div");

    toast.className = "toast toast-" + type;
    toast.textContent = message;            /* textContent = safe */

    container.appendChild(toast);

    setTimeout(function () {

        toast.classList.add("toast-hide");

        setTimeout(function () {
            toast.remove();
        }, 300);

    }, 3500);

}


/* A "flash" message survives a page redirect and is shown
   once on the next page (e.g. "Login successful"). */

function setFlashMessage(message, type) {

    try {

        sessionStorage.setItem(
            "flashMessage",
            JSON.stringify({ message: message, type: type || "info" })
        );

    } catch (error) {

        console.error("Could not save flash message:", error);

    }

}


function showFlashMessage() {

    try {

        const raw = sessionStorage.getItem("flashMessage");

        if (!raw) {
            return;
        }

        sessionStorage.removeItem("flashMessage");

        const flash = JSON.parse(raw);

        showToast(flash.message, flash.type);

    } catch (error) {

        console.error("Could not show flash message:", error);

    }

}


document.addEventListener("DOMContentLoaded", showFlashMessage);


/* =========================================
   SESSION
   Only id, name, email and role are stored in the
   session. The password is never saved there.
   ========================================= */

function makeSession(user) {

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    };

}


function saveCurrentUser(user) {

    writeStorage("currentUser", makeSession(user));

}


/* Returns the logged-in user, or null.
   The session is checked against the user list every time,
   so a deleted or deactivated user is logged out automatically
   and name/role changes made by the admin show up straight away. */
function getCurrentUser() {

    const session = readStorage("currentUser", null);

    if (!session || !session.email) {
        return null;
    }

    const user = getUserByEmail(session.email);

    if (!user || user.status !== USER_STATUS.ACTIVE) {

        localStorage.removeItem("currentUser");

        return null;

    }

    return makeSession(user);

}


/* ---------- Logout ---------- */

function logoutUser() {

    localStorage.removeItem("currentUser");

    setFlashMessage("You have been logged out.", "info");

    window.location.href = "login.html";

}


/* ---------- Redirect According to Role ---------- */

function redirectUser(user) {

    if (user.role === "admin") {

        window.location.href = "admin.html";

    } else if (user.role === "instructor") {

        window.location.href = "instructor.html";

    } else if (user.role === "student") {

        window.location.href = "student.html";

    }

}


/* =========================================
   LOGIN
   ========================================= */

function loginUser(event) {

    event.preventDefault();

    const email = normalizeEmail(document.getElementById("email").value);
    const password = document.getElementById("password").value;

    if (email === "" || password === "") {

        showToast("Please enter your email and password.", "error");

        return;

    }

    const user = getUserByEmail(email);

    /* same message for "no such user" and "wrong password"
       so the form does not reveal which emails exist */
    if (!user || user.password !== password) {

        showToast("Invalid email or password.", "error");

        return;

    }

    if (user.status === USER_STATUS.PENDING) {

        showToast(
            "Your instructor account is waiting for admin approval.",
            "info"
        );

        return;

    }

    if (user.status !== USER_STATUS.ACTIVE) {

        showToast(
            "Your account has been deactivated. Please contact the studio.",
            "error"
        );

        return;

    }

    const button = event.target.querySelector("button[type='submit']");

    if (button) {
        button.disabled = true;
    }

    saveCurrentUser(user);

    setFlashMessage("Welcome back, " + user.name + "!", "success");

    redirectUser(user);

}


/* =========================================
   REGISTER
   ========================================= */

function registerUser(event) {

    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const roleElement = document.getElementById("role");

    const confirmElement = document.getElementById("confirmPassword");

    if (confirmElement && confirmElement.value !== password) {

        showToast("Passwords do not match.", "error");

        return;

    }

    /* The form can only create students or instructors.
       An admin account can never be created from here. */
    let role = "student";

    if (roleElement && roleElement.value === "instructor") {
        role = "instructor";
    }

    const result = createUser({
        name: name,
        email: email,
        password: password,
        role: role
    });

    if (!result.ok) {

        showToast(result.message, "error");

        return;

    }

    const button = event.target.querySelector("button[type='submit']");

    if (button) {
        button.disabled = true;
    }

    if (role === "instructor") {

        /* tell the admins there is someone to approve */
        getUsersByRole("admin").forEach(function (admin) {

            addNotification(
                admin.email,
                "New instructor registration from " + result.user.name +
                " needs approval."
            );

        });

        setFlashMessage(
            "Account created. An admin must approve your instructor " +
            "account before you can log in.",
            "info"
        );

    } else {

        setFlashMessage(
            "Registration successful! You can now log in.",
            "success"
        );

    }

    window.location.href = "login.html";

}


/* =========================================
   PROTECT DASHBOARD PAGES
   Returns true only if the visitor may stay on the page.
   ========================================= */

function protectPage(requiredRole) {

    const currentUser = getCurrentUser();

    if (!currentUser) {

        setFlashMessage("Please log in first.", "error");

        window.location.href = "login.html";

        return false;

    }

    if (requiredRole && currentUser.role !== requiredRole) {

        setFlashMessage(
            "You do not have permission to access that page.",
            "error"
        );

        redirectUser(currentUser);

        return false;

    }

    return true;

}


/* =========================================
   DISPLAY USER NAME
   ========================================= */

function displayUserName(elementId) {

    const currentUser = getCurrentUser();

    const element = document.getElementById(elementId);

    if (element && currentUser) {

        element.textContent = currentUser.name;

    }

}


/* =========================================
   LOGIN / REGISTER PAGES:
   already logged in? go straight to your dashboard.
   ========================================= */

(function () {

    if (document.querySelector(".auth-page")) {

        const currentUser = getCurrentUser();

        if (currentUser) {
            redirectUser(currentUser);
        }

    }

})();
