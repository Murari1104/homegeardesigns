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
    } catch (ignore) {
      /* fall through to form fields */
    }
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
