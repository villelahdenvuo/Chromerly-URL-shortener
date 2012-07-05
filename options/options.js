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
    along with this program.  If not, see <http://www.gnu.org/licenses/>. */


var defaults = {
  hasTimeout: false,
  timeout: 30,
  showInfo: false
};

var canBlock = false;

$(function () {
  // Localize for foreign users.
  localizePage();

  // Check for webRequest and webRequestBlocking permissions.
  chrome.permissions.contains({permissions:["webRequest", "webRequestBlocking"]}, checkPermissions);
});

function checkPermissions(result) {
  canBlock = !!result;

  // Permissions are checked, initialize.
  restoreOptions();
  initializeForm();

  function granted(granted) {
    canBlock = !!granted;
    if (canBlock) {
      $('#showInfo').parent().css('text-decoration', 'none');
      $('#requestPermission').remove();
      // Tell the background script that it can add a listener.
      chrome.extension.sendRequest(null, {msg: 'canBlock'});
    }
  }

  if (!canBlock) {
    $('#showInfo').parent().css('text-decoration', 'line-through');
    $('<button>')
      .attr('id', 'requestPermission')
      .text('Allow')
      .appendTo('#allowBlock')
      .click(function () {
        chrome.permissions.request({permissions: ["webRequest", "webRequestBlocking"]}, granted);
    });
  } else {
    chrome.extension.sendRequest(null, {msg: 'canBlock'});
  }
}

function initializeForm () {
  function updateTimeoutWarning() {
    var warn = $('#timeout').val() < 1 && $('#hasTimeout').prop('checked');
    $('#timeoutWarning').toggleClass('show', warn);
  }

  $('#timeout').change(updateTimeoutWarning);
  $('#hasTimeout').change(function () {
    updateTimeoutWarning();
    var checked = $(this).prop('checked');
    $('#timeout').prop('disabled', !checked);
    $(this).parent().toggleClass('disabled', !checked);
  }).change();

  $('#showInfo').change(function () {
    var $si = $(this);
    if ($si.is(':checked')) {
      // Do not allow enabling if we have no permission.
      if (canBlock) {
        $si.parent().removeClass('disabled');
        $('#infoTip').addClass('show');
      } else {
        $si.prop('checked', false).parent().addClass('disabled');
      }
    } else {
      $si.parent().addClass('disabled');
      $('#infoTip').removeClass('show');
    }
  }).change();

  // Bind the buttons
  $('#saveButton').click(saveOptions);
  $('#resetButton').click(resetOptions);
}

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
  $('#done').addClass('show');
  setTimeout(function () { $('#done').removeClass('show'); }, 1000);
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