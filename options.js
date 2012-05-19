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
  timeout: 30,
  showInfo: false
};

var canBlock = false;

// On document ready
$(function () {

  // Localize for foreign users
  localizePage();

  // Check extensions permissions
  function checkPermissions(result) {
    canBlock = !!result;
    // Load options from localStorage
    restoreOptions();

    function granted(granted) {
      canBlock = !!granted;
      if (canBlock) {
        $('label[for="showInfo"]').css('text-decoration', 'none');
        $('#requestPermission').remove();
        chrome.extension.sendRequest(null, {msg: 'canBlock'});
      }
    }

    if (!canBlock) {
      $('label[for="showInfo"]').css('text-decoration', 'line-through');
      $('<button>')
        .attr('id', 'requestPermission')
        .text('Allow')
        .appendTo('#allowBlock')
        .click(function () {
          chrome.permissions.request({permissions: ["webRequest", "webRequestBlocking"]}, granted);
      })
    } else {
      chrome.extension.sendRequest(null, {msg: 'canBlock'});
    }
  }
  chrome.permissions.contains({permissions: ["webRequest", "webRequestBlocking"]}, checkPermissions);

  $('#hasTimeout').change(function () {
    if ($('#hasTimeout').is(':checked')) {
      $('#timeout,#timeoutRange').prop('disabled', false);
      $('label[for="hasTimeout"]').removeClass('disabled');
    } else {
      $('#timeout,#timeoutRange').prop('disabled', true);
      $('label[for="hasTimeout"]').addClass('disabled');
    }
  }).change();

  $('#showInfo').change(function () {
    if ($(this).is(':checked')) {
      if (canBlock) {
        $('label[for="' + this.id + '"]').removeClass('disabled');
      }else {
        $('#showInfo').prop('checked', false);
      }
    } else {
      $('label[for="' + this.id + '"]').addClass('disabled');
    }
  }).change();

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

  // Bind the buttons
  $('#saveButton').click(saveOptions);
  $('#resetButton').click(resetOptions);

});

// Restores options from localStorage
function restoreOptions() {
  $('#hasTimeout')
    .prop('checked', (localStorage['hasTimeout'] === 'true') || defaults.hasTimeout).change();
  $('#timeout').val(parseInt(localStorage['timeout'] || defaults.timeout));
  $('#timeoutRange').val(parseInt(localStorage['timeout'] || defaults.timeout));
  $('#showInfo')
    .prop('checked', (localStorage['showInfo'] === 'true') || defaults.showInfo).change();
}

// Saves options to localStorage.
function saveOptions() {
  localStorage['hasTimeout'] = $('#hasTimeout').prop('checked');
  localStorage['timeout'] = $('#timeout').val();
  localStorage['showInfo'] = $('#showInfo').prop('checked');
  showDone();
}

// Resets options
function resetOptions() {
  // Reset
  $('#hasTimeout').prop('checked', defaults.hasTimeout).change();
  $('#timeout').val(defaults.timeout);
  $('#timeoutRange').val(defaults.timeout);
  $('#showInfo').prop('checked', defaults.showInfo).change();
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