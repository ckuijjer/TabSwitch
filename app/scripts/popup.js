'use strict';

$(function() {
    // chrome.tabs.query(null, function(tabs) {
    chrome.tabs.getAllInWindow(null, function(tabArray) {
        var $select = $('select');
        var tabs = {};
        var windowId = tabArray[0].windowId;
        var bg = chrome.extension.getBackgroundPage();
        var mru = bg.MostRecentOrder.get(windowId);

        // use the most recent order from the background page to order the tabs
        tabArray.sort(function(a, b) {
                var indexA = mru.indexOf(a.id);
                var indexB = mru.indexOf(b.id);

                if (indexA === -1 || indexB === -1) {
                    return indexB - indexA;
                } else {
                    return indexA - indexB;
                }
            });

        // put the current tab at the end
        var current = tabArray.shift();
        tabArray.push(current);

        // add tabs to the select tag
        tabArray.forEach(function(tab) {
                tab.uri = new URI(tab.url);
                tabs[tab.id] = tab;

                $('<option>')
                    .val(tab.id)
                    .text(tab.title)
                    .appendTo($select);
        });

        // internal functions
        function format(el) {
            var tab = tabs[el.id];

            return $('<div />')
                .append($('<img />')
                    .attr('src', getFavIconUrl(tab))
                    .attr('class', 'tab-icon'))
                .append($('<span />')
                    .attr('class', 'tab-text')
                    .text(tab.title))
                .html();
        }

        function formatNoMatches() {
            return '<div class="no-match">No matches found.</div>';
        }

        function getFavIconUrl(tab) {
            if (tab.favIconUrl && tab.favIconUrl.indexOf('chrome://') !== 0 ) {
                return tab.favIconUrl;
            } else {
                return 'images/no-favicon.png';
            }
        }

        function reopen() {
            $select.select2('open');
        }

        function switchTab(e) {
            // we don't want to make a selection in the input field
            e.preventDefault();

            chrome.tabs.update(+e.val, { selected: true });
            window.close();
        }

        function resize() {
            var height = $('.select2-container').outerHeight() +
                $('.select2-drop').outerHeight();

            $('body').height(height);
        }

        // function matcher(term, text, opt) {
        function matcher(term, text) {
            // hack to resize on search
            // todo: resizes way too often, once for every tab
            window.setTimeout(resize, 1);

            text = text.toUpperCase();
            var terms = term.trim().split(/\s+/);

            // todo: perhaps also include the url in the search
            // however sorting the results is needed for that, simply also searching
            // the entire url would lead to bad behaviour
            // var tabId = opt.val();
            // var url = tabsDict[tabId].uri;

            // empty search matches everything
            if (!term) {
                return true;
            }

            var matches = $(terms)
            // make all terms uppercase
            .map(function(i, el) { return el.toUpperCase(); })
            // does the term occurs in the text?
            .map(function(i, el) { return text.indexOf(el) >= 0; })
            // remove the False ones
            .filter(function(i, el) { return el; });

            // all terms should occur in the text
            return matches.length === terms.length;
        }

        // initialize select2
        $select
        .select2({
            matcher: matcher,
            formatResult: format,
            formatSelection: format,
            formatNoMatches: formatNoMatches,
            closeOnSelect: false
        })
        .on('select2-close', reopen)
        .on('select2-selecting', switchTab)
        .select2('open');

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
        });
    });
});
