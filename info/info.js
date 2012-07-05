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

$(function () {
  localizePage();
  loadInfo();
});

function loadInfo() {
  var global = localStorage, url = global.infoUrl, code = url.split('/').splice(3);

  $('#code').text('/' + code);

  $.get(global.baseURL + 'api/info/' + code)
  .complete(function onComplete(data) {
    if (data.status === 200) {
      renderInfo(JSON.parse(data.responseText));
    } else {
      $('#loading').fadeOut(300);
      $('#fail').fadeIn(300);
      $('footer').addClass('show');
    }
  });
}

function renderInfo(info) {
  var url = info.url;

  // Load site thumbnail.
  var thumb = $('#thumb').attr('src', 'http://pagepeeker.com/thumbs.php?size=m&url=' + url);
  setInterval(function () {
    thumb.attr('src', 'http://pagepeeker.com/thumbs.php?size=m&a=' + Date.now() + '&url=' + url);
  }, 2500);

  // Set information
  $('#redirect a').text(info.url).attr('href', url);
  $('#thumblink').attr('href', url);
  $('#nuses').text(info.visits);
  $('#created').text(info.submit_time);

  // Fetch link title
  $.get(url)
  .complete(function onComplete(data) {
    if (data.status === 200) {
      var title = (data.responseText.replace(/\n/g, '').match(/<title>(.+?)<\/title>/mi) || [])[1];
      if (title) {
        $('[i18n="InfoUrlTitle"]').fadeIn(150);
        $('#title').hide().html(title).fadeIn(300);
      }
    }
  });

  // Show load animation.
  thumb.load(function () {
    $('#loading').fadeOut(200);
    $('#info').fadeIn(350);
    $('footer').addClass('show');
  });
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