/* =========================================
   SHARED UI HELPERS  (new in step 4)
   Used by the admin, student and instructor pages.
   Load order: data.js, auth.js, ui.js, then the page's own file.
   ========================================= */


/* =========================================
   SMALL HELPERS
   ========================================= */

function $(id) {

    return document.getElementById(id);

}


function setText(id, value) {

    const element = $(id);

    if (element) {
        element.textContent = value;
    }

}


function capitalize(text) {

    return text.charAt(0).toUpperCase() + text.slice(1);

}


/* Colored status label (Pending, Approved, Active ...) */
function statusBadge(status) {

    return (
        '<span class="badge badge-' +
        escapeHTML(String(status).toLowerCase()) + '">' +
        escapeHTML(status) +
        "</span>"
    );

}


/* True when the search text appears in any of the given words. */
function matchesQuery(parts, query) {

    const text = query.trim().toLowerCase();

    if (text === "") {
        return true;
    }

    return parts.join(" ").toLowerCase().indexOf(text) !== -1;

}


function emptyRow(columns, message) {

    return (
        '<tr><td colspan="' + columns + '">' +
        escapeHTML(message) +
        "</td></tr>"
    );

}


/* Show the { ok, message } result of a data.js function as a toast. */
function showResult(result) {

    showToast(result.message, result.ok ? "success" : "error");

}


/* "5:00 PM" -> "17:00"  (empty string if it can't be read) */
function parseTime24(text) {

    const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(text.trim());

    if (!match) {
        return "";
    }

    let hours = Number(match[1]) % 12;

    if (match[3].toUpperCase() === "PM") {
        hours += 12;
    }

    return String(hours).padStart(2, "0") + ":" + match[2];

}


const DAY_ORDER = [
    "Monday", "Tuesday", "Wednesday", "Thursday",
    "Friday", "Saturday", "Sunday"
];


/* Returns a new list of classes sorted by weekday, then start time. */
function sortBySchedule(classes) {

    return classes.slice().sort(function (a, b) {

        const dayDifference =
            DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day);

        if (dayDifference !== 0) {
            return dayDifference;
        }

        return parseTime24(String(a.time).split("-")[0])
            .localeCompare(parseTime24(String(b.time).split("-")[0]));

    });

}


/* =========================================
   NOTIFICATIONS  (same code for every role)
   The page needs:
     <div id="notificationList"></div>
     <span id="notificationBadge" class="count-badge" hidden></span>
   ========================================= */

function renderNotifications() {

    const container = $("notificationList");
    const me = getCurrentUser();

    if (!container || !me) {
        return;
    }

    const notifications = getUserNotifications(me.email);

    container.innerHTML = "";

    if (notifications.length === 0) {

        container.innerHTML = "<p>No notifications.</p>";

        return;

    }

    notifications.forEach(function (notification) {

        const item = document.createElement("div");

        item.className =
            "notification-item" + (notification.read ? "" : " unread");

        item.setAttribute(
            "onclick",
            "handleNotificationClick(" + notification.id + ")"
        );

        item.innerHTML =
            "<p>" + escapeHTML(notification.message) + "</p>" +
            "<small>" +
            escapeHTML(new Date(notification.date).toLocaleString()) +
            "</small>";

        container.appendChild(item);

    });

}


function updateNotificationBadge() {

    const badge = $("notificationBadge");
    const me = getCurrentUser();

    if (!badge || !me) {
        return;
    }

    const count = getUnreadCount(me.email);

    badge.textContent = count;
    badge.hidden = count === 0;

    /* pages with an "unread notifications" stat card */
    setText("statNotifications", count);

}


function handleNotificationClick(notificationId) {

    markNotificationRead(notificationId);

    renderNotifications();

    updateNotificationBadge();

}


function handleMarkAllRead() {

    const me = getCurrentUser();

    if (!me) {
        return;
    }

    markAllNotificationsRead(me.email);

    renderNotifications();

    updateNotificationBadge();

}
