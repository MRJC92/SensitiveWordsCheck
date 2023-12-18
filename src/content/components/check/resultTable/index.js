import { Tabs } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

const { TabPane } = Tabs;

function ResultTable(props)  {
    const onChange = (key) => {
        console.log(key);
    };
    const [tabList, setTabList] = useState([]);

    useEffect(() => {
        // 组装items
        const items = [];
        props.words.map((word, index) => (items.push({
            key: index.toString(),
            label: `Tab ${index + 1}`,
            content: `Content of ${word}`,
        })));
        alert(items.toString())
        setTabList(items);
        
    }, []);


    return (
        <Tabs
        defaultActiveKey="overview"
        items={tabList}
        onChange={onChange}
        indicatorSize={(origin) => origin - 16}
    />
    )





};
export default ResultTable;

