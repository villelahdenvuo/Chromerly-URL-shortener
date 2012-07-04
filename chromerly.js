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

window.addEventListener('load', initialize);

function initialize() {
  var UrlyReserved = new RegExp(/info|static/), infoTabs = [], blocking = false;

  // Listen for tab updates (to show pageAction icon in the omnibox).
  chrome.tabs.onUpdated.addListener(function(tabId, info) {
    chrome.pageAction.show(tabId);
    if (info.url && !info.url.indexOf('http://urly.fi/info/')) {infoTabs.push(tabId)};
  });

  // A simple wrapper to shorten, notify and update icon.
  function shortenWrapper(url, tab) {
    setIcon('loading', 'UrlyProcessing', tab);
    shortenURL(url, function (err, code, original) {
      if (err) { createErrorNotification(code, tab); return; }
      setIcon('16', 'UrlyShorten', tab);
      copyToClipboard('http://urly.fi/' + code);
      createNotification(code, original);
    });
  }

  // Show info pages instead of redirecting, if the use so desires.
  function onUrlyRequest(data) {
    if (localStorage['showInfo'] == 'false'
     || 'http://urly.fi/' == data.url
     || UrlyReserved.test(data.url)) { return; }  // Don't redirect these.
    if (infoTabs.indexOf(data.tabId) != -1) {     // Or if already on an info page.
      infoTabs.splice(infoTabs.indexOf(data.tabId), 1); return;
    }
    localStorage['infoUrl'] = data.url;
    return {redirectUrl: chrome.extension.getURL("info.html")};
    //return {cancel: true};
  }

  function permission(has) {
    if (has) {
      blocking = true;
      chrome.webRequest.onBeforeRequest.addListener(onUrlyRequest,
        {urls: ['http://urly.fi/*'], types: ['main_frame']}, ['blocking']);
    }
  }
  chrome.permissions.contains({permissions: ['webRequest', 'webRequestBlocking']}, permission);

  // Listen to other parts of the extension, maybe they have something interesting to say.
  chrome.extension.onRequest.addListener(function (req) {
    if (req.msg == 'canBlock' && !blocking) {
      // Got message from the options page, that we have permission! Check again.
      chrome.permissions.contains({permissions: ["webRequest", "webRequestBlocking"]}, permission);
    }
  });

  ///////////////////////// USER INTERACTION /////////////////////////

  // Initialize context menus
  function createMenu(name, context, source) {
    chrome.contextMenus.create({
      title: chrome.i18n.getMessage(name), contexts: [context],
      onclick: function (i, tab) { shortenWrapper(source(i), tab); }});
  }
  createMenu('ContextSelection', 'selection', function (i) { return i.selectionText; });
  createMenu('ContextPage',      'page',      function (i) { return i.pageUrl; });
  createMenu('ContextLink',      'link',      function (i) { return i.linkUrl; });
  createMenu('ContextImage',     'image',     function (i) { return i.srcUrl; });
  createMenu('ContextVideo',     'video',     function (i) { return i.srcUrl; });
  createMenu('ContextAudio',     'audio',     function (i) { return i.srcUrl; });

  // Listen for pageAction icon clicks
  chrome.pageAction.onClicked.addListener(function (tab) {
    shortenWrapper(tab.url, tab);
  });

  // Listen for omnibox keyword 'urly'.
  chrome.omnibox.onInputEntered.addListener(function (text) {
    chrome.tabs.getCurrent(function (tab) { shortenWrapper(text, tab); });
  });
}