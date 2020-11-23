import React from 'react';
import { Popover, PopoverBody } from 'reactstrap';
import { Form, Icon, Input, Button } from 'antd';

import { handleFileUpload } from '../common/audAndVidCommon';

import {
    commonTypeSelectonButton, 
    commonInitialRenderFunction, 
    commonTooltipFormFunction,
    handleFileChange,
    commonFileUploadFunction
} from './common';

// import { commonTypeSelectonButton } from './common';
import $ from 'jquery';
import '../index.css';
import '../content.css';

const { TextArea } = Input;

const chrome = window.chrome;

const options = [
    { value: 'text', label: 'Text' },
    { value: 'audio', label: 'Audio' },
    { value: 'video', label: 'Video' },
    { value: 'image', label: 'Image' },
];

class Tooltip extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            visible: true,
            selectedForm: 'text',
            fileLoading: false,
            fileAddStatus: false,
            title: '',
            description: '',
            web_url: '',
            tourType: '',
            selectedOption: { value: 'text', label: 'Text' },
            trailStatus: 'text',
            showPreview: false,
            fileName: ''
        }
    }
    
    onSelectOption = trailStatus => {
        this.setState({ trailStatus });
    };
    
    componentDidMount() {
        this.props.form.resetFields();
        // document.querySelector('.textarea-desc').setAttribute('contenteditable', 'true');
        // document.querySelector('.input-title').setAttribute('contenteditable', 'true');
        
        let bounding = document.querySelector(this.props.uniqueTarget).getBoundingClientRect();
        let targetElement = "html, body";
        const y = document.querySelector(this.props.uniqueTarget).getBoundingClientRect().top + document.querySelector(targetElement).scrollTop + bounding.height - 300;
        $(targetElement).stop().animate({
            scrollTop: y
        }, 1000);
    }
    
    componentWillUnmount() {
        this.props.form.resetFields();
    }
    
    /**
     * on click to save tooltip
    */
    onClickToSubmit = e => {
        e.preventDefault();
        
        let obj = {};
        const { onCancel, onSave, rowData, target, count } = this.props;
        const { description } = this.state;
        
        if (this.state.trailStatus === 'text') {
            this.props.form.validateFields((err, values) => {
                if (err || values.title === '' || (!description || description === '')) {
                    if(this.props.type === 'Make Edit') {
                        obj = {
                            ...rowData,
                            url: document.URL,
                            unique_target_one:this.props.uniqueTarget,
                            // class: this.props.path[0].className,
                            type: 'tooltip',
                            responsive: 'mobile',
                            mobile_media_type: this.state.trailStatus,
                            mobile_title: this.state.title,
                            mobile_description: this.state.description,
                            web_url: this.state.web_url
                        };
                    }
                    return;
                }
                
                let paths = "";
                // this.props.path.map(res => {
                //     return ({localName: res.localName, className: res.className, nodeType: res.nodeType, elementTrgetedIndex: this.props.elementIndex})
                // });
                
                let selector = '';
                // paths.forEach(r => {
                //     // if(pathCount == 0) {
                //         if(r.className) {
                //             let split = r.className.split(' ').filter(r => (r!=='trail_web_user' && r!=='trail_tour_tooltip')).join('.');
                //             if(split) {
                //                 selector = `.${split}${selector !== ""?`>${selector}`:''}`;
                //             } else {
                //                 selector = `${r.localName}${selector !== ""?`>${selector}`:''}`;
                //             }
                //         } else {
                //             if(r.localName) {
                //                 selector = `${r.localName}${selector !== ""?`>${selector}`:''}`;
                //             }
                //         }
                //     // }
                // });
                
                // if(this.props.elementIndex>1) {
                //     selector += `:nth-of-type(${this.props.elementIndex})`;
                // }
                                
                if(this.props.type === 'Make Edit') {
                    obj = {
                        ...rowData,
                        url: document.URL,
                        unique_target_one:this.props.uniqueTarget,
                        // class: this.props.path[0].className,
                        type: 'tooltip',
                        responsive: 'mobile',
                        mobile_media_type: this.state.trailStatus,
                        mobile_title: this.state.title,
                        mobile_description: this.state.description,
                        web_url: this.state.web_url
                    };  
                } else {
                    obj = {
                        url: document.URL,
                        uniqueTarget:this.props.uniqueTarget,
                        // class: this.props.path[0].className,
                        type: 'tooltip',
                        mediaType: this.state.trailStatus,
                        title: this.state.title,
                        description: this.state.description,
                        web_url: this.state.web_url
                    };
                }
            });

        } else {
            if (this.state.title === '' && this.state.web_url === '') {
                return;
            }
            
            let paths = "";
            // this.props.path.map(res => {
            //     return ({localName: res.localName, className: res.className, nodeType: res.nodeType, elementTrgetedIndex: this.props.elementIndex})
            // });
            
            let selector = '';
            // paths.forEach(r => {
            //     // if(pathCount == 0) {
            //         if(r.className) {
            //             let split = r.className.split(' ').filter(r => (r!=='trail_web_user' && r!=='trail_tour_tooltip')).join('.');
            //             if(split) {
            //                 selector = `.${split}${selector !== ""?`>${selector}`:''}`;
            //             } else {
            //                 selector = `${r.localName}${selector !== ""?`>${selector}`:''}`;
            //             }
            //         } else {
            //             if(r.localName) {
            //                 selector = `${r.localName}${selector !== ""?`>${selector}`:''}`;
            //             }
            //         }
            //     // }
            // });
            
            // if(this.props.elementIndex>1) {
            //     selector += `:nth-of-type(${this.props.elementIndex})`;
            // }
            
            if(this.props.type === 'Make Edit') {
                obj = {
                    ...rowData,
                    type: 'tooltip',
                    mediaType: this.state.trailStatus,
                    unique_target_one:this.props.uniqueTarget,
                    responsive: 'mobile',
                    mobile_media_type: this.state.trailStatus,
                    mobile_title: this.state.title,
                    mobile_description: this.state.description,
                    web_url: this.state.web_url
                };
            } else {
                obj = {
                    ...rowData,
                    type: 'tooltip',
                    mediaType: this.state.trailStatus,
                    uniqueTarget:this.props.uniqueTarget,
                    // class: this.props.path[0].className,
                    url: document.URL,
                    title: this.state.title,
                    web_url: this.state.web_url
                };
            }
        }
        
        // Save trail data
        onSave(obj);

        // Remove tooltip selected area from window or browser tab
        onCancel(target, count);
        
        // Remove tooltip
        this.setState({
            visible: false
        });
    }

    // // Text/Audio/Video/image tab handler
    // onClickHandler = (e, tab) => {
    //     e.preventDefault();
    //     // Change form
    //     this.setState({ selectedForm: tab });
    // };

    /**
     * on click visible popover
    */
    onClickToVisiblePopover = e => {
        const { onCancel, target, count } = this.props;

        this.setState({
            visible: false
        });

        document.designMode = 'off';
        onCancel(target, count);
    };
    
    // Input change handler
    onChangeToInput = (e) => {
        e.preventDefault();
        
        this.setState({ [e.target.name]: e.target.value });
    };
    
    uploadFile = (file) => {
        this.setState({ fileLoading: true });
        
        commonFileUploadFunction(file)
			.then(response => {
				return response;
			})
			.then(res => {
				return res.data;
			})
			.then(data => {
				this.setState({ 
                    showPreview: true, 
                    fileLoading: false, 
                    fileName: file.name, 
                    web_url: data.response.result.fileUrl, 
                    fileAddStatus: true 
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
    
    // onSaveTrail = (e, data) => {
    //     // saveTrail(this.state.tourType, this.state.title, this.state.web_url, data, (trailData) => {
    //     //     console.log('from line: 154', trailData);
	// 	// 	this.setState({ web_url: '', fileAddStatus: false });
	// 	// 	chrome.storage.local.set({ trail_web_user_tour: trailData, tourType: '' });
    //  // });
    //     this.onClickToSubmit(e);
    // };
    
    selectedTooltipForm = () => {
        const { trailStatus, title, fileName, fileLoading } = this.state;
    
        // Common tooltip form function imported from common file
        return commonTooltipFormFunction(
            trailStatus,
            title,
            fileName,
            fileLoading,
            this.onClickToVisiblePopover,
            this.onClickToSubmit,
            this.onChangeToInput,
            this.handleChange
        );
    };
    
    onTitleChangeHandler = (e) => {
        e.preventDefault();

        this.setState({ title: e.target.value });
    };
    
    onDescriptionChangeHandler = (value) => {
        this.setState({ description: value });
    };
    
    render() {
        const { getFieldDecorator } = this.props.form;
        const { title, description, fileName, fileLoading } = this.state;
        let tourType = 'tooltip';
        
        let tooltipForm = commonInitialRenderFunction(
            this.state.trailStatus,
            getFieldDecorator, 
            title,
            description,
            this.onTitleChangeHandler, 
            this.onDescriptionChangeHandler,
            this.onClickToVisiblePopover,
            this.onClickToSubmit,
            this.selectedTooltipForm
        );
        
        const { trailStatus } = this.state;
        
        return(
            <React.Fragment>
                <Popover className="trail_tooltip" placement="top" isOpen={this.state.visible} target={'.trail_tour_tooltip'}>
                    <PopoverBody>
                        { commonTypeSelectonButton(
                            trailStatus, 
                            this.onSelectOption, 
                            tooltipForm, 
                            fileName,
                            fileLoading,
                            tourType
                        ) }
                    </PopoverBody>
                </Popover>
            </React.Fragment>
        )
    }
}

export default Form.create()(Tooltip);
