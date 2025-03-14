var mru = {};

var MostRecentOrder = {
  get: function (windowId) {
    var order = mru[windowId] || [];
    return order;
  },
};

// Adding an activated tab should put it in front of the MRU
function addActive(windowId, tabId) {
  var windowMru = mru[windowId] || [];

  windowMru = windowMru.filter(function (i) {
    return i !== tabId;
  });
  windowMru.unshift(tabId);

  mru[windowId] = windowMru;
}

// Adding a created tab should put it at the second spot of the MRU
function addCreated(windowId, tabId) {
  var windowMru = mru[windowId] || [];
  windowMru.splice(1, 0, tabId);
  // windowMru.push(tabId);
  mru[windowId] = windowMru;
}

function remove(windowId, tabId) {
  var windowMru = mru[windowId];
  if (windowMru) {
    mru[windowId] = windowMru.filter(function (i) {
      return i !== tabId;
    });
  }
}

/*
function log(message, windowId, tabId) {
    try {
        chrome.tabs.get(tabId, function(tab) {
            console.log(mru[windowId].join(' '));
            console.log(`${message}: ${tab.id} - ${tab.status} - ${tab.url}`);
        });
    } catch(e) {
        console.warn(e);
    }
}
*/

chrome.runtime.onInstalled.addListener(function (details) {
  console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onCreated.addListener(function (tab) {
  addCreated(tab.windowId, tab.id);
});

/* No reason I think to change the MRU when a tab gets updated
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    add(tab.windowId, tab.id);
});
*/

chrome.tabs.onActivated.addListener(function (activeInfo) {
  addActive(activeInfo.windowId, activeInfo.tabId);
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
  remove(removeInfo.windowId, tabId);
});

function switchToPrevious() {
  chrome.windows.getCurrent(function (currentWindow) {
    var order = MostRecentOrder.get(currentWindow.id);

    if (order && order.length >= 1) {
      var previousTab = order[1];
      chrome.tabs.update(previousTab, {
        active: true,
        highlighted: true,
      });
    }
  });
}

// event listener for switching to the previous tab
chrome.commands.onCommand.addListener(function (command) {
  if (command === 'previous') {
    switchToPrevious();
  }
});

// Message passing between the UI and this service worker
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  const { command, arguments } = request;

  if (command === 'getMostRecentOrder') {
    const { windowId } = arguments;

    const mostRecentOrder = MostRecentOrder.get(windowId);

    sendResponse({ mostRecentOrder });
  }
  return true; // Keep the messaging channel open for async sendResponse
});
