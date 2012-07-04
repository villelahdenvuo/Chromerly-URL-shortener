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

function shortenURL(url, cb) {
  var xhr = new XMLHttpRequest(),
      urly = 'http://urly.fi/api/shorten/?url=' + escape(url);
  xhr.onreadystatechange = function() {
    if (xhr.readyState != 4) {return;}
    if        (xhr.status == 200) {cb(false, xhr.responseText, url);
    } else if (xhr.status == 403) {cb(true, 'FailFormat');
    } else if (xhr.status == 409) {cb(true, 'FailLimit');
    } else                        {cb(true, 'FailGeneral');}
  }
  xhr.open('GET', urly, true);
  xhr.send();
}

function copyToClipboard(text) {
  var copyInput = document.getElementById('url');
  copyInput.value = text;
  copyInput.select();
  document.execCommand('copy', false, null);
}

function createNotification (code, original) {
  localStorage['original'] = original;
  localStorage['code'] = code;
  var notification = webkitNotifications.createHTMLNotification('note.html');

  if (localStorage['hasTimeout'] === 'true') {
    var timeout = parseInt(localStorage['timeout']);
    if (!timeout) { return; }
    setTimeout(function () { notification.cancel(); }, timeout * 1000);
  }
  notification.show();
}

function createErrorNotification(msg, tab) {
  setIcon('stop', 'UrlyFailed', tab);
  var notification = webkitNotifications.createNotification('graphics/stop.png',
                                           chrome.i18n.getMessage('UrlyFailed'),
                                           chrome.i18n.getMessage(msg));
  setTimeout(function () {
    setIcon('16', 'UrlyShorten', tab);
    notification.cancel();
  }, 10000);
  notification.show();
}

function setIcon(i, t, tab) {
  if (!tab) { return; }
  chrome.pageAction.setIcon({path: 'graphics/' + i + '.png', tabId: tab.id});
  chrome.pageAction.setTitle({title: chrome.i18n.getMessage(t), tabId: tab.id});
};