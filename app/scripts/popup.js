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
        // function format(el, container, query) {
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

        function splitTerm(term) {
            return term.trim().split(/\s+/);
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

            chrome.tabs.update(+e.val, { active: true, highlighted: true });
            window.close();
        }

        function resize() {
            var height = $('.select2-container').outerHeight() +
                $('.select2-drop').outerHeight();

            $('body').height(height);
        }

        function matcher(term, text, opt) {
            // hack to resize on search
            // todo: resizes way too often, once for every tab
            window.setTimeout(resize, 1);

            text = text.toUpperCase();
            var terms = splitTerm(term);

            // todo: to use the entire url we need term weighting
            var tabId = opt.val();

            // add the hostname minus the tld to the text to search on
            var url = tabs[tabId].uri;
            var hostname = url.hostname();
            var tldLocation = hostname.indexOf(url.tld());
            if (tldLocation > 0) {
                hostname = hostname.substring(0, tldLocation - 1);
            }
            text = text + ' ' + hostname.toUpperCase();

            // empty search matches everything
            if (!term) {
                return true;
            }

            var matches = $(terms)
                // make all terms uppercase
                .map(function(i, el) { return el.toUpperCase(); })
                // does the term occurs in the text?
                .map(function(i, el) { return text.indexOf(el) > -1; })
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
