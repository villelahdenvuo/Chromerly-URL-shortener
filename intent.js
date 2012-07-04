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

window.addEventListener('load', function() {
	var intent = (window.intent || window.webkitIntent);
	if (intent && intent.data) { handleIntent(intent.data); }
});

function handleIntent(data) {
	var url = Array.isArray(data) ? data[0] : data;

  shortenURL(url, function (err, code, original) {
    if (err) { createErrorNotification(code); return; }
    copyToClipboard('http://urly.fi/' + code);
    renderInfo(code, original);
  });
}

function renderInfo(code, original) {
	// Retrieve variables from localStorage
	var base = 'http://urly.fi/',
	    url = base + code;
	// Get HTML elements to modify
	var originalURL = document.getElementById('originalURL'),
	    link = document.getElementById('link'),
	    notification = document.getElementById('notification'),
	    qr = document.getElementById('qr');

	// Create the link
	link.href = url;
	link.innerHTML = base.substring(7)
	    + '<span id="code">' + code + '</span>';
	// Notification text
	originalURL.innerText = shorturl(original);
	notification.innerText = chrome.i18n.getMessage('NoticeCopied');
	// QR-Code image
	qr.src = 'http://chart.googleapis.com/chart?chs=125x125&cht=qr&chld=Q|0&chl=' + escape(url);
}

// Helpful little function, thanks to jhh!
function shorturl(url) {
  return url.replace(/^([^:]+:\/\/[^\/]+).*(\/[^\/?]+)(\?.*)?$/, "$1/...$2");
}