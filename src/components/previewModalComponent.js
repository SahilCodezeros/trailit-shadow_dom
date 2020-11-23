import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { Form, Icon, Input, Button } from 'antd';
import $ from 'jquery';

import AudioTour from './audioTour';
import { stopMediaPlaying } from '../common/stopePlayingMedia';
import { addTrailitLogo, removeTrailitLogo } from '../common/trailitLogoInPreview';

const chrome = window.chrome;
class PreviewModalComponent extends React.PureComponent {
    constructor(props) {
        super(props)            
        this.state = {
            title: '',
            description: '',
            open: true,
            autoPlay: false
        }
    }
    
    async componentDidMount() {
        console.log('componentDidMount');
        if (this.props.data[this.props.tourStep - 1].url !== document.URL) {
            window.location.href = this.props.data[this.props.tourStep - 1].url;
        }

        // setTimeout(() => {
        //     document.querySelectorAll('video').forEach(res => {
        //         console.log('res', res);
        //         if(res.className !== "preview-video") {
        //             res.pause()    
        //         }
        //     })
        // }, 1000);

        // chrome.storage.local.get(['AutoPlayMediaToggle'], (items) => {
        //     console.log('items', items);
        //     if(items && (!items.AutoPlayMediaToggle || items.AutoPlayMediaToggle)) {
        //         autoplay = items.AutoPlayMediaToggle;
        //         this.setState({ autoPlay: items.AutoPlayMediaToggle });
        //     }

        // });

        // Add modal class to dom
        this.addModalClass();

        if (document.readyState === 'loading') {
            console.log('state loading');            
        } else if (document.readyState === 'complete') {
            console.log('state complete');
        }

        if (document.readyState === 'complete') {            
            console.log('doc is ready');
            $(document).ready(() => {
                // Call toggle website media
                this.toggleWebSitesMedia();
            });

        } else if (document.readyState === 'interactive' && 
            (
                document.URL.includes('https://www.youtube.com/')                
            ) 
        ) {            
            console.log('doc is loading');
            // document.body.onload = function () { https://www.dailymotion.com/
            //     console.log('body is loaded!!!!');
            //     // Call toggle website media
            //     this.toggleWebSitesMedia();
            // };
            $(document).ready(() => {
                // Call toggle website media
                this.toggleWebSitesMedia();
            });

        } else if (document.URL.includes('https://twitter.com/')) {
            $(document).ready(() => {
                // Call toggle website media
                this.toggleWebSitesMedia();
            });
        } else {
            $(window).on('load', () => {
                console.log('in body onload');
                // Call toggle website media
                this.toggleWebSitesMedia();
            });

            // document.body.onload = async function () {
            //     console.log('in body onload');
            //     // Call toggle website media
            //     await this.toggleWebSitesMedia();
            // };
        }

        // Add trailit logo
        addTrailitLogo();
    };

    componentDidUpdate(prevProps, prevState) {
        console.log('componentDidUpdate');
        // chrome.storage.local.get(['AutoPlayMediaToggle'], (items) => {
        //     if(prevState.autoPlay !== items.AutoPlayMediaToggle) {
        //         this.setState({ autoPlay: items.AutoPlayMediaToggle });
        //     }
        // });

        // Add modal class to dom
        this.addModalClass();

        // Call toggle website media
        this.toggleWebSitesMedia();
    };
    
    /**
     * Manage popover web user tour button
     * @data tooltip data
     * @step tooltip current step
    */
    onClickToManagePopoverButton = async (event, data, step, tourSide) => {
        let { tourStep } = this.props;

        await this.toggle();

        // console.log("this.props.data[step - 1]ccccc", this.props.data[step - 1])
        if(this.props.data[step - 1].url === document.URL) {
            let type = this.props.data[step - 1].type;
            this.props.tour(step, type, tourSide)
        } else {
            // Set loading true to show overlay
            this.props.setLoadingState(true);
            
            let type = this.props.data[step - 1].type;
            this.props.tour(step, type, tourSide)
            window.location.href = this.props.data[step - 1].url;
        }
        // if(document.querySelector('#my-extension-root-flip').classList.value ==="") {
        //     document.querySelector('#my-extension-root-flip').classList.remove('trail_flip_box');
        // }
        this.setState({ open: true });        
    }
    
    onClickToDoneTour = (data, step) => {
        let { tourSteps } = this.props;
        this.setState({open: false})
        if(document.querySelector('#my-extension-root-flip').classList.value ==="") {
            document.querySelector('#my-extension-root-flip').classList.remove('trail_flip_box');
        }
        chrome.storage.local.set({closeContinue: false});
        this.props.toggle({ removePreviewTrails: true });
    }
    
    onButtonCloseHandler = async (e) => {
        // Call parent component function to close tooltip preview
        if(document.querySelector('#my-extension-root-flip').classList.value ==="") {
            document.querySelector('#my-extension-root-flip').classList.remove('trail_flip_box');
        }
        await this.props.closeButtonHandler(e);
    };

