import {RouterProvider} from "react-router-dom";
import {globalRouters} from "./router";
import './popup.styl'

function Popup() {
    return <RouterProvider router={globalRouters} />
}

export default Popup;