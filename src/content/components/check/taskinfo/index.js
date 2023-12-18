import React, { useEffect, useRef, useState } from 'react';
import {Button, Badge, Descriptions, Switch, Input, Progress} from 'antd'
import WordConfig from "@/content/components/check/wordconfig";
import {getSensitiveWords, setLocalStorage} from "@/utils/localStorage";

function TaskInfo(props) {
    const [auto, setAuto] = useState(false)
    // 运行状态 default:未运行 processing:运行中 success:完成
    const [runStatus, setRunStatus] = useState("default")
    const [path, setPath] = useState("")
    const [process, setProcess] = useState(0)

    const handleTagsChange = async (newTags) => {
        props.setWords(newTags);
        // 同时也要往chrome.storage.local中存储数据
        await setLocalStorage("sensitiveWordList", newTags);
    };

    async function getSensitiveWordList() {
        // 从chrome.storage.local中获取数据
        const result = await getSensitiveWords();
        if (result.sensitiveWordList) {
            props.setWords(result.sensitiveWordList);
            alert("getSensitiveWordList" + result.sensitiveWordList.toString())
        }    
    }

    const items = [
        {
          key: 'words',
          label: 'Sensitive Word Config',
          children: <WordConfig words={props.words} onTagsChange={handleTagsChange} refresh={getSensitiveWordList}/>,
        },
        {
          key: 'auto',
          label: 'Auto Scan',
          children: <Switch checkedChildren="Auto" unCheckedChildren="Manual" defaultChecked onChange={(check)=>setAuto(check)} />,
        },
        {
          key: 'path',
          label: 'Scan Path',
          children: <Input value={path} onChange={(e)=>setPath(e.value)} placeholder='please enter scan path'/>,
        },
        {
          key: 'status',
          label: 'Task Status',
          children: <Badge status={runStatus} text={runStatus} />,
        },
        {
          key: 'process',
          label: 'Process',
          children: <Progress percent={process} />,
        },
      ];

    function handleStart() {
        // 清空之前运行的结果
        setLocalStorage("key", {})
        setRunStatus("processing")
    }

    //这个函数接收service-worker发送过来的消息，将结果处理到状态变量给table显示
    function handleGetResultRealTime() {
        
    }
 

    return (
        <div>
            <Descriptions size={"small"} title="Task Info" bordered items={items} 
                extra={
                    runStatus==="default"?
                    <Button type="primary" onClick={handleStart}>Start</Button>
                    :
                    <>
                        <Button type="primary" danger onClick={()=>setRunStatus("default")}>Stop</Button>
                        <Button type="primary" danger onClick={()=>setRunStatus("default")}>Export Result</Button>
                    </>
                }
            />

        </div>

    );
}

export default TaskInfo