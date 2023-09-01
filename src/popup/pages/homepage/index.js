import {Button, Table} from "antd";
import {ColumnsType} from "antd/es/table";
import {useState} from "react";

function HomePage() {
    chrome.runtime.onMessage.addListener((request , sender , sendResponse) => {
        const tempDataList = [...urlResponseDataList];
        tempDataList.push(request)
        setUrlResponseDataList(tempDataList)
        console.log("tempDataList" )
        console.log(tempDataList)
        sendResponse("popup got!")
    })
    function showRef() {
        chrome.storage.local.get("key").then(res=>{
            console.log(res.key)
            setUrlResponseDataList(res.key)
        })

    }
    async function showBg() {
        let [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });
        console.log("homepage tab id " + tab.id)
        // chrome.tabs.sendMessage(tab.id, {
        //     action: 'click',
        //     payload: 'i come form popop'
        // })
        chrome.runtime.sendMessage({"action":"start", "tab": tab}, (response) => {
            console.log("popup send message success")
            console.log("response:" + response)
        });
        // var port = chrome.runtime.connect({name: "knockknock"});
        // port.postMessage({joke: "Knock knock"});
        // port.onMessage.addListener(function(msg) {
        //     console.log("popup:" + msg)
        //     if (msg.question === "Who's there?")
        //         port.postMessage({answer: "Madame"});
        //     else if (msg.question === "Madame who?")
        //         port.postMessage({answer: "Madame... Bovary"});
        // });
    }

    const [urlResponseDataList, setUrlResponseDataList] = useState([])

    const  columns = [
        {
            title: 'URL',
            dataIndex: 'url',
            key: 'url',
            render: (text) => <a>{text}</a>,
        },
        {
            title: 'BODY',
            dataIndex: 'reponseBody',
            key: 'reponseBody',
            render: (text) => <a>{text}</a>,
        }
    ];
    return (
        <div>
            <Button onClick={showBg}>homepage</Button>
            <Button onClick={showRef}>刷新</Button>
            <Table columns={columns} dataSource={urlResponseDataList}/>

        </div>
    )
}
export default HomePage