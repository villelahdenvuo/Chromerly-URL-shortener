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

window.addEventListener('load', function () {
  var intent = (window.intent || window.webkitIntent), global = localStorage;
  if (!(intent && intent.data)) { return; }
  var url = Array.isArray(intent.data) ? intent.data[0] : intent.data;

  shortenURL(url, function (err, code, original) {
    if (err) { createErrorNotification(code); intent.postResult(''); }
    var done = window.onclick = function () { intent.postResult('http://urly.fi/' + code); }
      , url = global.baseURL + code
      , $ = function (id) { return document.getElementById(id); }
      , originalURL = $('original'), link = $('link')
      , copied = $('copied'), qr = $('qr');
    copyToClipboard(url);
    // Populate HTML
    link.href = url;
    link.innerHTML = global.baseURL.substring(7) + '<span id="code">' + code + '</span>';
    originalURL.innerText = original.replace(/^([^:]+:\/\/[^\/]+).*(\/[^\/?]+)(\?.*)?$/, "$1/...$2");
    copied.innerText = chrome.i18n.getMessage('NoticeCopied');
    qr.src = 'http://chart.googleapis.com/chart?chs=125x125&cht=qr&chld=Q|0&chl=' + escape(url);

    if (global.hasTimeout == 'true') { setTimeout(done, (parseInt(global.timeout, 10) * 1000) || 0); }
  });
  window.oncontextmenu = function (e) { e.preventDefault(); };
});