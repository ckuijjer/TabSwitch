'use strict';

var mru = {};

var MostRecentOrder = {
    get: function(windowId) {
        return mru[windowId] || [];
    }
};

function add(windowId, tabId) {
    var windowMru = mru[windowId] || [];

    windowMru = windowMru.filter(function(i) { return i !== tabId; })
    windowMru.unshift(tabId);

    mru[windowId] = windowMru;
}

function remove(windowId, tabId) {
    var windowMru = mru[windowId];
    if (windowMru) {
        windowMru = windowMru.filter(function(i) { return i !== tabId; })
    }
}

chrome.runtime.onInstalled.addListener(function (details) {
    console.log('previousVersion', details.previousVersion);
});

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
