import $ from 'jquery';

export default () => {
  window.addEventListener('DOMContentLoaded', () => {
    console.log('It, works!');

    window.setTimeout(() => $('.alert').alert('close'), 5000);

    $('body').tooltip({ selector: '[data-tooltip="true"]' });
  });
};
