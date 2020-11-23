import React from 'react';
import { Form, Input, Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import $ from 'jquery';
import { getUserSingleTrail } from '../common/axios';
import CreateNewTrailTab from './CreateNewTrailTab';

const chrome = window.chrome;

class CreateNewTrailModal extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            trailStatus: true,
            trail_id: null,
            userTrailList: []
        }
	}
    
    toggle = () => {
        this.props.toggle(false);
    };
    
    onClickToRunTrail = (e) => {
        e.preventDefault();
        // ...query for the active tab...		
        chrome.runtime.sendMessage('', {
            type: 'DOMInfo',
            status: true
        });
        
        this.setState(prevState => {
			return {
				reload: !prevState.reload
			};
        });
        
        chrome.storage.local.set({
            trail_id: this.state.trail_id,
            trail_web_user_tour: undefined
        }, (items) => console.log("trail_web_user_tourtrail_web_user_tour", items));

        let auth_Tokan, reload, userData
        chrome.storage.local.get(["auth_Tokan", "userData", "reload", "openButton"], function(items) {
            // auth_Tokan = items.auth_Tokan, reload = items.reload, userData = items.userData;
            // chrome.storage.local.clear();
            
            if(items.openButton === undefined) {
				chrome.storage.local.set({ openButton: 'ManageTrail'});
			}
        }.bind(this));
        
        this.toggle();
    }
    
    onClickToTab = (trailStatus) => {
        if(!trailStatus) {
            chrome.storage.local.get(["trail_web_user_tour", "userData"], async function (items) {
                const result = await getUserSingleTrail(items.userData._id);
                if(result.status == 200) {
                    this.setState({userTrailList: result.data.response});
                }
            }.bind(this));
        }

        this.setState({trailStatus});
    }
    
    onClickToTrailId = (data) => {
        this.setState({trail_id: data.trail_id});
    }
    
    render() {
        const { open, followerList } = this.props;

        const { trailStatus, trail_id, userTrailList } = this.state;
		$(document).ready(() => {
			const modalDiv = document.querySelector('.tr_modal');
            
			if (modalDiv) {
                if (!modalDiv.parentNode.parentNode.parentNode.getAttribute("class")) {
                    modalDiv.parentNode.parentNode.parentNode.setAttribute('class', 'trial_modal_show trial_create_modal_main');
                }
            }
        });
        
        return(
            <React.Fragment>
                <Modal isOpen={open} toggle={this.toggle} className="tr_modal" centered={true}>
                    <ModalHeader className="tr_modal_trail_modal_header tr_padding_0" toggle={this.toggle}>User Trails Lists</ModalHeader>
                        <ModalBody>
                            <div className="tr_new_trail_create_modal">
                                <Button className="tr_tab " onClick={(e) => this.onClickToTab(false)}>All Trails</Button>
                                <Button className="tr_tab tr_active" onClick={(e) => this.onClickToTab(true)}>Create Trails</Button>
                            </div>
                            {!trailStatus && <ul className="tr_notification_bx tr_list">
                                {userTrailList && userTrailList.length <= 0 && <li class="tr_notFound_subscription">No data found</li>}
                                {userTrailList.map(res =>
                                        (<li onClick={(e) => this.onClickToTrailId(res)}><a href="javascript:void(0);">
                                            <h4>{res.trail_name}</h4>
                                    </a></li>)
                                )}
                            </ul>}
                            {trailStatus && <CreateNewTrailTab onChange={this.onClickToTab}/>}
                            <div className="trailButtonsWrapper">
                                <Button className="ant-btn ant-btn-primary" disabled={trail_id==null} onClick={this.onClickToRunTrail}>Run Trail</Button>
                            </div>
                        </ModalBody>
                </Modal>
            </React.Fragment>
        )
    }
}

export default CreateNewTrailModal;

