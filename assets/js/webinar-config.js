/* Google Apps Script — deploy scripts/google-apps-script/webinar-registration.gs
   Set Script property SPREADSHEET_ID, then Deploy → Web app (Anyone).
   Paste the /exec URL below. Must match the deployment you just updated.

   Razorpay Payment Page (no API keys on website):
   1. Create a Rs 99 Payment Page in Razorpay Dashboard
   2. Set success redirect URL to match where you test:
      Local:  http://localhost:8080/webinar/welcome.html?paid=1
      Live:   https://thesarveshmishra.com/webinar/welcome.html?paid=1
   3. Paste your Payment Page link below (paymentPageUrl)

   IMPORTANT: Upload this file AND assets/js/webinar.js to your live site after changes. */
window.WEBINAR_CONFIG = {
  googleScriptUrl: 'https://script.google.com/macros/s/AKfycbzZCnRgBGdEWZDGBMPh0cFNtwbQ4RcRBjTW60F5tzekXo_RYaS0yZkALonJkqS50Nz7/exec',

  /* Rows are saved to this spreadsheet → Registrations tab */
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1Qk5DjAJG9fwA5r6941FGp3BEboQa4Q8hE2VlY4PRpdM/edit',

  paymentPageUrl: 'https://rzp.io/rzp/qhwE712t',

  payment: {
    amountInr: 99,
    currency: 'INR',
    name: 'CureSoulLife',
    description: 'Life Reset Masterclass — Sarvesh Mishra'
  }
};
