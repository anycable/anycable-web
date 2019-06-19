import application from '../app';

application.component('.js-form', {
  init() {
    this.form = this.node.querySelector('form');
    this.inputs = this.form.querySelectorAll('input,textarea');
    this.submitBtn = this.form.querySelector('button[type="submit"]');

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.hideError();
      this.startLoading();
      this.submitData(this.readData()).then( () => {
        this.node.classList.add("is-submitted");
      }).catch((e) => {
        console.error(e);
        this.stopLoading();
        this.showError();
      });
    });

    // use "keyup" to handle IE
    this.form.addEventListener('keyup', (e) => {
      this.invalidate();
    });

    this.invalidate();
  },

  submitData(data) {
    console.log("Submitted:", data);
    return new Promise((resolve, reject) => {
      const delay = (Math.random() * 3000) | 0;

      if (data.email === 'fail') {
        setTimeout(reject, delay);
      } else {
        setTimeout(resolve, delay);
      }
    });
  },

  readData() {
    let data = {};
    for(let input of this.inputs) {
      data[input.name] = input.value;
    }
    return data;
  },

  startLoading(){
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

  stopLoading(){
    if (this.loadingTid) clearInterval(this.loadingTid);
    this.submitBtn.textContent = this.prevSubmitText;
    this.submitBtn.disabled = false;
  },

  showError(){
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
