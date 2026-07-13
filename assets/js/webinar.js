// ============================================================
// LIFE RESET — shared interactivity
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

  var PENDING_REG_KEY = 'lr_pending_registration';

  function getGoogleScriptUrl() {
    var fromConfig = (window.WEBINAR_CONFIG && window.WEBINAR_CONFIG.googleScriptUrl) || '';
    if (fromConfig) return fromConfig;
    var regForm = document.getElementById('registration-form');
    if (regForm && regForm.getAttribute('data-script-url')) {
      return regForm.getAttribute('data-script-url');
    }
    return '';
  }

  function fireGetBeacon(payload) {
    return new Promise(function (resolve) {
      var url = getGoogleScriptUrl().trim() + '?' + buildFullParams(payload).toString() + '&_t=' + Date.now();
      var img = new Image();
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        resolve();
      }
      img.onload = finish;
      img.onerror = finish;
      img.src = url;
      setTimeout(finish, 2500);
    });
  }

  function buildWebAppParams(payload, requiredKeys) {
    var params = new URLSearchParams();
    var required = {};
    (requiredKeys || []).forEach(function (key) { required[key] = 1; });
    Object.keys(payload).forEach(function (key) {
      var val = payload[key];
      if (required[key] || (val !== undefined && val !== null && val !== '')) {
        params.append(key, val == null ? '' : String(val));
      }
    });
    return params;
  }

  function extractJsonFromText(text) {
    if (!text) return null;
    var trimmed = String(text).trim();
    try {
      return JSON.parse(trimmed);
    } catch (ignore) {}

    var start = trimmed.indexOf('{');
    var end = trimmed.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch (ignore2) {}
    }
    return null;
  }

  function makeClientRegistrationId() {
    return 'LR-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  }

  function buildFullParams(payload) {
    var params = new URLSearchParams();
    Object.keys(payload).forEach(function (key) {
      if (payload[key] !== undefined && payload[key] !== null) {
        params.append(key, String(payload[key]));
      }
    });
    return params;
  }

  function upsertHiddenInput(form, name, value) {
    var existing = form.querySelector('input[name="' + name + '"]');
    if (existing) {
      existing.value = value;
      return existing;
    }
    var input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
    return input;
  }

  /* Native GET form → iframe — identical to opening the API URL in a browser tab. */
  function submitNativeRegistrationForm(form, payload) {
    return new Promise(function (resolve) {
      var scriptUrl = getGoogleScriptUrl().trim();
      upsertHiddenInput(form, 'action', 'register');
      upsertHiddenInput(form, 'timestamp', payload.timestamp || new Date().toISOString());
      upsertHiddenInput(form, 'source', payload.source || 'Life Reset Masterclass');
      upsertHiddenInput(form, 'registration_id', payload.registration_id);

      var previous = {
        action: form.getAttribute('action') || '',
        method: form.getAttribute('method') || '',
        target: form.getAttribute('target') || ''
      };

      form.setAttribute('action', scriptUrl);
      form.setAttribute('method', 'GET');
      form.setAttribute('target', 'reg-sheet-frame');
      form.submit();

      setTimeout(function () {
        if (previous.action) form.setAttribute('action', previous.action);
        else form.removeAttribute('action');
        if (previous.method) form.setAttribute('method', previous.method);
        else form.removeAttribute('method');
        if (previous.target) form.setAttribute('target', previous.target);
        else form.removeAttribute('target');
        resolve();
      }, 6000);
    });
  }

  function callWebAppJsonp(payload) {
    return new Promise(function (resolve, reject) {
      var callbackName = 'lrRegCb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      var script = document.createElement('script');
      var finished = false;
      var timeoutId = setTimeout(function () {
        finish(new Error('Registration timed out. Please try again.'));
      }, 30000);

      function finish(err, data) {
        if (finished) return;
        finished = true;
        clearTimeout(timeoutId);
        try { delete window[callbackName]; } catch (ignore) {}
        if (script.parentNode) script.parentNode.removeChild(script);
        if (err) reject(err);
        else resolve(data);
      }

      window[callbackName] = function (data) { finish(null, data); };
      script.onerror = function () { finish(new Error('Could not reach Google Sheets.')); };

      var jsonpPayload = Object.assign({}, payload, { callback: callbackName });
      script.src = getGoogleScriptUrl().trim() + '?' + buildFullParams(jsonpPayload).toString();
      document.body.appendChild(script);
    });
  }

  function callWebAppPost(payload) {
    var scriptUrl = getGoogleScriptUrl().trim();
    return fetch(scriptUrl, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: buildFullParams(payload).toString()
    })
      .then(function (res) { return res.text(); })
      .then(function (text) {
        var json = extractJsonFromText(text);
        if (json) return json;
        throw new Error('Invalid server response');
      });
  }

  function callWebAppFetch(payload) {
    var scriptUrl = getGoogleScriptUrl().trim();
    var query = scriptUrl + '?' + buildFullParams(payload).toString();
    return fetch(query, { method: 'GET', redirect: 'follow' })
      .then(function (res) { return res.text(); })
      .then(function (text) {
        var json = extractJsonFromText(text);
        if (json) return json;
        throw new Error('Invalid server response');
      });
  }

  function registerOnServer(payload, form) {
    function mustBeSaved(result) {
      if (result && result.saved && result.registration_id) {
        return result;
      }
      throw new Error((result && result.error) || 'Could not save registration');
    }

    /* JSONP = one GET request (same as API URL test) that saves the row AND returns JSON. */
    return callWebAppJsonp(payload)
      .then(mustBeSaved)
      .catch(function () {
        return fireGetBeacon(payload).then(function () {
          return callWebAppFetch(payload).then(mustBeSaved);
        });
      })
      .catch(function () {
        return submitNativeRegistrationForm(form, payload).then(function () {
          return callWebAppJsonp(payload).then(mustBeSaved);
        });
      });
  }

  function submitViaHiddenIframe(payload) {
    return new Promise(function (resolve) {
      var iframeName = 'lr_gas_' + Date.now();
      var iframe = document.createElement('iframe');
      iframe.name = iframeName;
      iframe.style.cssText = 'display:none;width:0;height:0;border:0';
      document.body.appendChild(iframe);

      var form = document.createElement('form');
      form.method = 'GET';
      form.action = getGoogleScriptUrl().trim();
      form.target = iframeName;
      form.style.display = 'none';
      Object.keys(payload).forEach(function (key) {
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = payload[key] == null ? '' : String(payload[key]);
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
      setTimeout(function () {
        if (form.parentNode) form.parentNode.removeChild(form);
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        resolve();
      }, 5000);
    });
  }

  function persistPendingRegistration(registration) {
    var raw = JSON.stringify(registration);
    try { sessionStorage.setItem(PENDING_REG_KEY, raw); } catch (ignore) {}
    try { localStorage.setItem(PENDING_REG_KEY, raw); } catch (ignore) {}
  }

  function readPendingRegistration(fromSessionOnly) {
    var raw = null;
    if (!fromSessionOnly) {
      try { raw = localStorage.getItem(PENDING_REG_KEY); } catch (ignore) {}
    }
    if (!raw) {
      try { raw = sessionStorage.getItem(PENDING_REG_KEY); } catch (ignore2) {}
    }
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (ignore3) {
      return null;
    }
  }

  function clearPendingRegistration() {
    try { sessionStorage.removeItem(PENDING_REG_KEY); } catch (ignore) {}
    try { localStorage.removeItem(PENDING_REG_KEY); } catch (ignore2) {}
  }

  function markPaidOnServer(details) {
    var payload = {
      action: 'mark_paid',
      registration_id: details.registration_id || '',
      email: details.email || '',
      razorpay_payment_id: details.razorpay_payment_id || ''
    };

    function mustBePaid(result) {
      if (result && (result.ok || result.payment_status === 'success')) {
        return result;
      }
      throw new Error((result && result.error) || 'Could not update payment status');
    }

    return callWebAppJsonp(payload)
      .then(mustBePaid)
      .catch(function () {
        return callWebAppFetch(payload).then(mustBePaid);
      });
  }

  function isRazorpayReturn(params) {
    if (params.get('paid') === '1') return true;
    if (params.get('razorpay_payment_id')) return true;
    var linkStatus = (params.get('razorpay_payment_link_status') || '').toLowerCase();
    return linkStatus === 'paid' || linkStatus === 'partially_paid';
  }

  function resolveRegistrationFromReturn(params) {
    var registrationId = params.get('registration_id') ||
      params.get('reference_id') ||
      params.get('razorpay_payment_link_reference_id') ||
      '';
    var email = params.get('email') || '';
    var pending = readPendingRegistration(false);

    if (pending) {
      if (!registrationId) registrationId = pending.registration_id || '';
      if (!email) email = pending.email || '';
    }

    return {
      registration_id: registrationId,
      email: email,
      razorpay_payment_id: params.get('razorpay_payment_id') || ''
    };
  }

  /* ---------------- Subtle reveal-on-scroll ---------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------------- FAQ accordion (one open at a time) ---------------- */
  var faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    var q = item.querySelector('.faq-q');
    q.addEventListener('click', function () {
      var wasOpen = item.classList.contains('open');
      faqItems.forEach(function (i) { i.classList.remove('open'); });
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* ---------------- 2 Minute Life Reset Assessment ---------------- */
  var assessRoot = document.getElementById('assessment-app');
  if (assessRoot) {
    var questions = [
      {
        q: 'अपने वर्तमान जीवन से आप कितने संतुष्ट हैं?',
        options: ['बहुत संतुष्ट', 'काफी हद तक', 'कभी-कभी', 'बहुत कम', 'बिल्कुल नहीं']
      },
      {
        q: 'सुबह उठते समय आपके भीतर ऊर्जा कैसी होती है?',
        options: ['बहुत उत्साह', 'सामान्य', 'कभी ठीक, कभी नहीं', 'थकान', 'उठने का मन नहीं करता']
      },
      {
        q: 'क्या आपको अपने जीवन की दिशा स्पष्ट दिखाई देती है?',
        options: ['पूरी तरह', 'काफी हद तक', 'कभी-कभी', 'बहुत कम', 'बिल्कुल नहीं']
      },
      {
        q: 'तनाव या कठिन परिस्थिति में आप स्वयं को कितना संभाल पाते हैं?',
        options: ['बहुत अच्छी तरह', 'अधिकांश समय', 'कभी-कभी', 'मुश्किल से', 'बिल्कुल नहीं']
      },
      {
        q: 'आपके रिश्ते आपको कैसी अनुभूति देते हैं?',
        options: ['ऊर्जा और सहयोग', 'सामान्य', 'मिश्रित', 'तनाव', 'बहुत अधिक मानसिक बोझ']
      },
      {
        q: 'पिछले 30 दिनों में आपने अपने लिए कितना समय निकाला?',
        options: ['नियमित', 'सप्ताह में कई बार', 'कभी-कभी', 'बहुत कम', 'बिल्कुल नहीं']
      },
      {
        q: 'क्या आपको लगता है कि आप वही जीवन जी रहे हैं जो वास्तव में जीना चाहते हैं?',
        options: ['हाँ', 'काफी हद तक', 'निश्चित नहीं', 'शायद नहीं', 'बिल्कुल नहीं']
      },
      {
        q: 'यदि अगले एक वर्ष तक कुछ भी न बदले... तो आपको कैसा महसूस होगा?',
        options: ['पूरी तरह संतुष्ट', 'ठीक रहेगा', 'थोड़ा अफसोस होगा', 'बहुत निराशा होगी', 'मैं ऐसा बिल्कुल नहीं चाहता']
      }
    ];

    var answers = new Array(questions.length).fill(null);
    var current = 0;

    var introEl = assessRoot.querySelector('.assess-intro');
    var quizEl = assessRoot.querySelector('.assess-quiz');
    var resultEl = assessRoot.querySelector('.result-screen');
    var progressFill = assessRoot.querySelector('.progress-fill');
    var qCount = assessRoot.querySelector('.q-count');
    var qText = assessRoot.querySelector('.q-text');
    var qOptions = assessRoot.querySelector('.q-options');
    var backLink = assessRoot.querySelector('.link-back');
    var nextBtn = assessRoot.querySelector('.btn-next');
    var startBtn = assessRoot.querySelector('.btn-start');

    function renderQuestion() {
      var item = questions[current];
      qCount.textContent = 'प्रश्न ' + (current + 1) + ' / ' + questions.length;
      qText.textContent = item.q;
      progressFill.style.width = (((current) / questions.length) * 100) + '%';
      qOptions.innerHTML = '';
      item.options.forEach(function (opt, idx) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'q-option' + (answers[current] === idx ? ' selected' : '');
        b.textContent = opt;
        b.addEventListener('click', function () {
          answers[current] = idx;
          renderQuestion();
          setTimeout(function () {
            if (current < questions.length - 1) {
              current++;
              renderQuestion();
            } else {
              showResult();
            }
          }, 220);
        });
        qOptions.appendChild(b);
      });
      backLink.style.visibility = current === 0 ? 'hidden' : 'visible';
      nextBtn.disabled = answers[current] === null;
    }

    backLink.addEventListener('click', function () {
      if (current > 0) { current--; renderQuestion(); }
    });

    nextBtn.addEventListener('click', function () {
      if (answers[current] === null) return;
      if (current < questions.length - 1) {
        current++;
        renderQuestion();
      } else {
        showResult();
      }
    });

    startBtn.addEventListener('click', function () {
      introEl.style.display = 'none';
      quizEl.style.display = 'block';
      renderQuestion();
    });

    function showResult() {
      progressFill.style.width = '100%';
      quizEl.style.display = 'none';
      resultEl.classList.add('active');

      var total = answers.reduce(function (sum, a) { return sum + (5 - a); }, 0);
      var score = Math.round(total * 2.5);

      var tier;
      if (score >= 82) {
        tier = { name: 'You Are Aware', copy: 'आपके जीवन में स्पष्टता अच्छी है। अब अगला कदम है निरंतर अभ्यास और गहराई।' };
      } else if (score >= 61) {
        tier = { name: 'Growing', copy: 'आप सही दिशा में हैं। लेकिन कुछ क्षेत्रों में अधिक जागरूकता और संरचना की आवश्यकता है।' };
      } else if (score >= 41) {
        tier = { name: 'Time To Reset', copy: 'आपके जीवन में कई ऐसे क्षेत्र हैं जिन्हें नए दृष्टिकोण से देखने की आवश्यकता है।' };
      } else {
        tier = { name: 'Start Your Reset', copy: 'आप लंबे समय से Auto-Pilot Mode में जीवन जी रहे हो सकते हैं। यह सही समय है रुकने, समझने और नई शुरुआत करने का।' };
      }

      resultEl.querySelector('.result-score').textContent = score + ' / 100';
      resultEl.querySelector('.result-tier').textContent = tier.name;
      resultEl.querySelector('.result-msg').textContent = tier.copy;

      // Save score into the hidden registration field, per blueprint (Assessment Score → Registration Form)
      var hidden = document.getElementById('assessment-score');
      if (hidden) hidden.value = score;
    }

    renderQuestion();
  }

  /* ---------------- Registration form → Google Sheets → Razorpay Payment Page ---------------- */
  var regForm = document.getElementById('registration-form');
  if (regForm) {
    var regError = document.getElementById('reg-error');
    var regSubmit = document.getElementById('reg-submit');
    var regIdInput = document.getElementById('registration-id');
    var defaultSubmitLabel = regSubmit ? (regSubmit.querySelector('.btn__label') ? regSubmit.querySelector('.btn__label').textContent : regSubmit.textContent) : 'Reserve My Seat';

    function showRegError(message) {
      if (!regError) return;
      regError.textContent = message;
      regError.hidden = false;
    }

    function clearRegError() {
      if (!regError) return;
      regError.textContent = '';
      regError.hidden = true;
    }

    function setSubmitting(isSubmitting, label) {
      if (!regSubmit) return;
      regSubmit.disabled = isSubmitting;
      var labelEl = regSubmit.querySelector('.btn__label');
      var priceEl = regSubmit.querySelector('.btn__price-tag');
      var nextLabel = label || defaultSubmitLabel;
      if (labelEl) {
        labelEl.textContent = isSubmitting ? nextLabel : defaultSubmitLabel;
        if (priceEl) priceEl.hidden = isSubmitting;
      } else {
        regSubmit.textContent = isSubmitting ? nextLabel : defaultSubmitLabel;
      }
      regSubmit.classList.toggle('is-loading', isSubmitting);
    }

    function getPaymentPageUrl() {
      return (window.WEBINAR_CONFIG && window.WEBINAR_CONFIG.paymentPageUrl) || '';
    }

    function registerLead(payload) {
      payload.registration_id = makeClientRegistrationId();
      if (regIdInput) {
        regIdInput.value = payload.registration_id;
      }
      return registerOnServer(payload, regForm);
    }

    function buildPayloadFromForm() {
      var fullNameEl = document.getElementById('full-name');
      var mobileEl = document.getElementById('mobile');
      var emailEl = document.getElementById('email');
      var cityEl = document.getElementById('city');
      var professionEl = document.getElementById('profession');
      var scoreEl = document.getElementById('assessment-score');

      return {
        action: 'register',
        timestamp: new Date().toISOString(),
        full_name: fullNameEl ? fullNameEl.value.trim() : '',
        mobile: mobileEl ? mobileEl.value.trim() : '',
        email: emailEl ? emailEl.value.trim() : '',
        city: cityEl ? cityEl.value.trim() : '',
        profession: professionEl ? professionEl.value : '',
        assessment_score: scoreEl ? scoreEl.value : '',
        source: 'Life Reset Masterclass'
      };
    }

    function buildPaymentPageUrl(registration) {
      var baseUrl = getPaymentPageUrl().trim();
      if (!baseUrl || baseUrl.indexOf('REPLACE_WITH') !== -1) {
        throw new Error('Razorpay Payment Page URL is not configured in webinar-config.js');
      }

      var parts = [];
      if (registration.email) parts.push('email=' + encodeURIComponent(registration.email));
      if (registration.mobile) {
        parts.push('phone=' + encodeURIComponent(registration.mobile));
        parts.push('contact=' + encodeURIComponent(registration.mobile));
      }
      if (registration.full_name) parts.push('name=' + encodeURIComponent(registration.full_name));
      if (registration.registration_id) {
        parts.push('registration_id=' + encodeURIComponent(registration.registration_id));
        parts.push('reference_id=' + encodeURIComponent(registration.registration_id));
      }

      if (!parts.length) return baseUrl;
      return baseUrl + (baseUrl.indexOf('?') === -1 ? '?' : '&') + parts.join('&');
    }

    function redirectToPaymentPage(registration) {
      persistPendingRegistration(registration);
      if (regIdInput) regIdInput.value = registration.registration_id;
      window.location.href = buildPaymentPageUrl(registration);
    }

    regForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearRegError();

      var scriptUrl = getGoogleScriptUrl().trim();
      if (!scriptUrl) {
        showRegError('Registration is not connected yet. Please add your Google Sheets URL in webinar-config.js.');
        return;
      }

      var payload = buildPayloadFromForm();

      if (!payload.full_name || !payload.mobile || !payload.email) {
        showRegError('Please fill in your name, mobile number, and email.');
        return;
      }

      setSubmitting(true, 'Saving your details…');
      clearPendingRegistration();

      registerLead(payload)
        .then(function (registerResult) {
          setSubmitting(true, 'Redirecting to payment…');
          redirectToPaymentPage(registerResult);
        })
        .catch(function (err) {
          var sheetUrl = (window.WEBINAR_CONFIG && window.WEBINAR_CONFIG.spreadsheetUrl) || '';
          var msg = (err && err.message) ||
            'Could not save to Google Sheets. Disable ad-blocker for this page, then try again.';
          if (sheetUrl) {
            msg += ' Rows save to: ' + sheetUrl;
          }
          showRegError(msg);
          setSubmitting(false);
        });
    });
  }

  /* ---------------- Welcome page — mark payment success after Razorpay redirect ---------------- */
  if (document.body.classList.contains('welcome-page')) {
    var welcomeParams = new URLSearchParams(window.location.search);
    var razorpayReturn = isRazorpayReturn(welcomeParams);
    var pendingReg = readPendingRegistration(false);

    console.log('[welcome] URL:', window.location.href);
    console.log('[welcome] isRazorpayReturn:', razorpayReturn);
    console.log('[welcome] pendingReg from localStorage:', pendingReg);

    if (razorpayReturn || pendingReg) {
      var welcomeTitle = document.getElementById('welcome-title');
      if (welcomeTitle) {
        welcomeTitle.textContent = 'Payment Successful — Your Seat Is Confirmed.';
      }

      var paymentDetails = resolveRegistrationFromReturn(welcomeParams);
      console.log('[welcome] paymentDetails for mark_paid:', paymentDetails);

      if ((paymentDetails.registration_id || paymentDetails.email) && getGoogleScriptUrl()) {
        console.log('[welcome] Calling markPaidOnServer…');
        markPaidOnServer(paymentDetails)
          .then(function (result) {
            console.log('[welcome] markPaidOnServer SUCCESS:', result);
            clearPendingRegistration();
          })
          .catch(function (err) {
            console.warn('[welcome] markPaidOnServer FAILED:', err);
          });
      } else {
        console.warn('[welcome] Skipped mark_paid — no registration_id/email or no script URL.',
          'registration_id:', paymentDetails.registration_id,
          'email:', paymentDetails.email,
          'scriptUrl:', getGoogleScriptUrl());
      }
    }

    /* Lazy-load welcome video — ~77 MB file; zero bytes until user taps play */
    var welcomeVideo = document.getElementById('welcome-video');
    var welcomeVideoPlay = document.getElementById('welcome-video-play');
    var welcomeVideoWrap = document.getElementById('welcome-video-wrap');
    if (welcomeVideo && welcomeVideoPlay && welcomeVideo.dataset.src) {
      var welcomeVideoLoaded = false;

      function loadWelcomeVideo() {
        if (welcomeVideoLoaded) return Promise.resolve();
        welcomeVideoLoaded = true;
        if (welcomeVideoWrap) welcomeVideoWrap.classList.add('is-loading');
        welcomeVideo.src = welcomeVideo.dataset.src;
        welcomeVideo.load();
        return new Promise(function (resolve, reject) {
          welcomeVideo.addEventListener('loadeddata', resolve, { once: true });
          welcomeVideo.addEventListener('error', reject, { once: true });
        });
      }

      welcomeVideoPlay.addEventListener('click', function () {
        loadWelcomeVideo()
          .then(function () {
            if (welcomeVideoWrap) {
              welcomeVideoWrap.classList.remove('is-loading');
              welcomeVideoWrap.classList.add('is-playing');
            }
            return welcomeVideo.play();
          })
          .catch(function () {
            welcomeVideoLoaded = false;
            if (welcomeVideoWrap) welcomeVideoWrap.classList.remove('is-loading', 'is-playing');
          });
      });
    }
  }

  /* ---------------- Smooth-scroll CTA links ---------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      var target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

});
