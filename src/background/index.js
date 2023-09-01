import {apiRequest} from "@/api";
import iconPng from '@/content/images/icon.png'
import {datetime} from "mockjs/src/mock/random/date";
//
// chrome.webNavigation.onBeforeNavigate.addListener((details) => {
//     // console.log(details)
//     if(details.frameType==="outermost_frame"){
//         chrome.notifications.create({
//             type: 'basic',
//             iconUrl: iconPng,
//             title: 'page loaded',
//             message:
//                 'Completed loading: ' +
//                 details.url +
//                 ' at ' +
//                 details.timeStamp +
//                 ' milliseconds since the epoch.'
//         });
//     }
// });


// chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((e) => {
//     // const msg = `Cookies removed in request to ${e.request.url} on tab ${e.request.tabId}.`;
//     // console.log(msg);
//     // console.log(e)
// });

// chrome.action.onClicked.addListener(function (tab) {
//     if (tab.url.startsWith('http')) {
//         chrome.debugger.attach({ tabId: tab.id }, '1.2', function () {
//             chrome.debugger.sendCommand(
//                 { tabId: tab.id },
//                 'Network.enable',
//                 {},
//                 function () {
//                     if (chrome.runtime.lastError) {
//                         console.error(chrome.runtime.lastError);
//                     }
//                 }
//             );
//         });
//     } else {
//         console.log('Debugger can only be attached to HTTP/HTTPS pages.');
//     }
// });

chrome.runtime.onMessage.addListener((request , sender , sendResponse) => {
    console.log("service-worker add listener")
    const { action, tab } = request;
    if(action==="start"){
        // // 由于popup的生命周期问题,这里就通过创建新tab的方式来和service进行数据交互
        // chrome.tabs.create({ index: 0, active: false, url: "https://qcenter.k8s.qa1fdg.net/cloud#/cloud/welcome/document" });
        //
        if (tab.url.startsWith('http')) {
            chrome.debugger.attach({ tabId: tab.id }, '1.2', function () {
                chrome.debugger.sendCommand(
                    { tabId: tab.id },
                    'Network.enable',
                    {},
                    function () {
                        if (chrome.runtime.lastError) {
                            console.error(chrome.runtime.lastError);
                        }
                    }
                );
            });
        } else {
            console.log('Debugger can only be attached to HTTP/HTTPS pages.');
        }
    }
    sendResponse("content got!")
})

// chrome.runtime.onConnect.addListener(function(port) {
//     console.assert(port.name === "knockknock");
//     port.onMessage.addListener(function(msg) {
//         console.log("service:")
//         console.log(msg)
//         if (msg.joke === "Knock knock")
//             port.postMessage({question: "Who's there?"});
//         else if (msg.answer === "Madame")
//             port.postMessage({question: "Madame who?"});
//         else if (msg.answer === "Madame... Bovary")
//             port.postMessage({question: "I don't get it."});
//     });
// });


chrome.debugger.onEvent.addListener(function (source, method, params) {
    if (method === 'Network.responseReceived') {
        // console.log(source);
        // console.log('Response received:', params.response);
        if (params.response.url.startsWith('https://www.upish.com/bapi/')) {
            // console.log('Response received:', params.response);
            // console.log(params.response.toString());
            chrome.debugger.sendCommand(
                { tabId: source.tabId },
                'Network.getResponseBody',
                {"requestId": params.requestId},
                function (response) {
                    if(response===undefined){

                    }else{
                        if(response.hasOwnProperty("code")){
                            console.log("code:" + response.code)
                        }else{
                            console.log("body:" + response.body)
                            chrome.runtime.sendMessage({"url": params.response.url, "reponseBody": response.body}, (response) => {
                                // console.log("service发送response成功")
                                // console.log(response)
                            });

                            // 保存到storage中
                            chrome.storage.local.get(["key"]).then((result) => {
                                let newValue = []
                                if(result.key===undefined || result.key.length===0){

                                }else{
                                    newValue = result.key
                                }
                                newValue.push({"url": params.response.url, "reponseBody": response.body})
                                chrome.storage.local.set({"key": newValue}).then(()=>{})
                            });

                        }
                    }
                }
            );
        }
        // Perform your desired action with the response data
    }
});
