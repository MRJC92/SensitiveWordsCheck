import {saveAs} from "file-saver";
import 'regenerator-runtime/runtime';
import * as ExcelJs from 'exceljs';

import {Workbook} from "exceljs";

const DEFAULT_COLUMN_WIDTH = 20;

// 根据 antd 的 column 生成 exceljs 的 column
export function generateHeaders(columns: any[]) {
    return columns?.map(col => {
        const obj = {
            // 显示的 name
            header: col.title,
            // 用于数据匹配的 key
            key: col.dataIndex,
            // 列宽
            width: col.width / 5 || DEFAULT_COLUMN_WIDTH,
        };
        return obj;
    })
}

export function saveWorkbook(workbook: Workbook, fileName: string) {
    // 导出文件
    workbook.xlsx.writeBuffer().then((data => {
        const blob = new Blob([data], {type: ''});
        saveAs(blob, fileName);
    }))
}

export function onExportBasicExcel(file_name, columns, urlResponseDataList) {
    console.log(file_name, urlResponseDataList)
    if(urlResponseDataList.length===0){
        alert("the check data is null")
        return
    }
    // 创建工作簿
    const workbook = new ExcelJs.Workbook();
    // 添加sheet
    const worksheet = workbook.addWorksheet('demo sheet');
    // 设置 sheet 的默认行高
    worksheet.properties.defaultRowHeight = 20;
    // 设置列
    worksheet.columns = generateHeaders(columns);
    // 添加行
    worksheet.addRows(urlResponseDataList);
    // 导出excel 'simple-demo.xlsx'
    saveWorkbook(workbook, file_name);
}
