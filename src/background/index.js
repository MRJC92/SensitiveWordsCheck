// /*global chrome*/
// chrome.runtime.onInstalled.addListener(function() {
//     chrome.action.disable();
//     chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
//         let rule = {
//             condition: [
//                 new chrome.declarativeContent.PageStateMatcher({
//                     pageUrl: {
//                         hostEquals: 'antd-design.antgroup.com',
//                     }
//                 })
//             ],
//             actions: [
//                 new chrome.declarativeContent.ShowAction()
//             ]
//         }
//         const rules = [rule]
//         chrome.declarativeContent.onPageChanged.addRules(rules)
//     })
// })