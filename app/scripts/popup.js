'use strict';

$(function() {
  // chrome.tabs.query(null, function(tabs) {
  chrome.tabs.getAllInWindow(null, function(tabs) {
    var $select = $('select');

    // add tabs to the select tag
    $(tabs).each(function(i, tab) {
      $('<option>')
        .text(tab.title)
        .val(tab.id)
        .appendTo($select);
    });

    // initialize select2
    $select
      .select2({
        matcher: matcher,
        closeOnSelect: false
      })
      .on('select2-close', reopen)
      .on('select2-selecting', switchTab)
      .select2("open");

    // close the window if escape is pressed and the search field is empty
    // unfortunately the keydown of select2 fires first, so we don't know what
    // the value of the search field was. this is a hacky way to try to remember
    // it hardly works, but it's a start.
    var prev = null;
    $('.select2-input').keydown(function(e) {
      if (e.keyCode === 27 && !prev) {
        window.close();
      }

      prev = $('.select2-input').val();
    })

    // internal functions
    function reopen() {
      $select.select2("open");
    }

    function switchTab(e) {
      // we don't want to make a selection in the input field
      e.preventDefault();

      chrome.tabs.update(+e.val, { selected: true });
      window.close();
    }

    function resize() {
      // todo: resizes way too much, once for every tab

      var height = $('select2-container').outerHeight() +
        $('.select2-results').outerHeight()
        + 40; // todo: magic number and probably OS dependent

      $('body').height(height);
    }

    function matcher(term, text, opt) {
      // hack to resize on search
      window.setTimeout(resize, 1);

      var textU = text.toUpperCase();
      var terms = term.trim().split(/\s+/);

      // empty search matches everything
      if (!term) {
        return true;
      }

      var matches = $(terms)
                    // make all terms uppercase
                    .map(function(i, el) { return el.toUpperCase(); })
                    // does the term occurs in the text?
                    .map(function(i, el) { return textU.indexOf(el) >= 0; })
                    // remove the False ones
                    .filter(function(i, el) { return el; });

      // all terms should be in the text
      return matches.length == terms.length;
    }
  });
});
