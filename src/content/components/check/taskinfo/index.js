import React, { useEffect, useRef, useState } from 'react';
import {Button, Badge, Descriptions, Switch} from 'antd'
import WordConfig from "@/content/components/check/wordconfig";

function TaskInfo() {
    const [words, setWords] = useState([]);
    const [isDataLoaded, setIsDataLoadedFlag] = useState(false)
    useEffect(() => {
        const fetchData = async () => {
            // 从chrome.storage.local中获取数据
            chrome.storage.local.get("sensitiveWordList", function(result) {
                if (result.sensitiveWordList) {
                    setWords(result.sensitiveWordList);
                }
                setIsDataLoadedFlag(true);
            });
        }
        fetchData();
    }, []);

    const handleTagsChange = (newTags) => {
        setWords(newTags);
    };

    const items = [
        {
          key: 'words',
          label: 'Sensitive Word Config',
          children: isDataLoaded ? <WordConfig words={words} onTagsChange={handleTagsChange}/> : null,
        },
        {
          key: 'auto',
          label: 'Auto Scan',
          children: <Switch checkedChildren="Auto" unCheckedChildren="Manual" defaultChecked />,
        },
        {
          key: 'path',
          label: 'Scan Path',
          children: <p>Hangzhou, Zhejiang</p>,
        },
        {
          key: 'status',
          label: 'Task Status',
          children: <Badge status="processing" text="Running" />,
        },
        {
          key: 'process',
          label: 'Process',
          children: <p>No. 18, Wantang Road, Xihu District, Hangzhou, Zhejiang, China</p>,
        },
      ];



    return (
        <div>
            <Descriptions title="Task Info" bordered items={items} extra={<Button type="primary">Start</Button>}/>
        </div>

    );
}

export default TaskInfo