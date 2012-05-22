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


window.onload = function () {

  // Init some state variables and such.
  localStorage['UrlyBaseURL'] = 'http://urly.fi/';
  var UrlyReserved = new RegExp(/info|static/)
    , infoTabs = []
    , blocking = false;

  // Initialize context menus
  function onContext(url, tab) {
    setIcon('loading', 'UrlyProcessing', tab);
    shortenURL(url, function (err, code, original) {
      if (!err) {
        setIcon('16', 'UrlyShorten', tab);
        copyToClipboard(localStorage['UrlyBaseURL'] + code);
        createNotification(code, original);
      } else {createErrorNotification(code, tab);}
    });
  }

  function createMenu(name, context, action) {
    chrome.contextMenus.create({title: chrome.i18n.getMessage(name),
                                contexts: [context], onclick: action});
  }

  createMenu('ContextSelection', 'selection', function (i, tab) { onContext(i.selectionText, tab); });
  createMenu('ContextPage',      'page',      function (i, tab) { onContext(i.pageUrl, tab); });
  createMenu('ContextLink',      'link',      function (i, tab) { onContext(i.linkUrl, tab); });
  createMenu('ContextImage',     'image',     function (i, tab) { onContext(i.srcUrl, tab); });
  createMenu('ContextVideo',     'video',     function (i, tab) { onContext(i.srcUrl, tab); });
  createMenu('ContextAudio',     'audio',     function (i, tab) { onContext(i.srcUrl, tab); });

  // Listen for tab updates (to show pageAction icon in the omnibox).
  chrome.tabs.onUpdated.addListener(function(tabId, info) {
    chrome.pageAction.show(tabId);
    if (info.url && !info.url.indexOf('http://urly.fi/info/')) {infoTabs.push(tabId)};
  });

  // Show info pages instead of redirecting, if the use so desires.
  function onUrlyRequest(data) {
    if (localStorage['showInfo'] == 'false'
     || localStorage['UrlyBaseURL'] == data.url
     || UrlyReserved.test(data.url)) return; // Nope.

    if(infoTabs.indexOf(data.tabId) != -1) {
      infoTabs.splice(infoTabs.indexOf(data.tabId), 1); return;
    }

    return {redirectUrl: 'http:/urly.fi/info/' + data.url.substring(15)};
  }

  function permission(has) {
    if (has) {
      blocking = true;
      chrome.webRequest.onBeforeRequest.addListener(onUrlyRequest,
        {urls: ["http://urly.fi/*"], types: ["main_frame"]}, ["blocking"]);
    }
  }

  chrome.permissions.contains({permissions: ["webRequest", "webRequestBlocking"]}, permission);

  // Listen to other parts of the extension, maybe they have something interesting to say.
  chrome.extension.onRequest.addListener(function (req) {
    if (req.msg == 'canBlock' && !blocking) {
      chrome.permissions.contains({permissions: ["webRequest", "webRequestBlocking"]}, permission);
    }
  });

  // Listen for pageAction icon clicks
  chrome.pageAction.onClicked.addListener(function (tab) {
    setIcon('loading', 'UrlyProcessing', tab);
    shortenURL(tab.url, function (err, code, original) {
      if (!err) {
        setIcon('16', 'UrlyShorten', tab);
        copyToClipboard(localStorage['UrlyBaseURL'] + code);
        createNotification(code, original);
      } else {createErrorNotification(code, tab);}
    });
  });

  // Listen for omnibox keyword 'urly'.
  chrome.omnibox.onInputEntered.addListener(function (text) {
    shortenURL(text, function (err, code, original) {
      if (!err) {
        copyToClipboard(localStorage['UrlyBaseURL'] + code);
        createNotification(code, original);
      } else {createErrorNotification(code);}
    });
  });

}

///////////////////////// UTILITIES /////////////////////////

function createNotification (code, original) {
  localStorage['code'] = code;
  localStorage['original'] = original;
  var notification = webkitNotifications.createHTMLNotification('note.html');

  if (localStorage['hasTimeout'] === 'true') {
    var timeout = parseInt(localStorage['timeout']);
    if (timeout === 0) {return;}

    setTimeout(function () {
      notification.cancel();
    }, timeout * 1000);
  }
  notification.show();
}

function createErrorNotification(msg, tab) {
  if (tab) {setIcon('stop', 'UrlyFailed', tab);}
  var notification = webkitNotifications.createNotification('graphics/stop.png',
                                           chrome.i18n.getMessage('UrlyFailed'),
                                           chrome.i18n.getMessage(msg));
  setTimeout(function () {
    if (tab) {setIcon('16', 'UrlyShorten', tab);}
    notification.cancel();
  }, 10000);
  notification.show();
}

function setIcon(i, t, tab) {
  chrome.pageAction.setIcon({path: 'graphics/' + i + '.png', tabId: tab.id});
  chrome.pageAction.setTitle({title: chrome.i18n.getMessage(t), tabId: tab.id});
};

function shortenURL(url, cb) {
  var xhr = new XMLHttpRequest()
    , urly = 'http://urly.fi/api/shorten/?url=' + escape(url);
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
  if(!copyInput) {return;}
  copyInput.value = text;
  copyInput.select();
  document.execCommand('copy', false, null);
}