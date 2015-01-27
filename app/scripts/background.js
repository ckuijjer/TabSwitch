'use strict';

var mru = {};

var MostRecentOrder = {
    get: function(windowId) {
        var order = mru[windowId] || [];
        return order;
    }
};

function add(windowId, tabId) {
    var windowMru = mru[windowId] || [];

    windowMru = windowMru.filter(function(i) { return i !== tabId; });
    windowMru.unshift(tabId);

    mru[windowId] = windowMru;
}

function remove(windowId, tabId) {
    var windowMru = mru[windowId];
    if (windowMru) {
        mru[windowId] = windowMru.filter(function(i) {
            return i !== tabId;
        });
    }
}

chrome.runtime.onInstalled.addListener(function (details) {
    console.log('previousVersion', details.previousVersion);
});

// todo:
// onCreated messes up the most recently used ordering
// example is creating a tab in the background
// this also holds for onUpdated I think, but simply having
// these events doesn't fix it.

chrome.tabs.onCreated.addListener(function (tab) {
    add(tab.windowId, tab.id);
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    add(tab.windowId, tab.id);
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
    add(activeInfo.windowId, activeInfo.tabId);
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    remove(removeInfo.windowId, tabId);
});

// event listener for switching to the previous tab
chrome.commands.onCommand.addListener(function(command) {
    if (command === 'previous') {
        switchToPrevious();
    }
});

function switchToPrevious() {
    chrome.windows.getCurrent(function(currentWindow) {
        var order = MostRecentOrder.get(currentWindow.id);

        if (order && order.length >= 1) {
            var previousTab = order[1];
            chrome.tabs.update(previousTab, { active: true, highlighted: true });
        }
    });
}
