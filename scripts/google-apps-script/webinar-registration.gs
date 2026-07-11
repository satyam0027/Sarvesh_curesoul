/**
 * Life Reset Masterclass — Google Sheets + Razorpay Payment Page
 *
 * SETUP
 * 1. Create a Google Sheet and set Script property SPREADSHEET_ID (or below).
 * 2. Deploy → Web app (Execute as: Me, Who has access: Anyone).
 * 3. Paste web app URL into assets/js/webinar-config.js (googleScriptUrl).
 * 4. Razorpay Dashboard → Payment Pages → create Rs 99 page.
 * 5. Set Payment Page success redirect to:
 *    https://thesarveshmishra.com/webinar/welcome.html?paid=1
 * 6. Paste Payment Page link into webinar-config.js (paymentPageUrl).
 *
 * Optional (recommended): Razorpay Webhook → this script URL for payment.captured
 *   Script property RAZORPAY_WEBHOOK_SECRET = webhook secret from Razorpay Dashboard
 *
 * SHEET COLUMNS:
 * timestamp | full_name | mobile | email | city | profession | assessment_score | source |
 * registration_id | payment_status | razorpay_order_id | razorpay_payment_id | payment_at
 */

var SPREADSHEET_ID = '1Qk5DjAJG9fwA5r6941FGp3BEboQa4Q8hE2VlY4PRpdM';
var SHEET_NAME = 'Registrations';
var HEADERS = [
  'timestamp',
  'full_name',
  'mobile',
  'email',
  'city',
  'profession',
  'assessment_score',
  'source',
  'registration_id',
  'payment_status',
  'razorpay_order_id',
  'razorpay_payment_id',
  'payment_at'
];

