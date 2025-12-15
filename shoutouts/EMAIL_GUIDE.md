# Email Notification Guide

This project now uses **real, authenticated SMTP email** for shoutout approvals, using your Hostinger mailbox.

---
## 1. Where Guest Emails Are Stored

Guest emails are automatically saved in the MySQL database whenever someone submits a booking request.

**Database Table:** `shoutout_bookings`

Each booking row includes:
- `email` – The guest's email address
- `author_name` – Their name
- `story_link` – Their story URL
- `shoutout_code` – Their shoutout HTML
- `date_str` – The date they requested
- `status` – `pending` / `approved` / `rejected`

You can view these via:

### Option A: phpMyAdmin
1. Log into phpMyAdmin.
2. Select database `u473142779_authorsite2`.
3. Click table `shoutout_bookings`.
4. You’ll see all booking requests, including email addresses and status.

### Option B: API Endpoint
Open (in a browser or HTTP client):

```text
https://ocwanderer.com/shoutouts/api/bookings.endpoint.php
```

This returns all bookings in JSON, including `email`.

### Option C: Admin Panel
In the Admin dashboard:
1. Go to the **Requests** tab.
2. You’ll see all **pending** requests for the active story.
3. Each request shows the author’s email and a `mailto:` link so you can contact them manually if needed.

---
## 2. How Automatic Emails Work Now

When you **approve** a request in the Admin → **Requests** tab:

1. The backend updates the booking’s status to `approved`.
2. It composes a HTML email with:
   - The approved date (nicely formatted).
   - The guest's story link.
   - Your shoutout code(s) for them.
   - A short reminder and footer with an "unsubscribe"/reply note.
3. It sends two emails using **Hostinger SMTP**:
   - One to the **guest** (their booking email address).
   - One copy to **you** at `ocwanderer@ocwanderer.com` (for your records).

### SMTP Details (already wired into the code)

Configured in `api/config.php`:

```php
// From / admin addresses
define('ADMIN_EMAIL', 'ocwanderer@ocwanderer.com');
define('FROM_EMAIL', 'noreply@ocwanderer.com');
define('FROM_NAME', 'Shoutout Manager');

// SMTP settings (Hostinger)
define('SMTP_HOST', 'smtp.hostinger.com');
define('SMTP_PORT', 465);             // SSL
define('SMTP_USER', 'ocwanderer@ocwanderer.com');
define('SMTP_PASS', 'YOUR_SMTP_PASSWORD_HERE');
define('SMTP_ENCRYPTION', 'ssl');     // or 'tls' if you switch to port 587
```

**Important Hostinger requirement:**
- We authenticate as `ocwanderer@ocwanderer.com`.
- The **SMTP envelope sender** (`MAIL FROM`) must also be `ocwanderer@ocwanderer.com`.
- The visible **From header** still shows as:
  
  ```text
  Shoutout Manager <noreply@ocwanderer.com>
  ```

This matches Hostinger’s rules and keeps deliverability high.

---
## 3. How to Test Email From Inside the Admin

You no longer need to manually type the URL for `email-test.php`. There’s a built-in tester in the Admin UI.

### A. Send a Test Email (using email-test.php)

1. Log into the Admin dashboard.
2. Go to the **Config** tab.
3. In the **Email Test (uses server script)** section:
   - Enter any email address (Gmail, your domain, etc.).
   - Click **Send Test Email**.
4. A new tab will open running:

   ```text
   /shoutouts/api/email-test.php?send=1&to=YOUREMAIL@example.com
   ```

5. Check that mailbox (Inbox + Spam) to confirm the test email arrived.

This is the same script as `api/email-test.php` on the server, just triggered via the app.

### B. Test a Real Approval Email

1. In **Requests**, make sure there’s at least one pending booking with an email you can check (e.g. `you+test@gmail.com`).
2. Click **Approve**.
3. You should receive:
   - A guest approval email at that booking email address.
   - A copy at `ocwanderer@ocwanderer.com`.

If something feels off, see the troubleshooting section below.

---
## 4. Email Logging (Debugging)

Every time an approval email is attempted, the backend logs a line to:

```text
https://ocwanderer.com/shoutouts/api/email-log.txt
```

Each line looks like this:

```text
2025-12-10T18:27:32+00:00 | to=enriquan@gmail.com | admin=ocwanderer@ocwanderer.com | subject="Shoutout APPROVED for ..." | userSent=1 | adminSent=1 | debug={...}
```

