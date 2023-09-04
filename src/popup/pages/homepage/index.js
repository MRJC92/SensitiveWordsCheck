import React, { useEffect, useRef, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Space, Input, Tag, Tooltip, theme, Button, Table } from 'antd';
import {sendSensitiveWordListMessage} from "@/utils/message";

function HomePage() {
    const { token } = theme.useToken();
    const [sensitiveWordList, setSensitiveWordList] = useState(['示例:binance']);
    const [inputVisible, setInputVisible] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [editInputIndex, setEditInputIndex] = useState(-1);
    const [editInputValue, setEditInputValue] = useState('');
    const inputRef = useRef(null);
    const editInputRef = useRef(null);
    useEffect(() => {
        if (inputVisible) {
            inputRef.current?.focus();
        }
    }, [inputVisible]);
    useEffect(() => {
        editInputRef.current?.focus();
    }, [editInputValue]);

    // 这里修改了敏感词,要同步到service-worker
    const handleClose = (removedTag) => {
        const newTags = sensitiveWordList.filter((tag) => tag !== removedTag);
        setSensitiveWordList(newTags);
        sendSensitiveWordListMessage(newTags)
    };
    const showInput = () => {
        setInputVisible(true);
    };
    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    // 这里新增了敏感词,同理要同步到service-worker
    const handleInputConfirm = () => {
        if (inputValue && sensitiveWordList.indexOf(inputValue) === -1) {
            const newWordList = [...sensitiveWordList, inputValue]
            setSensitiveWordList(newWordList);
            sendSensitiveWordListMessage(newWordList)
        }
        setInputVisible(false);
        setInputValue('');
    };
    const handleEditInputChange = (e) => {
        setEditInputValue(e.target.value);
    };
    const handleEditInputConfirm = () => {
        const newTags = [...sensitiveWordList];
        newTags[editInputIndex] = editInputValue;
        setSensitiveWordList(newTags);
        sendSensitiveWordListMessage(newWordList)
        setEditInputIndex(-1);
        setEditInputValue('');
    };
    const tagInputStyle = {
        width: 64,
        height: 22,
        marginInlineEnd: 8,
        verticalAlign: 'top',
    };
    const tagPlusStyle = {
        height: 22,
        background: token.colorBgContainer,
        borderStyle: 'dashed',
    };

    function showRef() {
        chrome.storage.local.get("key").then(res=>{
            let data = []
            Object.keys(res.key).forEach((pageKey)=>{
                let apiDic = res.key[pageKey]
                Object.values(apiDic).forEach(value => {
                    value.key = pageKey
                    data.push(value)
                })
            })
            setUrlResponseDataList(data)
            // console.log("data:", data)
        })
        chrome.storage.local.get("sensitiveWordList").then(res=>{
            setSensitiveWordList(res.sensitiveWordList===undefined?sensitiveWordList:res.sensitiveWordList)
            console.log("sensitiveWordList:", res.sensitiveWordList)
        })

    }

    function clear() {
        chrome.storage.local.set({'key': {}}).then(res=>{
        })
        setUrlResponseDataList([]);
    }
    async function showBg() {
        let [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });
        console.log("homepage tab id " + tab.id)

        chrome.runtime.sendMessage({"action":"start", "tab": tab}, (response) => {
            console.log("popup send message success")
            console.log("response:" + response)
        });

    }

    const [urlResponseDataList, setUrlResponseDataList] = useState([])

    const  columns = [
        {
            title: 'PAGE',
            dataIndex: 'page',
            key: 'page',
            fixed: 'left',
            width: 100,
            render: (text) => <a>{text.split('/')[text.split('/').length - 1]}</a>,
            ellipsis: true,
        },
        {
            title: 'URL',
            dataIndex: 'url',
            key: 'url',
            render: (text) =>  <a>{text}</a>,
            width: 200,
            ellipsis: true,
        },
        {
            title: 'TYPE',
            dataIndex: 'type',
            key: 'type',
            width: 100,
            render: (text) => <a>{text}</a>,
        },
        {
            title: 'Has Sensitive Word',
            dataIndex: 'hasSensitiveWordList',
            key: 'hasSensitiveWordList',
            width: 100,
            render: (text) => <a>{text===true?'命中':'无'}</a>,
        }
    ];

    sensitiveWordList.forEach((key, index)=> {
        if(index===0){

        }else{
            columns.push({
                title: key.toUpperCase(),
                key: key,
                ellipsis: true,
                width: 200,
                render: (record) => {
                    // console.log("sensitiveWordList.forEach", key, record.result[key], record);
                    return <a>{record.result[key]===null||record.result[key]===undefined?'NO':record.result[key].join(',')}</a>
                },
            })
        }
    })



    return (
        <div>
            <Button onClick={showBg}>开始捕获请求</Button>
            <Button onClick={showRef}>加载检查结果</Button>
            <Button onClick={clear}>清除检查结果</Button>
            <Button onClick={clear}>导出检查结果</Button>
            <div style={{margin:20}}></div>
            <Space size={[0, 8]} wrap>
                <Space size={[0, 8]} wrap>
                    {sensitiveWordList.map((tag, index) => {
                        if (editInputIndex === index) {
                            return (
                                <Input
                                    ref={editInputRef}
                                    key={tag}
                                    size="small"
                                    style={tagInputStyle}
                                    value={editInputValue}
                                    onChange={handleEditInputChange}
                                    onBlur={handleEditInputConfirm}
                                    onPressEnter={handleEditInputConfirm}
                                />
                            );
                        }
                        const isLongTag = tag.length > 20;
                        const tagElem = (
                            <Tag
                                key={tag}
                                closable={index !== 0}
                                style={{
                                    userSelect: 'none',
                                }}
                                onClose={() => handleClose(tag)}
                            >
              <span
                  onDoubleClick={(e) => {
                      if (index !== 0) {
                          setEditInputIndex(index);
                          setEditInputValue(tag);
                          e.preventDefault();
                      }
                  }}
              >
                {isLongTag ? `${tag.slice(0, 20)}...` : tag}
              </span>
                            </Tag>
                        );
                        return isLongTag ? (
                            <Tooltip title={tag} key={tag}>
                                {tagElem}
                            </Tooltip>
                        ) : (
                            tagElem
                        );
                    })}
                    {inputVisible ? (
                        <Input
                            ref={inputRef}
                            type="text"
                            size="small"
                            style={tagInputStyle}
                            value={inputValue}
                            onChange={handleInputChange}
                            onBlur={handleInputConfirm}
                            onPressEnter={handleInputConfirm}
                        />
                    ) : (
                        <Tag style={tagPlusStyle} onClick={showInput}>
                            <PlusOutlined /> 增加敏感词
                        </Tag>
                    )}
                </Space>
            </Space>
            <Table columns={columns}  dataSource={urlResponseDataList} scroll={{  x: 1000 }}/>
        </div>
    )
}
export default HomePage