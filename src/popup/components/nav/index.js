import { useNavigate} from "react-router-dom";
import {Button, Tabs} from 'antd';
import './nav.styl';

function Nav(props) {
    const {location} = props
    const navigate = useNavigate()

    const items = [
        {
            key: '/home',
            label: 'Home'
        },
        {
            key: '/account',
            label: 'Account'
        },
    ]

    const onTabChange = (key) => {
        navigate(key)
    }

    const onExit = () => {
        navigate('/login')
    }

    return (
        <div className={"M-nav"}>
            <Tabs
                activeKey={location.pathname}
                items={items}
                onChange={onTabChange}
                centered
            />
            <Button className={"btn-exit"} type={"primary"} onClick={onExit}>
                Exit
            </Button>
        </div>
    )
}

export default Nav
