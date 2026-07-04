// ============================================================
// LIFE RESET™ — shared interactivity
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

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

  /* ---------------- Registration form → Google Sheets ---------------- */
  var regForm = document.getElementById('registration-form');
  if (regForm) {
    var regError = document.getElementById('reg-error');
    var regSubmit = document.getElementById('reg-submit');
    var regSuccess = document.getElementById('reg-success');
    var regTrustBelow = document.querySelector('.reg-trust-below');
    var defaultSubmitLabel = regSubmit ? regSubmit.textContent : 'Reserve My Free Seat';

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

    function setSubmitting(isSubmitting) {
      if (!regSubmit) return;
      regSubmit.disabled = isSubmitting;
      regSubmit.textContent = isSubmitting ? 'Saving your seat…' : defaultSubmitLabel;
      regSubmit.classList.toggle('is-loading', isSubmitting);
    }

    function showRegSuccess() {
      regForm.style.display = 'none';
      if (regTrustBelow) regTrustBelow.style.display = 'none';
      if (regSuccess) regSuccess.classList.add('active');
      setTimeout(function () {
        window.location.href = 'welcome.html';
      }, 1600);
    }

    function getGoogleScriptUrl() {
      return (window.WEBINAR_CONFIG && window.WEBINAR_CONFIG.googleScriptUrl) || '';
    }

    function buildParams(payload) {
      var params = new URLSearchParams();
      Object.keys(payload).forEach(function (key) {
        params.append(key, payload[key]);
      });
      return params;
    }

    function responseLooksSuccessful(text) {
      if (!text) return false;
      return text.indexOf('"saved":true') !== -1 || text.indexOf('"saved": true') !== -1;
    }

    function submitViaHiddenForm(payload, scriptUrl) {
      return new Promise(function (resolve, reject) {
        var iframe = document.getElementById('reg-sheet-frame');
        var tempForm = document.createElement('form');
        var finished = false;

        function finish(ok) {
          if (finished) return;
          finished = true;
          iframe.onload = null;
          if (tempForm.parentNode) tempForm.parentNode.removeChild(tempForm);
          ok ? resolve() : reject(new Error('Form submit failed'));
        }

        tempForm.method = 'GET';
        tempForm.action = scriptUrl;
        tempForm.target = 'reg-sheet-frame';
        tempForm.style.display = 'none';

        Object.keys(payload).forEach(function (key) {
          var input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = payload[key];
          tempForm.appendChild(input);
        });

        iframe.onload = function () { finish(true); };
        document.body.appendChild(tempForm);
        tempForm.submit();

        setTimeout(function () { finish(true); }, 2500);
      });
    }

    function submitRegistration(payload) {
      var params = buildParams(payload);
      var scriptUrl = getGoogleScriptUrl().trim();
      var query = scriptUrl + '?' + params.toString();

      return fetch(query)
        .then(function (res) { return res.text(); })
        .then(function (text) {
          if (responseLooksSuccessful(text)) return;
          if (text.indexOf('"error"') !== -1) {
            throw new Error('server');
          }
          return submitViaHiddenForm(payload, scriptUrl);
        })
        .catch(function (err) {
          if (err && err.message === 'server') {
            throw err;
          }
          return submitViaHiddenForm(payload, scriptUrl);
        });
    }

    regForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearRegError();

      var scriptUrl = getGoogleScriptUrl().trim();
      if (!scriptUrl) {
        showRegError('Registration is not connected yet. Please add your Google Sheets URL in webinar-config.js.');
        return;
      }

      var payload = {
        timestamp: new Date().toISOString(),
        full_name: document.getElementById('full-name').value.trim(),
        mobile: document.getElementById('mobile').value.trim(),
        email: document.getElementById('email').value.trim(),
        city: (document.getElementById('city').value || '').trim(),
        profession: document.getElementById('profession').value || '',
        assessment_score: document.getElementById('assessment-score').value || '',
        source: 'Life Reset Masterclass'
      };

      setSubmitting(true);

      submitRegistration(payload)
        .then(function () {
          showRegSuccess();
        })
        .catch(function () {
          showRegError('Could not save your registration. In Apps Script, set SPREADSHEET_ID, run testWriteRow(), then redeploy.');
        })
        .finally(function () {
          setSubmitting(false);
        });
    });
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
