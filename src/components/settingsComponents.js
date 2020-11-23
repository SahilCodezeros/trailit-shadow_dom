import React from 'react';
import Switch from "react-switch";

const chrome = window.chrome;
class SettingsComponents extends React.PureComponent {
    state = {
        open: false,
        checked: true
    }

    componentDidMount() {
        chrome.storage.local.get(['AutoPlayMediaToggle'], (items) => {
            if(items.AutoPlayMediaToggle!=undefined && items.AutoPlayMediaToggle!=null) {
                this.setState({checked: items.AutoPlayMediaToggle})
            }            
        });
    }

    toggle = () => {
        this.setState({open: !this.state.open});
    }

    onChangeSwitch = (checked) => {
        this.setState({checked});
        chrome.storage.local.set({AutoPlayMediaToggle: checked});
    }

    render() {
        return (<div>
                <a className="trlt_setting_btn" onClick={this.toggle}>Settings</a>
                {this.state.open && <div className="trlt_setting">
                    <span>Auto-play Media Toggle</span>
                    <Switch 
                        onChange={this.onChangeSwitch} 
                        checked={this.state.checked} 
                        onColor="#FF7958"
                        onHandleColor="#FB542B"
                        handleDiameter={30}
                        uncheckedIcon={false}
                        checkedIcon={false}
                        boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                        activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                        height={20}
                        width={48}
                    />
                </div>}
            </div>)
    }

}

export default SettingsComponents;