    toggle = () => {
        if(document.querySelector('#my-extension-root-flip').classList.value ==="") {
            document.querySelector('#my-extension-root-flip').classList.remove('trail_flip_box');
        }
        this.setState({ open: false });
    };

    addModalClass = () => {
        console.log('in addModalClass');
        $(document).ready(() => {
            const modalDiv = document.querySelector('.trail_preview_modal');
                
            if (modalDiv) {
                if (!modalDiv.parentNode.parentNode.parentNode.getAttribute("class")) {
                    modalDiv.parentNode.parentNode.parentNode.setAttribute('class', 'trial_modal_show trail_preview_modal_main');
                }
            }
        });        
    };

    toggleWebSitesMedia = () => {
        const { tourStep, data } = this.props;
        console.log('mediaType', data[tourStep - 1].mediaType && data[tourStep - 1].mediaType);
        if (data[tourStep - 1].mediaType && data[tourStep - 1].mediaType === 'video') {

            // Stop playing websites audio or video
            stopMediaPlaying();
        }
    };

    componentWillUnmount() {
        // Remove trailit log
        removeTrailitLogo();
    }
    
    render () {
        const { open } = this.state;
        const { tourStep, tourSide, play} = this.props;
        const { title, description } = this.props.data[tourStep - 1];
        let preview = null;

        if (this.props.data[tourStep - 1].mediaType && this.props.data[tourStep - 1].mediaType === 'video') {            
            preview = (
                <div className="tr_preview_video_bx">
                    <video className="preview-video" disablePictureInPicture controlsList="nodownload" controls allow="autoplay" autoPlay={ this.state.autoPlay }>
                        <source src={this.props.data[tourStep - 1].web_url} />
                    </video>
                </div> 
            );
        } else if (this.props.data[tourStep - 1].mediaType && this.props.data[tourStep - 1].mediaType === 'audio') {                
            preview = <AudioTour data={this.props.data} toggle={this.props.toggle} tourStep={this.props.tourStep} tour={this.props.tour} previewInTooltip />
        } else if (this.props.data[tourStep - 1].mediaType && this.props.data[tourStep - 1].mediaType === 'image') {
            preview = (
                <div className="tr_preview_picture_bx">
                    <img className="preview-picture" src={this.props.data[tourStep - 1].web_url} alt="preview-img" />
                </div>   
            );
        }

        return(
            <React.Fragment>
                <Modal isOpen={open} toggle={this.onButtonCloseHandler} className={`tr_modal trail_preview_modal trail_tooltip_done ${this.props.data[tourStep - 1].mediaType && this.props.data[tourStep - 1].mediaType === 'text'?'trail_text_only':'' || this.props.data[tourStep - 1].mediaType && this.props.data[tourStep - 1].mediaType === 'video'?'tr_video_only':'' || this.props.data[tourStep - 1].mediaType && this.props.data[tourStep - 1].mediaType === 'image'?'tr_picture_only':''  || this.props.data[tourStep - 1].mediaType && this.props.data[tourStep - 1].mediaType === 'audio'?'tr_audio_only':''}`} centered={true}>
                    <img 
                        alt=".."
                        className="trailit_IconRightBottom" 
                        src={require(`../images/trailit_icon1.png`)}  
                        onClick={ (e) => {
                            
                            // Call send tip open modal function
                            this.props.onSendTipModalOpen();
                        } }
                    />
                    {/* <ModalHeader toggle={this.toggle}>Create Modal</ModalHeader> */}
                    <ModalBody>

                        {/* <div className="m-0">
                            <div className="trailButtonsWrapper">
                                <Button className="ant-btn ant-btn-primary" onClick={this.toggle}>Cancel</Button>
                                <Button className="ant-btn ant-btn-primary" onClick={this.onAddStep}>Add Step</Button>
                            </div>
                        </div> */}
                        {this.props.data.length > 0 && <Button type="link" className="trial_button_close" onClick={ this.onButtonCloseHandler }><Icon type="close" /></Button>}
                        <div className="trail_modal_content_main">
                            <div className="trail_modal_title">{title}</div>
                            {<span className="trail_modal_content" dangerouslySetInnerHTML={{ __html: description }}></span>}
                            { preview }
                        </div>
                        
                        <div className="btn-wrap">
                            {1 < (tourStep) && <Button type="link" className="prev" onClick={(e) => this.onClickToManagePopoverButton(e, this.props.data[tourStep - 1], tourStep - 1, 'prev')}><Icon type="left" /></Button>}
                            {this.props.data.length > tourStep && <Button type="link" className="next" onClick={(e) => this.onClickToManagePopoverButton(e, this.props.data[tourStep - 1], tourStep + 1, 'next')}><Icon type="right" /></Button>}
                            {this.props.data.length === tourStep && <Button type="link" className="next" onClick={() => this.onClickToDoneTour(this.props.data[tourStep - 1], tourStep)}><Icon type="right" /></Button>}
                        </div>
                    </ModalBody>
                </Modal>
            </React.Fragment>
        )
    }
}

export default Form.create()(PreviewModalComponent);
