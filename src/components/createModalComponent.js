import React from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { Form, Icon, Input } from 'antd';
import $ from 'jquery';

import {
    commonTypeSelectonButton,
    commonInitialRenderFunction,
    commonTooltipFormFunction,
    handleFileChange,
    commonFileUploadFunction
} from './common';
import './../index.css';
import './../content.css';

let modalOpen;

class CreateModalComponent extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            title: '',
            description: '',
            web_url: '',
            trailStatus: 'text',
            fileName: '',
            fileLoading: false,
            showPreview: false
        };
	};
    
    componentDidMount() {
        window.scrollTo(0, 0);
    }

    onChangeToInput = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };

    onTitleChangeHandler = (e) => {
        e.preventDefault();
        this.setState({ title: e.target.value });
    };
        
    onDescriptionChangeHandler = (value) => {
        this.setState({ description: value });
    };
    
    onAddStep = () => {
        let obj;
        const { trailStatus, title, web_url, description } = this.state;
        
        if (trailStatus === 'text') {
            this.props.form.validateFields((err, values) => {
                if (err || values.title === '' || (!description || description === '')) {
                    return;
                }
                
                obj = {
                    url: document.URL,
                    type: 'modal',
                    mediaType: 'modal',
                    title: values.title,
                    description
                };                
            });
        } else {
            if (this.state.title === '' && this.state.web_url === '') {
                return;
            }
            
            obj = {
                url: document.URL,
                type: 'modal',
                mediaType: trailStatus,
                title,
                web_url
            };
        }

        this.props.onSave(obj)
        this.toggle();
    };
    
    toggle = () => {
        this.setState({
            title: '',
            description: '',
            web_url: '',
            fileName: '',
            trailStatus: 'text'
        });
        
        this.props.toggle(false);
    };

    onSelectOption = (status) => {
        this.setState({ trailStatus: status });
    };

    uploadFile = (file) => {
        this.setState({ fileLoading: true });

        commonFileUploadFunction(file)
			.then(response => {
				return response;
			})
			.then(res => {
                console.log('res', res);
				return res.data;
			})
			.then(data => {
                console.log('data', data);
				this.setState({ 
                    showPreview: true, 
                    fileLoading: false, 
                    fileName: file.name, 
                    web_url: data.response.result.fileUrl
                });
			})
			.catch(err => {
				this.setState({ fileLoading: false });
				console.log('Error fetching profile ' + err);
			});
    };

    handleChange = (e) => {
        const { trailStatus } = this.state;

        // Call common hadler file change function in common file
        handleFileChange(e, trailStatus, this.uploadFile);
    };

    selectedTooltipForm = () => {
        const { trailStatus, title, fileName, fileLoading } = this.state;

        // Common tooltip form function imported from common file
        return commonTooltipFormFunction(
            trailStatus,
            title,
            fileName,
            fileLoading,
            this.toggle,
            this.onAddStep,
            this.onChangeToInput,
            this.handleChange
        );
    };
    
    onButtonCloseHandler = async (e) => {
        // Call parent component function to close tooltip preview
        await this.props.closeButtonHandler(e);
    };
    
    render () {
        
        modalOpen = this.props.open;
        const { getFieldDecorator } = this.props.form;
        const { title, description, fileName, fileLoading } = this.state;
        let tourType = 'modal';

        let tooltipForm = commonInitialRenderFunction(
            this.state.trailStatus,
            getFieldDecorator, 
            title,
            description, 
            this.onTitleChangeHandler, 
            this.onDescriptionChangeHandler,
            this.toggle,
            this.onAddStep,
            this.selectedTooltipForm
        );
        
        const { trailStatus } = this.state;
        
        if(document.querySelector('#my-extension-root-flip').style.display === "none") {
            modalOpen = false;
        } else if(document.querySelector('#my-extension-root-flip').style.display === "block") {
            modalOpen = true;
        }

        $(document).ready(() => {
            const modalDiv = document.querySelector('.trail_create_modal');
            
            if (modalDiv) {
                if (!modalDiv.parentNode.parentNode.parentNode.getAttribute("class")) {
                    modalDiv.parentNode.parentNode.parentNode.setAttribute('class', 'trial_modal_show trial_create_modal_main');
                }
            } 
        });     
        
        return(
            <React.Fragment>
                <Modal isOpen={modalOpen} toggle={this.onButtonCloseHandler} className="tr_modal trail_create_modal" centered={true}>
                <ModalHeader className="tr_modal_trail_modal_header" toggle={this.toggle}>Create Modal</ModalHeader>
                <ModalBody>
                    { commonTypeSelectonButton(
                        trailStatus, 
                        this.onSelectOption, 
                        tooltipForm, 
                        fileName,
                        fileLoading,
                        tourType
                    ) }
                </ModalBody>
                </Modal>
            </React.Fragment>
        )
    }
}

export default Form.create()(CreateModalComponent);