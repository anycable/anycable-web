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

      const data = new FormData(e.target);

      if (Boolean(data.get('name'))) {
        // Name field is honeypot to filter bots
        this.showError();
      } else {
        this.submitData(data);
      }
    });

    // use "keyup" to handle IE
    this.form.addEventListener('keyup', () => {
      this.invalidate();
    });
  },

  submitData(data) {
    window.open(this.actionURL + '?email=' + data.get('email'), '_blank');
    this.node.classList.add('is-submitted');
  },

  showError() {
    this.node.classList.add('is-error');
  },

  hideError() {
    this.node.classList.remove('is-error');
  },

  invalidate() {
    let formIsValid = true;

    this.hideError();

    for(let input of this.inputs) {
      if (input.required) {
        let value = input.value.trim();
        let inputIsValid = true;

        if (!value.length) {
          inputIsValid = false;
        }

        input.classList.toggle('is-valid', inputIsValid);
        input.classList.toggle('is-invalid', !inputIsValid);

        if (formIsValid && !inputIsValid) {
          formIsValid = false;
        }
      }
    }

    this.submitBtn.disabled = !formIsValid;

    return formIsValid;
  }
});
