export function sendSensitiveWordListMessage(sensitiveWordList) {
    chrome.runtime.sendMessage({"action": "modifySensitiveWordList", "sensitiveWordList":sensitiveWordList}, (response) => {
        // console.log("service发送response成功")
        // console.log(response)
    });
}

