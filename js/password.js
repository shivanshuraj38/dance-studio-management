/* =========================================
   PASSWORD PAGES
   Used by forgot-password.html and change-password.html.
   Load order: data.js, auth.js, ui.js, password.js
   ========================================= */


/* =========================================
   FORGOT PASSWORD  (2 steps on one page)
   ========================================= */

let pendingResetEmail = "";


/* step 1 = ask for email, step 2 = enter code + new password */
function showResetStep(step) {

    $("requestForm").hidden = step !== 1;
    $("resetForm").hidden = step !== 2;

}


/* Step 1: the person typed their email. */
function handleRequestReset(event) {

    event.preventDefault();

    const email = $("resetEmail").value;

    const result = createPasswordReset(email);

    if (!result.ok) {

        showToast(result.message, "error");

        return;

    }

    pendingResetEmail = normalizeEmail(email);

    setText("resetEmailLabel", pendingResetEmail);
    setText("resetCode", result.code);
    setText("resetMinutes", result.minutes);

    $("resetCodeInput").value = "";
    $("newPassword").value = "";
    $("confirmNewPassword").value = "";

    showResetStep(2);

    showToast("Reset code created.", "success");

}


/* Step 2: code + new password. */
function handleResetPassword(event) {

    event.preventDefault();

    if (pendingResetEmail === "") {

        showResetStep(1);

        return;

    }

    const result = resetPasswordWithCode(
        pendingResetEmail,
        $("resetCodeInput").value,
        $("newPassword").value,
        $("confirmNewPassword").value
    );

    if (!result.ok) {

        showToast(result.message, "error");

        /* expired / too many attempts: start again from step 1 */
        if (result.restart) {
            showResetStep(1);
        }

        return;

    }

    setFlashMessage(result.message, "success");

    window.location.href = "login.html";

}


/* "Send a new code" button */
function handleRestartReset() {

    pendingResetEmail = "";

    showResetStep(1);

}


/* =========================================
   CHANGE PASSWORD  (for a logged-in user)
   ========================================= */

function setupChangePasswordPage() {

    /* any logged-in role may use this page */
    if (!protectPage()) {
        return;
    }

    const me = getCurrentUser();

    const pages = {
        admin: "admin.html",
        instructor: "instructor.html",
        student: "student.html"
    };

    document.querySelectorAll(".dashboard-link").forEach(function (link) {
        link.setAttribute("href", pages[me.role]);
    });

}


function handleChangePassword(event) {

    event.preventDefault();

    const me = getCurrentUser();

    if (!me) {

        window.location.href = "login.html";

        return;

    }

    const result = changePassword(
        me.email,
        $("currentPassword").value,
        $("newPassword").value,
        $("confirmNewPassword").value
    );

    showResult(result);

    if (result.ok) {

        $("currentPassword").value = "";
        $("newPassword").value = "";
        $("confirmNewPassword").value = "";

    }

}