function doGet(e) {
  var result = handleRequest_(e);
  var callback = e && e.parameter && e.parameter.callback;
  if (callback && /^[a-zA-Z_$][\w.$]*$/.test(String(callback))) {
    return ContentService
      .createTextOutput(String(callback) + '(' + result.getContent() + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return result;
}

function doPost(e) {
  if (isRazorpayWebhook_(e)) {
    return handleRazorpayWebhook_(e);
  }
  return handleRequest_(e);
}

function handleRequest_(e) {
  try {
    var params = mergeParams_(e);
    var action = String(params.action || 'register').toLowerCase();

    if (action === 'echo' || action === 'ping') {
      return jsonResponse_({ ok: true, action: action, received: params });
    }

    if (action === 'lookup') {
      return jsonResponse_(lookupRegistration_(params));
    }

    if (action === 'register') {
      return jsonResponse_(registerLead_(params));
    }
    if (action === 'mark_paid') {
      return jsonResponse_(markPaid_(params));
    }

    return jsonResponse_({ saved: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse_({ saved: false, error: String(err && err.message ? err.message : err) });
  }
}

function mergeParams_(e) {
  var params = {};
  if (e && e.parameter) {
    Object.keys(e.parameter).forEach(function (key) {
      if (key !== 'callback') {
        params[key] = e.parameter[key];
      }
    });
  }
  if (e && e.postData && e.postData.contents) {
    var contents = e.postData.contents;
    var type = e.postData.type || '';
    if (type.indexOf('application/json') !== -1) {
      try {
        var body = JSON.parse(contents);
        Object.keys(body).forEach(function (key) {
          params[key] = body[key];
        });
      } catch (ignore) {}
    } else if (type.indexOf('application/x-www-form-urlencoded') !== -1) {
      contents.split('&').forEach(function (pair) {
        var parts = pair.split('=');
        if (parts.length === 2) {
          params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1].replace(/\+/g, ' '));
        }
      });
    }
  }
  return normalizeParams_(params);
}

function normalizeParams_(params) {
  params.full_name = trim_(params.full_name || params.fullName || params.name);
  params.mobile = trim_(params.mobile || params.phone || params.contact);
  params.email = trim_(params.email || params.email_address);
  params.city = trim_(params.city);
  params.profession = trim_(params.profession);
  params.assessment_score = trim_(params.assessment_score || params.assessmentScore);
  params.source = trim_(params.source) || 'Life Reset Masterclass';
  params.registration_id = trim_(
    params.registration_id ||
    params.registrationId ||
    params.reference_id ||
    params.razorpay_payment_link_reference_id
  );
  return params;
}

function lookupRegistration_(params) {
  var registrationId = trim_(params.registration_id);
  var email = trim_(params.email);
  var rowInfo = null;

  if (registrationId) {
    rowInfo = findRowByRegistrationId_(registrationId);
  }
  if (!rowInfo && email) {
    rowInfo = findLatestPendingByEmail_(email);
  }
  if (!rowInfo) {
    return { found: false, saved: false, error: 'Registration not found' };
  }

  return {
    found: true,
    saved: true,
    registration_id: rowInfo.row.registration_id,
    payment_status: rowInfo.row.payment_status || 'pending',
    full_name: rowInfo.row.full_name,
    email: rowInfo.row.email,
    mobile: rowInfo.row.mobile
  };
}

function registerLead_(params) {
  var sheet = getSheet_();
  ensureHeaders_(sheet);

  var registrationId = trim_(params.registration_id);
  if (!registrationId || registrationId.indexOf('LR-') !== 0) {
    registrationId = makeRegistrationId_();
  }

  if (!trim_(params.full_name) || !trim_(params.mobile) || !trim_(params.email)) {
    return {
      saved: false,
      error: 'Missing required fields',
      received: {
        full_name: trim_(params.full_name),
        mobile: trim_(params.mobile),
        email: trim_(params.email)
      }
    };
  }

  var existing = findRowByRegistrationId_(registrationId);
  if (existing) {
    return {
      saved: true,
      registration_id: registrationId,
      payment_status: existing.row.payment_status || 'pending',
      full_name: existing.row.full_name,
      email: existing.row.email,
      mobile: existing.row.mobile,
      already_registered: true
    };
  }

  var row = {
    timestamp: params.timestamp || new Date().toISOString(),
    full_name: params.full_name,
    mobile: params.mobile,
    email: params.email,
    city: params.city,
    profession: params.profession,
    assessment_score: params.assessment_score,
    source: params.source,
    registration_id: registrationId,
    payment_status: 'pending',
    razorpay_order_id: '',
    razorpay_payment_id: '',
    payment_at: ''
  };

  appendRowFromObject_(sheet, row);

  return {
    saved: true,
    registration_id: registrationId,
    payment_status: 'pending',
    full_name: row.full_name,
    email: row.email,
    mobile: row.mobile,
    spreadsheet_id: getScriptProperty_('SPREADSHEET_ID') || SPREADSHEET_ID
  };
}

function markPaid_(params) {
  var registrationId = trim_(
    params.registration_id ||
    params.reference_id ||
    params.razorpay_payment_link_reference_id
  );
  var email = trim_(params.email);
  var rowInfo = null;

  if (registrationId) {
    rowInfo = findRowByRegistrationId_(registrationId);
  }
  if (!rowInfo && email) {
    rowInfo = findLatestPendingByEmail_(email);
  }
  if (!rowInfo) {
    return { ok: false, error: 'Registration not found' };
  }

  if (String(rowInfo.row.payment_status).toLowerCase() === 'success') {
    return { ok: true, payment_status: 'success', already_verified: true };
  }

  updateRowFields_(rowInfo.rowNumber, {
    payment_status: 'success',
    razorpay_payment_id: trim_(params.razorpay_payment_id) || rowInfo.row.razorpay_payment_id || '',
    payment_at: new Date().toISOString()
  });

  return { ok: true, payment_status: 'success', registration_id: rowInfo.row.registration_id };
}

function isRazorpayWebhook_(e) {
  if (!e || !e.postData || !e.postData.contents) return false;
  try {
    var body = JSON.parse(e.postData.contents);
    return body && body.event && body.payload;
  } catch (err) {
    return false;
  }
}

function handleRazorpayWebhook_(e) {
  try {
    var bodyText = e.postData.contents;
    var signature = e.parameter && e.parameter['X-Razorpay-Signature'];
    if (!signature && e.headers) {
      signature = e.headers['X-Razorpay-Signature'] || e.headers['x-razorpay-signature'];
    }

    var webhookSecret = getScriptProperty_('RAZORPAY_WEBHOOK_SECRET');
    if (webhookSecret && signature) {
      var expected = hmacSha256Hex_(bodyText, webhookSecret);
      if (expected !== signature) {
        return jsonResponse_({ ok: false, error: 'Invalid webhook signature' });
      }
    }

    var event = JSON.parse(bodyText);
    if (event.event !== 'payment.captured') {
      return jsonResponse_({ ok: true, ignored: true });
    }

    var payment = event.payload.payment.entity;
    var paymentId = payment.id || '';
    var email = trim_(payment.email);
    var notes = payment.notes || {};
    var registrationId = trim_(notes.registration_id);

    var rowInfo = registrationId
      ? findRowByRegistrationId_(registrationId)
      : findLatestPendingByEmail_(email);

    if (!rowInfo) {
      return jsonResponse_({ ok: false, error: 'Matching registration not found' });
    }

    updateRowFields_(rowInfo.rowNumber, {
      payment_status: 'success',
      razorpay_payment_id: paymentId,
      payment_at: new Date().toISOString()
    });

    return jsonResponse_({ ok: true, payment_status: 'success' });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function findLatestPendingByEmail_(email) {
  if (!email) return null;
  var sheet = getSheet_();
  ensureHeaders_(sheet);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return null;

  var headers = values[0];
  var emailCol = headers.indexOf('email');
  var statusCol = headers.indexOf('payment_status');
  if (emailCol === -1) return null;

  for (var i = values.length - 1; i >= 1; i--) {
    if (String(values[i][emailCol]).toLowerCase() === email.toLowerCase()) {
      var status = statusCol === -1 ? 'pending' : String(values[i][statusCol]).toLowerCase();
      if (status !== 'success') {
        var row = {};
        headers.forEach(function (header, idx) {
          row[header] = values[i][idx];
        });
        return { rowNumber: i + 1, row: row };
      }
    }
  }
  return null;
}

function getSheet_() {
  var spreadsheetId = getScriptProperty_('SPREADSHEET_ID') || SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error('SPREADSHEET_ID is not configured');
  }
  var ss = SpreadsheetApp.openById(spreadsheetId);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    return;
  }

  var existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var missing = [];
  HEADERS.forEach(function (header) {
    if (existing.indexOf(header) === -1) {
      missing.push(header);
    }
  });

  if (missing.length) {
    sheet.getRange(1, existing.length + 1, 1, existing.length + missing.length).setValues([missing]);
  }
}

function appendRowFromObject_(sheet, obj) {
  var row = HEADERS.map(function (header) {
    return obj[header] !== undefined && obj[header] !== null ? obj[header] : '';
  });
  sheet.appendRow(row);
}

function findRowByRegistrationId_(registrationId) {
  var sheet = getSheet_();
  ensureHeaders_(sheet);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return null;

  var headers = values[0];
  var regCol = headers.indexOf('registration_id');
  if (regCol === -1) return null;

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][regCol]) === String(registrationId)) {
      var row = {};
      headers.forEach(function (header, idx) {
        row[header] = values[i][idx];
      });
      return { rowNumber: i + 1, row: row };
    }
  }
  return null;
}

function updateRowFields_(rowNumber, fields) {
  var sheet = getSheet_();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  Object.keys(fields).forEach(function (field) {
    var col = headers.indexOf(field);
    if (col !== -1) {
      sheet.getRange(rowNumber, col + 1).setValue(fields[field]);
    }
  });
}

function makeRegistrationId_() {
  return 'LR-' + new Date().getTime() + '-' + Math.random().toString(36).slice(2, 8);
}

function getScriptProperty_(name) {
  return PropertiesService.getScriptProperties().getProperty(name);
}

function trim_(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function hmacSha256Hex_(message, secret) {
  var bytes = Utilities.computeHmacSha256Signature(message, secret);
  return bytes.map(function (byte) {
    var v = (byte < 0 ? byte + 256 : byte).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function testWriteRow() {
  var result = registerLead_({
    full_name: 'Test User',
    mobile: '9999999999',
    email: 'test@example.com',
    city: 'Test City',
    profession: 'Other',
    assessment_score: '50',
    source: 'Script Test'
  });
  Logger.log(JSON.stringify(result));
}