Key fields:
- `to` – The guest email the app tried to send to.
- `admin` – Your admin email.
- `userSent` – `1` if sending to the guest succeeded, `0` if it failed.
- `adminSent` – Same for the admin copy.
- `debug` – A JSON blob with:
  - SMTP host/port/encryption.
  - Full SMTP conversation (success or error messages) from Hostinger.
  - Any `mail()` fallback attempts.

If emails ever stop arriving, this file tells you **exactly** what the SMTP server said.

> Tip: Once you’re confident everything is stable, you can clear or rotate this log by deleting `api/email-log.txt` via FTP or your file manager.

---
## 5. Unsubscribe / Reply Handling

At the bottom of the approval email there’s a small note:

> Don’t want to receive these? Reply or email `noreply@ocwanderer.com` with subject "Unsubscribe".

This gives authors a simple way to opt out:
- They can just **reply** to the email.
- Or send a new email to `noreply@ocwanderer.com` with the subject `Unsubscribe`.

You can manually honor these by:
- Removing their future availability/requests.
- Or keeping a small personal list of emails you won’t approve shoutouts for.

(There is no automated unsubscribe list in the code yet—if you ever want that, it can be added later.)

---
## 6. Common Issues & Fixes

### 6.1 Approval email says SENT but guest doesn’t see it

1. **Check your log file**:
   - Open `https://ocwanderer.com/shoutouts/api/email-log.txt`.
   - Look at the **last line**.
   - Confirm `userSent=1` and `adminSent=1`.
2. If both are `1` and there are no obvious SMTP errors:
   - Check the guest’s Spam/Junk folder.
   - Check your own admin mailbox Spam/Junk.
3. If `smtp_user.success` or `smtp_admin.success` is `false` in the `debug` JSON:
   - Read the SMTP error text (e.g., authentication problems, quota limits).
   - Fix the credentials or contact Hostinger with that exact error.

### 6.2 SMTP authentication errors

If the log shows something like:

```text
AUTH LOGIN not accepted
Password not accepted
```

Then either:
- `SMTP_USER` or `SMTP_PASS` is wrong in `api/config.php`, or
- You changed the mailbox password in Hostinger but not in the code.

**Fix:**
1. Log into Hostinger → Email → `ocwanderer@ocwanderer.com`.
2. Confirm the current password.
3. Update `SMTP_PASS` in `api/config.php` to match.

### 6.3 Sender address rejected

If the log ever shows errors like:

```text
553 5.7.1 <something@ocwanderer.com>: Sender address rejected: not owned by user ocwanderer@ocwanderer.com
```

It means Hostinger is enforcing:
- The authenticated user (`SMTP_USER`) must match the SMTP **envelope sender** (`MAIL FROM`).

We already honor this by:
- Authenticating as `ocwanderer@ocwanderer.com`.
- Using `MAIL FROM: <ocwanderer@ocwanderer.com>` under the hood.

If you ever change `SMTP_USER` to a different mailbox, make sure that mailbox **exists** in Hostinger and is configured correctly.

---
## 7. If You Need to Change Addresses

You can safely change these in `api/config.php`:

```php
// Where admin copies go
define('ADMIN_EMAIL', 'ocwanderer@ocwanderer.com');

// What appears in the From header (must be on your domain and exist)
define('FROM_EMAIL', 'noreply@ocwanderer.com');
define('FROM_NAME', 'Shoutout Manager');
```

If you change `FROM_EMAIL`, also create that mailbox in Hostinger and/or add the right DNS (SPF/DKIM) records.

If you change `SMTP_USER`, make sure:
- It’s a real mailbox.
- You update `SMTP_PASS`.
- You understand that Hostinger expects the **envelope sender** to match the authenticated user.

---
## 8. Summary

- ✅ Guest emails are stored in `shoutout_bookings` and visible in phpMyAdmin, the API, and the Admin UI.
- ✅ Approval emails are now sent through **authenticated Hostinger SMTP**, not just `php mail()`.
- ✅ Both guest and admin copies are logged to `api/email-log.txt` with full SMTP debug output.
- ✅ You can test sending from inside the Admin via the **Config → Email Test** box.
- ✅ An unsubscribe/reply note is included in every approval email.

If you ever notice weird behavior, grab the last line of `email-log.txt` and you’ll have everything you need (or to send to support) to see exactly what the mail server did.
