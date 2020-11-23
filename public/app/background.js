// Called when the user clicks on the browser action

function onCaptured(imageUri) {
   console.log(imageUri);
}
 
function onError(error) {
   console.log(`Error: ${error}`);
}

if(typeof chrome.app.isInstalled!=='undefined') {
   chrome.browserAction.onClicked.addListener(function(tab) {
      chrome.tabs.query({active: true, lastFocusedWindow:true},function(tabs) {
         var activeTab = tabs[0];
         chrome.tabs.sendMessage(activeTab.id, {tabs}, {"message": "clicked_browser_action"});
      });
   });
   
   // function modifyDOM() {
   //    //You can play with your DOM here or check URL against your regex
   //    console.log('Tab script:');
   //    console.log(document.body);
   //    return document.body.innerHTML;
   // }
   
   // chrome.runtime.onMessage.addListener(function(request, sender) {
   //    chrome.tabs.query({active: false, currentWindow:true},function(tabs) {
   //       let activeTab = tabs.find(r => r.url == request.options.url);
   //       // chrome.tabs.update(activeTab.id, {active: true});
   //       // chrome.tabs.sendMessage(activeTab.id, {target: 'app', type: 'setMessage', body: 'How are you'}, function(ee) {
   //       //    console.log("eeeeeeeeeeeeeeeeeeeeeeee", ee, chrome.runtime.lastError);
   //       // });
         
   //    //    chrome.tabs.executeScript({
   //    //       code: '(' + modifyDOM + ')();' //argument here is a string but function.toString() returns function's code
   //    //    }, (results) => {
   //    //       //Here we have just the innerHTML and not DOM structure
   //    //       console.log('Popup script:')
   //    //       console.log(results[0]);
   //    //   });

   //    // chrome.tabs.update(activeTab.id, {url: activeTab.url}, function() {
   //    //    console.log("chrome.runtime.lastError", chrome.runtime.lastError)
   //    // });

   //    //    chrome.tabs.executeScript(null, {
   //    //       file: '/static/js/content.js'
   //    //    }, function(ddd) {
   //    //       console.log("ddd", ddd);
   //    //       // If you try and inject into an extensions page or the webstore/NTP you'll get an error
   //    //       if (chrome.runtime.lastError) {
   //    //           console.log('There was an error injecting script : \n' + chrome.runtime.lastError.message);
      
   //    //       }
   //    //   });
   //       // chrome.tabs.executeScript(null, { file: 'src/content' });
   //    });
   // });

   // chrome.windows.onFocusChanged.addListener(function(window) {
   //    chrome.tabs.query({active: false, currentWindow:true},function(tabs) {
   //       console.log("tabs", tabs);
   //       var activeTab = tabs[5];
   //       chrome.tabs.update(activeTab.id, {active: true})
   //       // chrome.tabs.sendMessage(activeTab.id, {tabs}, {"message": "clicked_browser_action"});
   //    });
   // });

}

chrome.runtime.onMessage.addListener((message, sender) => {
   if (message.type === 'notification') {
     chrome.notifications.create('', message.options);
   }

   if (message.type === 'DOMInfo') {
      chrome.tabs.query({
			active: true,
			lastFocusedWindow: true
		}, tabs => {
			// ...and send a request for the DOM info...
			chrome.tabs.sendMessage(
				tabs[0].id,
				{from: 'popup', subject: 'DOMInfo'});
		});
   }

   if (message.type === 'chromeModal') {
      chrome.tabs.query({"active":true, "currentWindow":true},function(tabs){
         console.log(tabs)
         var activeTab = tabs[0];
         console.log(activeTab)
         chrome.tabs.sendMessage(activeTab.id, {"message":"chrome_modal", status: message.status})
     })
   }
   
   if (message.type === 'budgeText') {
      if (message.badgeText && message.badgeText !== '') {
         chrome.tabs.get(sender.tab.id, function(tab) {
             if (chrome.runtime.lastError) {
                 return; // the prerendered tab has been nuked, happens in omnibox search
             }
             if (tab.index >= 0) { // tab is visible
                 chrome.browserAction.setBadgeText({ tabId:tab.id, text: '*' }); // message.badgeText
                 chrome.browserAction.setBadgeBackgroundColor({ tabId: tab.id, color: "red" });
             } else { // prerendered tab, invisible yet, happens quite rarely
                 var tabId = sender.tab.id, text = message.badgeText;
                 chrome.webNavigation.onCommitted.addListener(function update(details) {
                     if (details.tabId == tabId) {
                         chrome.browserAction.setBadgeText({tabId: tabId, text: text});
                         chrome.browserAction.setBadgeBackgroundColor({tabId: tabId, color: "red"});
                         chrome.webNavigation.onCommitted.removeListener(update);
                     }
                 });
             }
         });
      }   
   }
});


// chrome.runtime.onMessage.addListener(
//    function(request, sender, sendResponse) {
//       // read `newIconPath` from request and read `tab.id` from sender
//       chrome.browserAction.setIcon({
//          path: request.newIconPath,
//          tabId: sender.tab.id
//       });
// });

// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//    if (request.method == "getStatus")
//      sendResponse({status: localStorage['status']});
//    else
//      sendResponse({}); // snub them.
// });

// chrome.runtime.onMessage.addListener(
//    function(message, callback) {
//       chrome.tabs.sendMessage(sender.id, {"message": "clicked_browser_action"});
//   });

// chrome.runtime.onMessage.addListener(
//    function(request, sender, sendResponse) {
//       alert("Hello " + sender.id)
//       chrome.runtime.sendMessage(sender.id, {"message": "clicked_browser_action"});
//    }
// );
