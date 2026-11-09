# Dance Studio Management System

A role-based web application that centralizes dance studio records, class
registrations, schedules, notifications and reports. Plain HTML, CSS and
JavaScript. Data is kept in the browser (localStorage), so no server is needed.

## How to run

Open `index.html` in a browser. That's it.

To reset all data to the sample data, open the browser developer tools and
run `localStorage.clear()`, then refresh.

## Demo accounts

| Role       | Email               | Password   |
|------------|---------------------|------------|
| Admin      | admin@dance.com     | admin123   |
| Instructor | alex@dance.com      | alex123    |
| Instructor | sarah@dance.com     | sarah123   |
| Instructor | rahul@dance.com     | rahul123   |
| Student    | aarav@example.com   | student123 |

## Project structure

```
index.html  login.html  register.html
forgot-password.html  change-password.html
student.html  instructor.html  admin.html
css/style.css
js/
  data.js        data layer: storage, validation, business rules, reports
  auth.js        login, registration, sessions, access control, toast messages
  ui.js          shared helpers (notifications, badges, search, sorting)
  home.js        home page
  password.js    forgot-password and change-password pages
  student.js     student dashboard
  instructor.js  instructor dashboard
  admin.js       admin dashboard
```

Load order on every page: `data.js`, `auth.js`, `ui.js`, then the page's own file.

## Requirements covered

| Requirement | Where |
|---|---|
| User registration / login | `register.html`, `login.html`, `auth.js` |
| Change / forgot password | `change-password.html` (logged-in users), `forgot-password.html` (reset code), `password.js` |
| Role-based access | `protectPage()` on every dashboard; admin, instructor, student roles |
| Dashboards | One per role, with live statistics |
| CRUD for core entities | Users and classes (add, view, edit, delete); registrations (create, approve, reject, cancel) |
| Search / filter | Users, classes, registrations (admin); classes by text, style and level (student); students by text, class and status (instructor) |
| Workflow | Student requests, then Pending, then Approved or Rejected by the admin; a student can cancel |
| Status tracking | Pending, Approved, Rejected, Cancelled shown as colored badges |
| Validation | Email format, password length and match, unique email, class capacity, time range, seat limits, no duplicate registrations |
| Notifications / confirmations | Students, instructors and admins get notifications; unread badge; toast messages |
| Basic reports | Admin reports: students, classes, registrations by status, seat usage per class |
| Responsive UI | CSS grid layouts and mobile breakpoints |

## Business rules

- A seat is used by a Pending or Approved registration. Rejected and Cancelled free it.
- A class cannot be set to a capacity below the seats already taken.
- New instructor accounts are Pending until an admin approves them.
- The last admin cannot be deleted, deactivated or demoted.
- An instructor who has classes cannot be deleted or have their role changed.
- Deleting a class removes its registrations and notifies the students.

## Passwords

- **Change password:** any logged-in user, from the "Change Password" menu item.
  Needs the current password; the new one must be 6+ characters and different.
- **Forgot password:** enter your email to get a 6-digit code (valid for 10
  minutes, 5 wrong tries allowed, single use), then enter the code and a new password.
  This project has no email server, so the code is shown on the screen.
  A real system would email it.

- **Admin reset:** in User Management an admin can click **Reset Password** for any
  other user. A random 8-character temporary password is shown once; the user is
  notified and should change it from **Change Password** after logging in.

## Notes

- This is a front-end demo: passwords are stored in plain text in localStorage
  and anyone with access to the browser can read them. A real deployment needs
  a server with hashed passwords.
- Remove the "Demo accounts" box from `login.html` before sharing the project publicly.
