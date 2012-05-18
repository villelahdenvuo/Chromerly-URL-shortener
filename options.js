/*  Chromerly is a Chrome Extension to utilize the Finnish urly.fi.
    Copyright (C) 2011-2012  Ville 'tuhoojabotti' Lahdenvuo

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// Set defaults
var defaults = {
  hasTimeout: false,
  timeout: 30
};

// On document ready
$(function () {

  // Localize for foreign users
  localizePage();

  // Initialize setting scripts
  $('#hasTimeout').change(function () {
    if ($('#hasTimeout').is(':checked')) {
      $('#timeout,#timeoutRange').prop('disabled', false);
      $('label[for="hasTimeout"]').css('color', '#000');
    } else {
      $('#timeout,#timeoutRange').prop('disabled', true);
      $('label[for="hasTimeout"]').css('color', '#AAA');
    }
  });

  // Changing this will update the number
  $('#timeoutRange').change(function () {
    $('#timeout').val(this.valueAsNumber);

    if ($('#timeout').val() < 1) {
      $('#timeoutWarning').slideDown();
    } else {
      $('#timeoutWarning').slideUp();
    }
  });

  // Also changing the number will update the slider
  function updateTimeout() {
    $('#timeoutRange').val(this.valueAsNumber);

    if ($('#timeout').val() < 1) {
      $('#timeoutWarning').slideDown();
    } else {
      $('#timeoutWarning').slideUp();
    }
  }

  $('#timeout')
    .change(updateTimeout)
    .mousemove(updateTimeout)
    .keydown(updateTimeout);

  // Load options from localStorage
  restoreOptions();

  if (!$('#hasTimeout').is(':checked')) {
    $('#timeout,#timeoutRange').prop('disabled', true);
    $('label[for="hasTimeout"]').css('color', '#AAA');
  }

});

// Restores options from localStorage
function restoreOptions() {
  $('#hasTimeout')[0].checked = (localStorage['hasTimeout'] === 'true') || defaults.hasTimeout;
  $('#timeout').val(parseInt(localStorage['timeout'] || defaults.timeout));
  $('#timeoutRange').val(parseInt(localStorage['timeout'] || defaults.timeout));
}

// Saves options to localStorage.
function saveOptions() {
  localStorage['hasTimeout'] = $('#hasTimeout')[0].checked;
  localStorage['timeout'] = $('#timeout').val();
  showDone();
}

// Resets options
function resetOptions() {
  // Reset
  $('#hasTimeout')[0].checked = defaults.hasTimeout;
  $('#timeout').val(defaults.timeout);
  $('#timeoutRange').val(defaults.timeout);
  $('#hasTimeout').trigger('change');
  // Save
  saveOptions();
  showDone();
}

function showDone() {
  $('#msg').css('opacity', 1).addClass('rot');
  setTimeout(function () {
    $('#msg').css('opacity', 0).removeClass('rot');
  }, 1000);
}

// Localizes page for foreign users
function localizePage() {
  $("[i18n]:not(.i18n-replaced)").each(function() {
    $(this).html(chrome.i18n.getMessage($(this).attr("i18n")));
  });
  $("[i18n_title]:not(.i18n-replaced)").each(function() {
    $(this).attr("title", chrome.i18n.getMessage($(this).attr("i18n_title")));
  });
}