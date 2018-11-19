import $ from 'jquery';

export default () => {
  window.addEventListener('DOMContentLoaded', () => {
    console.log('It, works!');

    window.setTimeout(() => $('.alert').alert('close'), 5000);

    $('body').tooltip({ selector: '[data-tooltip="true"]' });
    $('#tagsMultiSelect').multiselect({
      includeSelectAllOption: true,
      nonSelectedText: 'All',
      allSelectedText: 'All',
      enableFiltering: true,
      dropDown: true,
      maxHeight: 300,
      buttonClass: 'form-control d-flex align-items-center justify-content-between text-truncate',
      buttonContainer: '<div class="col-8 px-0"><div/>',
      templates: {
        filter: '<li class="multiselect-item filter"><div class="input-group px-1 mb-2"><input class="form-control multiselect-search" type="text"></div></li>',
        filterClearBtn: '<div class="input-group-append"><button class="multiselect-clear-filter btn btn-secondary" type="button"><i class="fas fa-times"></i></button>',
        li: '<li class="ml-2"><a class="text-secondary" href="javascript:void(0);"><label></label></a></li>',
      },
    });
  });
};
