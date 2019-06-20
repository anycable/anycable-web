import application from '../app';

application.component('.js-form', {
  init() {
    this.form = this.node.querySelector('form');
    this.inputs = this.form.querySelectorAll('input,textarea');
    this.submitBtn = this.form.querySelector('button[type="submit"]');
    this.actionURL = this.form.getAttribute('action');

    this.form.removeAttribute('action');
    this.form.removeAttribute('method');

    this.form.addEventListener('submit', e => {
      e.preventDefault();
      this.hideError();
      this.startLoading();
      this.submitData(new FormData(e.target));
    });

    // use "keyup" to handle IE
    this.form.addEventListener('keyup', () => {
      this.invalidate();
    });

    this.invalidate();
  },

  submitData(data) {
    let promise;
    if (this.actionURL === 'debug') {
      promise = this.fakeSubmitData(data);
    } else {
      promise = fetch(
        this.actionURL, {
          method: 'POST',
          body: data
        }
      ).then(response => {
        if (response.status !== 200) {
          throw new Error();
        }
        return response;
      });
    }
    return promise.then(() => {
      this.node.classList.add("is-submitted");
    }).catch(() => {
      this.stopLoading();
      this.showError();
    });
  },

  fakeSubmitData(formData) {
    let payload = {};
    formData.forEach(function(value, key){
      payload[key] = value;
    });
    console.log("Submitting form:", payload);

    const delay = (Math.random() * 3000) | 0;
    return new Promise((resolve, reject) => {
      if (payload.email === 'fail') {
        setTimeout(reject, delay);
      } else {
        setTimeout(resolve, delay);
      }
    });
  },

  startLoading() {
    this.prevSubmitText = this.submitBtn.textContent;
    this.submitBtn.disabled = true;
    this.submitBtn.textContent = ".";
    let counter = 1;
    this.loadingTid = setInterval(() => {
      counter++;
      if(counter > 5) counter = 1;
      this.submitBtn.textContent = ".".repeat(counter);
    },
    200);
  },

  stopLoading() {
    if (this.loadingTid) clearInterval(this.loadingTid);
    this.submitBtn.textContent = this.prevSubmitText;
    this.submitBtn.disabled = false;
  },

  showError() {
    this.node.classList.add('is-error');
  },

  hideError() {
    this.node.classList.remove('is-error');
  },

  invalidate() {
    let valid = true;

    this.hideError();

    for(let input of this.inputs) {
      if (input.required && !input.value) {
        valid = false;
      }
    }

    if (valid) {
      this.submitBtn.disabled = false;
    } else {
      this.submitBtn.disabled = true;
    }

    return valid;
  }
});
