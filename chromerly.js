/*  Chromerly is a Chrome Extension to utilize the Finnish urly.fi.
    Copyright (C) 2011  Ville 'tuhoojabotti' Lahdenvuo

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

localStorage['UrlyBaseURL'] = 'http://urly.fi/';
var UrlyReserved = new RegExp(/info|static/);
var UrlyInfoPage = new RegExp(/http:\/\/urly.fi\/info\/.*/);
var infoTabs = [];
var copyInput = document.getElementById('url');

// Create context menus
window.onload = function () {
  chrome.contextMenus.create({ //// PAGE
      "title": chrome.i18n.getMessage('ContextPage'),
      "contexts": ["page"], "onclick": function (i, tab) {
        handleContext(i.pageUrl, tab);}
  });
  chrome.contextMenus.create({ //// SELECTION
      "title": chrome.i18n.getMessage('ContextSelection'),
      "contexts": ["selection"], "onclick": function (i, tab) {
        handleContext(i.selectionText, tab);
  }});
  chrome.contextMenus.create({ //// LINK
      "title": chrome.i18n.getMessage('ContextLink'),
      "contexts": ["link"], "onclick": function (i, tab) {
        handleContext(i.linkUrl, tab);
  }});
  chrome.contextMenus.create({ //// IMAGE
      "title": chrome.i18n.getMessage('ContextImage'),
      "contexts": ["image"], "onclick": function (i, tab) {
        handleContext(i.srcUrl, tab);}
  });
  chrome.contextMenus.create({ //// VIDEO
      "title": chrome.i18n.getMessage('ContextVideo'),
      "contexts": ["video"], "onclick": function (i, tab) {
        handleContext(i.srcUrl, tab);
  }});
  chrome.contextMenus.create({ //// AUDIO
      "title": chrome.i18n.getMessage('ContextAudio'),
      "contexts": ["audio"], "onclick": function (i, tab) {
        handleContext(i.srcUrl, tab);
  }});
}

// Show icon
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {
  chrome.pageAction.show(tabId);
  // This tab is urly.fi info page
  if (changeInfo.url && UrlyInfoPage.test(changeInfo.url)) {
    infoTabs.push(tabId);
  }
});

///////////////////////// INTERACTION WITH THE BROWSER /////////////////////////

// URLY.FI REQUEST
function handleUrlyRequest(data) {
  // Don't redirect certain pages (like info itself)
  if (localStorage['showInfo'] === 'false'
      || localStorage['UrlyBaseURL'] === data.url
      || UrlyReserved.test(data.url)) {
    return;
  }
  // Don't block request if it is called from an info tab
  if(infoTabs.indexOf(data.tabId) != -1) {
    infoTabs.splice(infoTabs.indexOf(data.tabId), 1);
    return;
  }
  // Grab the code and redirect to info page
  var code = data.url.substring(15);
  return {redirectUrl: 'http:/urly.fi/info/' + code};
}
chrome.webRequest.onBeforeRequest.addListener(handleUrlyRequest,
  {urls: ["http://urly.fi/*"], types: ["main_frame"]}, ["blocking"]);

// ICON CLICK
chrome.pageAction.onClicked.addListener(function (tab) {
  setTab('loading', 'UrlyProcessing', tab);
  shortenURL(tab.url, function (err, code, original) {
    if (!err) { // No errors
      setTab('16', 'UrlyShorten', tab);
      copyToClipboard(localStorage['UrlyBaseURL'] + code);
      createNotification(code, original);
    } else {
      setTab('stop', 'UrlyFailed', tab);
      createErrorNotification(code, tab);
    }
  });
});

// MENU CLICK
function handleContext(url, tab) {
  setTab('loading', 'UrlyProcessing', tab);
  shortenURL(url, function (err, code, original) {
    if (!err) { // No errors
      setTab('16', 'UrlyShorten', tab);
      copyToClipboard(localStorage['UrlyBaseURL'] + code);
      createNotification(code, original);
    } else {
      setTab('stop', 'UrlyFailed', tab);
      createErrorNotification(code, tab);
    }
  });
}

// OMNIBOX keyword: urly
chrome.omnibox.onInputEntered.addListener(function(text) {
  shortenURL(text, function (err, code, original) {
    if (!err) { // No errors
      copyToClipboard(localStorage['UrlyBaseURL'] + code);
      createNotification(code, original);
    } else {
      createErrorNotification(code);
    }
  });
});

///////////////////////// UTILITY AND HELPERS /////////////////////////

function createNotification (code, original) {
  // Prepare the notification
  localStorage['code'] = code;
  localStorage['original'] = original;
  var notification = webkitNotifications.createHTMLNotification('note.html');
  // Check the options
  if (localStorage['hasTimeout'] === 'true') {
    var timeout = parseInt(localStorage['timeout']);
    if (timeout === 0) {
      notifcation = undefined;
      return;
    } else {
      setTimeout(function () {
        notification.cancel();
      }, timeout * 1000);
    }
  }
  notification.show(); // Show it!
}

function createErrorNotification(msg, tab) {
  var notification = webkitNotifications.createNotification('graphics/stop.png',
      chrome.i18n.getMessage('UrlyFailed'),
      chrome.i18n.getMessage(msg)
  );
  // Show notification and hide it after 10 seconds
  notification.show();
  setTimeout(function () {
    // Update the tab icon if we can
    if (tab !== undefined) {
      setTab('16', 'UrlyShorten', tab);
    }
    notification.cancel();
  }, 10000);
}

// SHORTEN url and call callback(errors?, shortened/error text)
function shortenURL(url, cb) {
  // Check if url seems rational (Thanks to Daring Fireball for the regex and searls (Justin Searls) for making it work in JS) - Added support for chrome:// links
  url = url.match(/\b((?:(https?|chrome):\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i);
  if (!url) { // url is null
    cb(true, 'FailFormat');
    return;
  } else {
    url = url[0];
  }
  // Now for the shortening!
  var xhr = new XMLHttpRequest(),
      urly = 'http://urly.fi/api/shorten/?url=' + escape(url);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {       cb(false, xhr.responseText, url);
      } else if (xhr.status === 403){ cb(true, 'FailFormat');
      } else if (xhr.status === 409){ cb(true, 'FailLimit');
      } else {                        cb(true, 'FailGeneral');}
    }
  }
  xhr.open('GET', urly, true);
  xhr.send();
}

// COPY text to clipboard
function copyToClipboard(text) {
  if(!copyInput) {return;}
  copyInput.value = text;
  copyInput.select();
  document.execCommand('copy', false, null);
}

// SET Icon and Tooltip to the omnibox
function setTab(i, t, tab) {
  chrome.pageAction.setIcon({path: 'graphics/' + i + '.png', tabId: tab.id});
  chrome.pageAction.setTitle({title: chrome.i18n.getMessage(t), tabId: tab.id});
};