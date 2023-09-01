import { createHashRouter, Navigate } from 'react-router-dom'
import HomePage from "@/popup/pages/homepage";

// 全局路由
export const globalRouters = createHashRouter([
    {
        path: '/',
        element: <HomePage />,
    },
])