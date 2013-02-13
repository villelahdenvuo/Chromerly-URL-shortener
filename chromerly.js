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

window.addEventListener('load', function initialize() {
  var UrlyReserved = new RegExp(/info|static/), global = localStorage;

  // Setup global settings
  global.baseURL = 'http://urly.fi/';
  global.pushoverToken = 'snOyjwlhaasYSf063VdR4K3GdphKxK';

  // Listen for tab updates (to show pageAction icon in the omnibox).
  chrome.tabs.onUpdated.addListener(function(tabId, info) {
    chrome.pageAction.show(tabId);
  });

  // A simple wrapper to shorten, notify and update icon.
  function shortenWrapper(url, tab) {
    setIcon('loading', 'UrlyProcessing', tab);
    shortenURL(url, function (err, code, original) {
      if (err) { createErrorNotification(code, tab); return; }
      setIcon('16', 'UrlyShorten', tab);
      copyToClipboard(global.baseURL + code);
      createNotification(code, original);
    });
  }

  // Show info pages instead of redirecting, if the user so desires.
  function onUrlyRequest(data) {
    if (global.showInfo == 'false' || global.baseURL == data.url ||
      UrlyReserved.test(data.url)) { return; }

    global.infoUrl = data.url;
    return {redirectUrl: chrome.extension.getURL('info/info.html')};
  }

  function permission(has) {
    if (!has) { return; }
    chrome.webRequest.onBeforeRequest.addListener(onUrlyRequest,
      {urls: [global.baseURL + '*'], types: ['main_frame']}, ['blocking']);
  }
  chrome.permissions.contains({permissions: ['webRequest', 'webRequestBlocking']}, permission);
  chrome.extension.onRequest.addListener(function (req) {
    if (req.msg == 'canBlock') {
      chrome.permissions.contains({permissions: ['webRequest', 'webRequestBlocking']}, permission);
    }
  });

  // Initialize context menus
  [ ['Selection', function (i) { return i.selectionText; }],
    ['Page',      function (i) { return i.pageUrl;       }],
    ['Link',      function (i) { return i.linkUrl;       }],
    ['Image',     function (i) { return i.srcUrl;        }],
    ['Video',     function (i) { return i.srcUrl;        }],
    ['Audio',     function (i) { return i.srcUrl;        }]
  ].forEach(function initContext(c) {
    chrome.contextMenus.create({
      title: chrome.i18n.getMessage('Context' + c[0]), contexts: [c[0].toLowerCase()],
      onclick: function (i, tab) { shortenWrapper(c[1](i), tab); }});
  });

  // Listen for pageAction icon clicks
  chrome.pageAction.onClicked.addListener(function (tab) {
    shortenWrapper(tab.url, tab);
  });

  // Listen for omnibox keyword 'urly'.
  chrome.omnibox.onInputEntered.addListener(function (text) {
    chrome.tabs.getCurrent(function (tab) { shortenWrapper(text, tab); });
  });
});