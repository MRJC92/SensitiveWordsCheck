
import React, { useEffect, useRef, useState } from 'react';
import TaskInfo from '@/content/components/check/taskinfo'
import ResultTable from '@/content/components/check/resultTable'
import { Button } from 'antd';
function Check() {
    // 从localStorage中获取数据， 敏感词设置
    const [words, setWords] = useState([]);
    const [tabItems, setTabItems] = useState([]);


    useEffect(() => {
        const fetchData = async () => {
            // 从chrome.storage.local中获取数据
            chrome.storage.local.get("sensitiveWordList", function(result) {
                if (result.sensitiveWordList) {
                    setWords(result.sensitiveWordList);
                }
                
            });
        }
        fetchData();
    }, []);


    return (
        <div>
            <TaskInfo words={words} setWords={setWords}/>
            <ResultTable words={words}/>
            <Button type="primary" onClick={()=>(console.log(words))}>Start</Button>
        </div>
        
    )
}

export default Check