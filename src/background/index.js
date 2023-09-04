import {apiRequest} from "@/api";
import iconPng from '@/content/images/icon.png'
import {getNestedValue, setNestedValue} from "@/utils/nestedValueHelper";
import {type} from "@testing-library/user-event/dist/type";
import {bool} from "mockjs/src/mock/random/basic";

let pendingRequests = {};
let sensitiveWordList = [];
let oldSensitiveWordList = [];
let checkTypes = ['xhr', 'fetch', 'stylesheet', 'document', 'script'];
let currentPageUrl = 'https://www.upish.com/en/trade/btc_usdt';
let splitChar = '~.~';
chrome.runtime.onMessage.addListener((request , sender , sendResponse) => {
    console.log("service-worker add listener")
    const { action, tab } = request;
    if(action==="start"){
        if (tab.url.startsWith('http')) {
            currentPageUrl = tab.url;
            chrome.debugger.attach({ tabId: tab.id }, '1.2', function () {
                chrome.debugger.sendCommand(
                    { tabId: tab.id },
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
    }else if(action === "modifySensitiveWordList") {
        oldSensitiveWordList = sensitiveWordList;
        sensitiveWordList = request.sensitiveWordList;
        chrome.storage.local.set({"sensitiveWordList": sensitiveWordList}).then(res=>console.log("set sensitiveWordList :" , res))
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
        { tabId: tabId },
        'Network.getResponseBody',
        { requestId: requestId },
        function (response) {
            // console.log(requestInfo.type + ' response', response.body);

            // 首先检查是否已经检查过当前的response
            let requestUrl = requestInfo.url;
            let newKeyValue = {}
            let checkResult = {};
            let isExits = false;
            // 感觉这个处理有点问题,这里用chrome tabAPI来获取当前tab的url
            chrome.storage.local.get(["key"]).then(result => {
                isExits = getNestedValue(result.key, currentPageUrl+splitChar+requestUrl)
                console.log("isExits:", isExits)
                if(isExits && oldSensitiveWordList === sensitiveWordList){
                    console.log("requestUrl:", requestUrl, "type:", requestInfo.type, "already has return")
                    return;
                }else{
                    console.log("result.key:", result.key)
                    newKeyValue = result.key == undefined ? newKeyValue: result.key;
                }
            })
            console.log("newKeyValue start:", newKeyValue)
            if(isExits){
                return;
            }

            // 进行敏感词的校验
            let checkResponse = check(response.body, sensitiveWordList);
            if (checkResponse === undefined) {
                //  标记处理过了,并且没有敏感词
                checkResult = {
                    "hasSensitiveWordList": false,
                    "result": {}
                }
            } else {
                checkResult = {
                    "hasSensitiveWordList": true,
                    "result": checkResponse
                }
            }
            checkResult["page"] = currentPageUrl;
            checkResult["url"] = requestUrl;
            checkResult["type"] = requestInfo.type;
            // 保存到storage中
            setNestedValue(newKeyValue, currentPageUrl+splitChar+requestUrl, checkResult, splitChar);
            console.log("setNestedValue:", newKeyValue)
            chrome.storage.local.set({"key": newKeyValue}).then(() => {
                console.log(newKeyValue, "设置成功")
            })
        }
    );
}

/**
 * 正则表达式来匹配敏感词
 * @param content
 * @param wordList
 */
function check (content, wordList) {
    console.log(content)
    const matchResult = {}
    wordList.forEach((word, index) => {
        console.log("word:" , word)
        let searchTerm = word ;
        let regex = new RegExp(".{0,5}" + searchTerm + ".{0,5}", "g");
        let matches = content.match(regex);
        matchResult[word] =  matches;
    })
    return matchResult;
}

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}