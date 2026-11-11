# HomeGear Designs

Static website for [www.homegeardesigns.in](https://www.homegeardesigns.in). No build step. Publish the contents of this `site` folder.

## Before you deploy

1. Create a Google Sheet (any name).
2. Open **Extensions → Apps Script**, replace the sample file with the full script in `apps-script/Code.gs`, and save.
3. **Deploy → New deployment → Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Authorize the script when Google asks. Copy the URL that ends in `/exec`.
4. Paste that URL into the one constant in `js/config.js`:

```js
window.HOMEGEAR_LEAD_WEB_APP_URL = "https://script.google.com/macros/s/XXXX/exec";
```

5. Upload this folder to Netlify, Cloudflare Pages, or GitHub Pages (steps below), then point DNS for `www.homegeardesigns.in` at that host.

The script creates a **Leads** tab if needed and writes: timestamp, source, name, phone, location, budget, page. It also emails homegeardesigns@gmail.com. Quote submissions use source `quote`. Brochure downloads use source `brochure`.

The site posts with `Content-Type: text/plain` so the browser does not send a CORS preflight. A successful submit in the browser means the request was sent. Confirm the new row and the email after the first real test. If the Web App URL is empty or the network fails, the brochure still downloads.

### Apps Script

The full script is `apps-script/Code.gs`:

```javascript
/**
 * HomeGear Designs — lead capture
 * Bound to a Google Sheet. Deploy as a Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * Each POST appends one row and emails homegeardesigns@gmail.com.
 * The website sends JSON as text/plain (no CORS preflight).
 */

var NOTIFY_EMAIL = "homegeardesigns@gmail.com";
var SHEET_NAME = "Leads";
var HEADERS = ["timestamp", "source", "name", "phone", "location", "budget", "page"];

function doGet() {
  return ContentService
    .createTextOutput("HomeGear Designs lead endpoint is running.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var data = readData_(e);
    if (data.company) {
      return json_({ ok: true });
    }

    var sheet = getSheet_();
    var timestamp = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
    var row = [
      timestamp,
      data.source || "",
      data.name || "",
      data.phone || "",
      data.location || "",
      data.budget || "",
      data.page || ""
    ];
    sheet.appendRow(row);
    SpreadsheetApp.flush();

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: "HomeGear Designs lead — " + (data.source || "website"),
      body: [
        "A new lead was submitted on the HomeGear Designs website.",
        "",
        "Timestamp: " + timestamp + " (Asia/Kolkata)",
        "Source: " + row[1],
        "Name: " + (row[2] || "—"),
        "Phone: " + row[3],
        "Location: " + row[4],
        "Budget: " + (row[5] || "—"),
        "Page: " + row[6]
      ].join("\n")
    });

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    lock.releaseLock();
  }
}

function readData_(e) {
  var raw = e && e.postData && e.postData.contents ? e.postData.contents : "";
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (ignore) {}
  }
  return (e && e.parameter) ? e.parameter : {};
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

If you change the script later, deploy a **new version** (Manage deployments → edit → New version). An old `/exec` URL keeps serving the previous version until you do that.

## Deploy

Publish **this folder** (`index.html` at the site root). Paths are relative. `CNAME` is set to `www.homegeardesigns.in` for GitHub Pages.

### Netlify

1. Netlify → **Add new site → Deploy manually**, and drop this folder in (or connect a Git repo whose root is this folder).
2. Site configuration → Domain management → **Add a domain** → `www.homegeardesigns.in`.
3. At the domain registrar, add a **CNAME**: host `www`, target the host Netlify shows (for example `your-site.netlify.app`).
4. Add the apex domain `homegeardesigns.in` in Netlify and follow its ALIAS / ANAME instructions, with a redirect from the apex to `www`.
5. Open `https://www.homegeardesigns.in` and submit a test quote. Confirm the sheet row and the email.

### Cloudflare Pages

1. Pages → Create → upload this folder (or connect Git).
2. Custom domains → set up `www.homegeardesigns.in`.
3. DNS: **CNAME** `www` → `your-project.pages.dev` (proxied is fine if the domain is on Cloudflare).
4. Optional: redirect `homegeardesigns.in` to `www` with a bulk redirect or a Cloudflare redirect rule.
5. Run the test checklist below.

### GitHub Pages

1. Push this folder as the repository root (include `CNAME` and `.nojekyll`).
2. Settings → Pages → deploy from the branch root.
3. Custom domain: `www.homegeardesigns.in`.
4. DNS: **CNAME** `www` → `your-username.github.io`. For the apex, use the four A records GitHub lists (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) and redirect the apex to `www` if you want one address.
5. Wait for the certificate, then run the test checklist.

The brochure PDF is about 62 MB. The first download on a slow connection will take a while. That file is `assets/Homegear_Brochure_6x9in.pdf`.

## Test checklist

- [ ] Mobile (about 360px): menu opens, sections stack, quote slider and phone field are usable, no sideways scroll.
- [ ] Desktop (about 1440px): header, spaces, decor grid, quote form and contact line up.
- [ ] Logo is readable on the light header and the dark footer. Favicon shows in the tab.
- [ ] Phones open the dialer. Email opens Gmail compose in a new tab. Instagram opens in a new tab. WhatsApp opens a chat to +91 96861 89742.
- [ ] Get Quote prompt appears once per browser session for about 3 seconds and scrolls to the form.
- [ ] Quote form rejects a short phone, a number starting with 0–5, a missing city, and an empty Others box. A valid 10-digit number starting with 6–9 submits once (button disables while sending).
- [ ] Google Sheet gains a row: timestamp, source `quote`, name, phone, location, budget, page.
- [ ] homegeardesigns@gmail.com receives that lead.
- [ ] Brochure asks for a phone, then downloads `Homegear_Brochure_6x9in.pdf` and writes a row with source `brochure`. If the script URL is missing, the PDF still downloads.
- [ ] Vaarahi gallery and walkthrough open and close. Page title, description and share image are the HomeGear logo.
