import {apiRequest} from "@/api";
import iconPng from '@/content/images/icon.png'
import {getNestedValue, setNestedValue} from "@/utils/nestedValueHelper";
import {type} from "@testing-library/user-event/dist/type";
import {bool} from "mockjs/src/mock/random/basic";

let pendingRequests = {};
let sensitiveWordList = [];
let oldSensitiveWordList = [];
let checkTypes = ['xhr', 'fetch', 'stylesheet', 'document', 'script'];
let currentPageUrl = '';
let splitChar = '~.~';
// chrome.runtime.oninstall.addListener(async () => {
//     // 加载敏感词
//     await chrome.storage.local.get("sensitiveWordList").then(res => {
//         oldSensitiveWordList = res.sensitiveWordList === undefined ? sensitiveWordList : res.sensitiveWordList
//         console.log("sensitiveWordList:", res.sensitiveWordList)
//     })
// })
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    console.log("service-worker add listener")
    const {action, tab} = request;
    if (action === "start") {
        if (tab.url.startsWith('http')) {
            currentPageUrl = tab.url;
            chrome.debugger.attach({tabId: tab.id}, '1.2', function () {
                chrome.debugger.sendCommand(
                    {tabId: tab.id},
                    'Network.enable',
                    {},
                    function () {
                        if (chrome.runtime.lastError) {
                            console.log(chrome.runtime.lastError);
                        }
                    }
                );
            });
        } else {
            console.log('Debugger can only be attached to HTTP/HTTPS pages.');
        }
    } else if (action === "modifySensitiveWordList") {
        console.log("modifySensitiveWordList:", request.sensitiveWordList)
        oldSensitiveWordList = sensitiveWordList;
        sensitiveWordList = request.sensitiveWordList;
        let res = await chrome.storage.local.set({"sensitiveWordList": sensitiveWordList})
        console.log("after change:", sensitiveWordList, request.sensitiveWordList)

    }
    sendResponse("content got!")
})

chrome.debugger.onEvent.addListener(async function (source, method, params) {
    if (method === 'Network.responseReceived') {
        // console.log('Network.responseReceived', source, method, params)
        if (checkTypes.includes(params.type.toLowerCase())) {
            pendingRequests[params.requestId] = { status: true, type: params.type, url: params.response.url };
        }
    } else if (
        method === 'Network.loadingFinished' &&
        pendingRequests[params.requestId] !== undefined
    ) {
        // console.log('Network.loadingFinished', source, method, params);
         getResponseBody(
            source.tabId,
            params.requestId,
            pendingRequests[params.requestId]
        );
        delete pendingRequests[params.requestId];
    }
});

function getResponseBody(tabId, requestId, requestInfo) {
     chrome.debugger.sendCommand(
        {tabId: tabId},
        'Network.getResponseBody',
        {requestId: requestId},
        async function (response) {
            // console.log(requestInfo.type + ' response', response.body);
            let tab = await getCurrentTab();
            currentPageUrl = tab.url;
            if (currentPageUrl.startsWith("chrome://extensions")) {
                return
            }
            // 首先检查是否已经检查过当前的response
            let requestUrl = requestInfo.url;
            let newKeyValue = {}
            let checkResult = {};
            // let isExits = undefined;
            // 感觉这个处理有点问题,这里用chrome tabAPI来获取当前tab的url
            let result = await chrome.storage.local.get(["key"]);

            // isExits = getNestedValue(result.key, currentPageUrl + splitChar + requestUrl)
            // // console.log("isExits:", isExits)
            // if (isExits !== undefined && oldSensitiveWordList === sensitiveWordList) {
            //     console.log("requestUrl:", requestUrl, "type:", requestInfo.type, "already has return")
            //     return;
            // } else {
            //     // console.log("result.key:", result.key)
            //     newKeyValue = result.key === undefined ? {} : result.key;
            // }

            newKeyValue = result.key === undefined ? {} : result.key;

            // console.log("newKeyValue start:", newKeyValue)

            // 进行敏感词的校验
            let checkResponse = check(response.body, sensitiveWordList);
            console.log("checkResponse, finalFlag", checkResponse)
            checkResult = {
                "hasSensitiveWordList": checkResponse[1],
                "result": checkResponse[0]
            }
            checkResult["page"] = currentPageUrl;
            checkResult["url"] = requestUrl;
            checkResult["type"] = requestInfo.type;
            // 把结果铺平,这样前端好显示和导出excel, 忽略第一个敏感词
            for (let i = 1; i < sensitiveWordList.length; i++) {
                let key = sensitiveWordList[i];
                console.log("key:", key)
                if (checkResponse[0]['flag'] === false) {
                    console.log("设置checkResult[sensitiveWordList[i]] = ''")
                    checkResult[key] = ''
                } else {
                    console.log("checkResult[sensitiveWordList[i]] = checkResponse[0]['matches']", checkResponse[0], checkResponse[0][key].matches)
                    // 去重一下
                    checkResult[key] = unique(checkResponse[0][key].matches)
                }
            }
            console.log("checkResult:", checkResult)
            // 保存到storage中
            setNestedValue(newKeyValue, currentPageUrl + splitChar + requestUrl, checkResult, splitChar);
            console.log("setNestedValue:", newKeyValue)
            await chrome.storage.local.set({"key": newKeyValue});
        }
    );
}

// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo){
//     if(changeInfo.status==='complete'){
//         console.log("chrome.tabs.onUpdated", changeInfo)
//         currentPageUrl = changeInfo.url;
//     }
// })

/**
 * 正则表达式来匹配敏感词
 * @param content
 * @param wordList
 */
function check (content, wordList) {
    console.log("content: ", content, " wordList: ", wordList)
    const matchResult = {}
    let finalFlag = false
    wordList.forEach((word, index) => {
        if(index===0){
        }else{
            let searchTerm = word ;
            let regex = new RegExp(".{0,5}" + searchTerm + ".{0,5}", "ig");
            let matches = content.match(regex);
            console.log("matches:", matches, "matches===null:", matches === null)
            let flag = false;
            if(matches === null){
                matches = []
            }else{
                if(matches.length===0){
                    finalFlag = false;
                }else{
                    finalFlag = true;
                    flag = true;
                }
            }
            matchResult[word] =  {'matches': matches, 'flag': flag};
        }
    })
    console.log("matchResult[word] =  {'matches': matches, 'flag': flag};", matchResult)
    return [matchResult, finalFlag];
}

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

function unique (arr) {
    return Array.from(new Set(arr))
}