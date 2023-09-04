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
            console.log(res.key)
            // 这里是一个字典,处理之后
            setUrlResponseDataListRaw(res.key)
            const temp = []
            Object.keys(res.key).forEach(key=>{
                temp.push({'page': key, 'key': key})
            })
            setUrlResponseDataList(temp)
        })

    }

    function clear() {
        chrome.storage.local.set({'key': {}}).then(res=>{
        })
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

    const [urlResponseDataListRaw, setUrlResponseDataListRaw] = useState([])
    const [urlResponseDataList, setUrlResponseDataList] = useState([])

    const  columns = [
        {
            title: 'PAGE',
            dataIndex: 'page',
            key: 'page',
            render: (text) => <a>{text.split('/')[text.split('/').length - 1]}</a>,
        },
        {
            title: 'JS',
            dataIndex: 'js',
            key: 'js',
            render: (text) =>  <a>true</a>,
        },
        {
            title: 'CSS',
            dataIndex: 'css',
            key: 'css',
            render: (text) => <a>true</a>,
        },
        {
            title: 'HTML',
            dataIndex: 'html',
            key: 'html',
            render: (text) => <a>true</a>,
        },
        {
            title: 'API',
            dataIndex: 'api',
            key: 'api',
            render: (text) => <a>true</a>,
        },
    ];
    const expandedRowRender = () => {
        const columns = [
            {
                title: 'PAGE',
                dataIndex: 'page',
                key: 'page',
                render: (text) => <a>{text.split('/')[text.split('/').length - 1]}</a>,
            },
            {
                title: 'URL',
                dataIndex: 'url',
                key: 'url',
                render: (text) => <a>{text.split('/')[text.split('/').length - 1]}</a>,
            }
        ];
        sensitiveWordList.forEach(key=>{
            columns.push({
                title: key,
                dataIndex: key,
                key: key,
                render: (text) => <a>true</a>,
            })
        })
        const data = [];
        Object.keys(urlResponseDataListRaw).forEach((pageKey)=>{
            console.log("urlResponseDataListRaw keys", pageKey)
            let apiDic = urlResponseDataListRaw[pageKey]
            console.log("apiDic", apiDic)
            Object.values(apiDic).forEach(value => {
                value.key = pageKey
                data.push(value)
            })
        })
        console.log("data", data)
        return <Table columns={columns} dataSource={data} pagination={false} />;
    }

    return (
        <div>
            <Button onClick={showBg}>开始捕获请求</Button>
            <Button onClick={showRef}>加载检查结果</Button>
            <Button onClick={clear}>清除检查结果</Button>
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
            <Table columns={columns} expandable={{ expandedRowRender, defaultExpandedRowKeys: ['0'] }} dataSource={urlResponseDataList}/>
        </div>
    )
}
export default HomePage