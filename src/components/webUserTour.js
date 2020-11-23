import React from 'react';
import Tour from "react-user-tour";
import { Button, notification, Icon } from 'antd';
import ReactDOM from 'react-dom';
import { Popover, PopoverHeader, PopoverBody } from 'reactstrap';
import unique from 'unique-selector';
import $ from 'jquery';

import { urlStingCheck, getScrollParent } from './common';
import AudioTour from './audioTour';
import { stopMediaPlaying } from '../common/stopePlayingMedia';
import { addTrailitLogo, removeTrailitLogo } from '../common/trailitLogoInPreview';

const chrome = window.chrome;

const resizeScreen = () => {
    return window.innerWidth <= 760;
}

function getWindowRelativeOffset(parentWindow, elem) {
    var offset = {
        left: 0,
        top: 0
    };
        
    // relative to the target field's document
    offset.left = elem.getBoundingClientRect().left;
    offset.top = elem.getBoundingClientRect().top;
    
    // now we will calculate according to the current document, this current
    // document might be same as the document of target field or it may be
    // parent of the document of the target field
    
    var childWindow = elem.document.frames.window;
    
    while (childWindow != parentWindow) {
        offset.left = offset.left + childWindow.frameElement.getBoundingClientRect().left;
        offset.top = offset.top + childWindow.frameElement.getBoundingClientRect().top;
        childWindow = childWindow.parent;
    }

    return offset;
}

let countN = 0;

class WebUserTour extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isTourActive: true,
            tourStep: 1,
            tourSteps: {},
            tourContent: [],
            uniqueTargetStatus: false,
            curentTour: {}
        };
    }
    
    componentDidMount() {
        
        let { tourStep } = this.state;
        this.createPopOver(tourStep);

        window.addEventListener('load', this.handleLoad);

        
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
        this.getWebUserTour('', this.props.data[tourStep - 1], tourStep);
        
        if(this.props.data[tourStep - 1].mediaType && (this.props.data[tourStep - 1].mediaType === 'video' || this.props.data[tourStep - 1].mediaType === 'audio')) {
            // if(document.URL.includes('youtube.com')) {
            //     let videoElem = document.querySelector('.video-stream.html5-main-video');
            //     videoElem.addEventListener('onloadeddata', () => {
            //         videoElem.pause();
            //     });
            //     setTimeout(() => {
            //         videoElem.pause();
            //     }, 1000);
            // }

            // setTimeout(() => {
            //     console.log("dfdfdf111")
            //     document.querySelectorAll('video').forEach(res => {
            //         console.log("dfdfdf222222222222")
            //         console.log("reee", res);
            //         if(res.className !== "preview-video") {
            //             res.pause()    
            //         }
            //     })
            // }, 2000);

            // if (document.readyState === 'complete') {
            //     $(document).ready(() => {
            //         // Stop playing websites audio or video
            //         stopMediaPlaying();
            //     });
            
            // } else {
            //     document.body.onload = function () {
            //         // Stop playing websites audio or video
            //         stopMediaPlaying();
            //     };
            // }
            
            if (document.readyState === 'complete') {
                $(document).ready(() => {
                    // Stop playing websites audio or video
                    stopMediaPlaying();
                });
            } else if (document.readyState === 'interactive' && document.URL.includes('https://www.youtube.com/')) {            
                console.log('doc is loading');
                // document.body.onload = function () {
                //     console.log('body is loaded!!!!');
                //     // Call toggle website media
                //     this.toggleWebSitesMedia();
                // };
                $(document).ready(() => {
                    // Stop playing websites audio or video
                    stopMediaPlaying();
                });
            } else {
                document.body.onload = function () {
                    // Stop playing websites audio or video
                    stopMediaPlaying();
                };
            }

            // Add logo
            this.addLogo();
            
            setTimeout(() => {
                document.querySelectorAll('video').forEach(res => {
                    if(res.className !== "preview-video") {
                        res.pause();
                    }
                })
            }, 2000);
        }
    }

    componentDidUpdate() {
        // Call add logo function
        this.addLogo();
    };
    
    handleLoad = (e) => {
        // alert("GGGGGGGGGGGGGGGGGGGGGGG");
    }

    addLogo = () => {
        console.log('addLogo');

        // Add trailit logo
        addTrailitLogo();
    };

    handleMessage(msg) {
        let { tourStep } = this.state;
        
        setTimeout(() => {
                chrome.storage.local.get(["trail_web_user_tour", "tourStatus", "tourType", "tourStep", "currentTourType"], function (items) {
                this.createPopOver(items.tourStep);
                this.getWebUserTour('', this.props.data[items.tourStep - 1], items.tourStep);
            })
        }, 3000);
    }
    
    componentWillUnmount() {
        // Remove listener when this component unmounts
        chrome.runtime.onMessage.removeListener(this.handleMessage);

        // Remove trailit log
        removeTrailitLogo();
    }
    
    static getDerivedStateFromProps(props, state) {
        return {
            tourStep: props.tourStep
        }
    }

    /**
     * create popover based on their url
    */
    createPopOver = (step) => {
        const { tourSteps, tourStep } = this.state;
        
        let content = this.props.data.map((res, index) => {
            let unqTarget = res.uniqueTarget;
            
            if(resizeScreen()) {
                if(res.unique_target_one!='') {
                    unqTarget = res.unique_target_one
                }
            }

            if (res.url == this.props.data[step - 1].url && res.type == 'tooltip' && document.querySelector(unqTarget) != null) {
                tourSteps[`step${index + 1}`] = false;
                res['step'] = index + 1;
                return res;
            }
        }).filter(r => r != undefined);
        
        this.setState({ tourContent: content, tourSteps });
    }
    
    /**
      * get currentweb user tour
    */
    getWebUserTour = (event, data, step) => {    
        let checkFirstStep = true;
        let { tourSteps, tourStep } = this.state;
        let activeWeb = data;
        let unqTarget = this.props.data[step - 1].uniqueTarget;
        
        if(resizeScreen()) {
            if(this.props.data[step - 1].unique_target_one!='') {
                unqTarget = this.props.data[step - 1].unique_target_one
            }
        }
        
        if (document.querySelector(unqTarget) == null) {
            let a = () => {
                if(resizeScreen()) {
                    countN++;
        
                    if(countN == 4) {
                        alert("Your target not found!!");
                        clearInt();
                        this.onButtonCloseHandler(event);
                        this.props.onNotFoundTarget({trail_data_id: this.props.data[step - 1].trail_data_id})
                        countN=0;
                    }
                }

                if (document.querySelector(unqTarget) != null) {
                    countN=0;
                    clearInt();
                    this.createPopOver(step);
                    this.getWebUserTour(event, data, step);
                }
            }
            
            const interval = setInterval(a, 1000);
            
            function clearInt() {
                clearInterval(interval);
            }
        
            // notification.open({ message: 'Plese scroll down the page', placement: 'topLeft', className: 'trail_noti' });
        } else {
            // document.querySelector(activeWeb.uniqueTarget).classList.add(`traiil_stop${step}`);
            document.querySelector(unqTarget).classList.add('trail_web_user_tour');
            $('body').append("<div class='trail_overlay'></div>");
            let targetElement = "html, body";
            var docHeight = document.documentElement.scrollHeight;
            let original = document.querySelector(unqTarget);
            let bounding = original.getBoundingClientRect();
            let offset = $(unqTarget).offset();
            let leftPosition = offset.left;
            let topPosition = offset.top;
        
            setTimeout(() => {
                if($(unqTarget).offset() !== undefined) {
                    if(topPosition !== $(unqTarget).offset().top) {
                        $('.trail_overlay').remove();
                        this.createPopOver(step);
                        this.getWebUserTour(event, data, step);
                    }
                }
            }, 1000);
                    
            let bodyElement = $(unique(getScrollParent(document.querySelector(unqTarget))));
            $(".trail_overlay").append(`<svg height="100%" width="100%">
                <polygon points="0,0 ${window.innerWidth},0 ${window.innerWidth},${docHeight} 0,${docHeight} 0,${topPosition + bounding.height + 10} ${leftPosition + bounding.width + 10},${topPosition + bounding.height + 10} ${leftPosition + bounding.width + 10},${topPosition - 10} ${leftPosition - 10},${topPosition - 10} ${leftPosition - 10},${topPosition + bounding.height + 10} 0,${topPosition + bounding.height + 10}" style="fill:rgba(0,0,0,0.8);"/>
                Sorry, your browser does not support inline SVG.
            </svg>`);

            $(".trail_overlay")
            .height(docHeight)
            .css({
                'position': 'absolute',
                'top': 0,
                'left': 0,
                'width': '100%',
                'z-index': 99999999
            });
            
            if (event != '') {
                event.preventDefault();
            }
            
            const y = document.querySelector(unqTarget).getBoundingClientRect().top + document.querySelector(targetElement).scrollTop + bounding.height - 300;
            $(targetElement).stop().animate({
                scrollTop: y
            }, 1000);
            
            window.addEventListener("load", () => {
                setTimeout(() => {
                    $(targetElement).stop().animate({
                        scrollTop: y
                    }, 1000);
                }, 2000);
            })
            
            document.querySelector('.trail_overlay').addEventListener('dblclick', () => {
                document.querySelector('.trail_overlay').style.display = "none";
            })

            let content = this.props.data.map((res, index) => {
                if (res.url == document.URL) {
                    tourSteps[`step${index + 1}`] = false;
                    res['step'] = index + 1;
                    return res;
                }
            }).filter(r => r != undefined);
            
            activeWeb = {
                ...activeWeb,
                uniqueTarget: unqTarget
            }
            
            tourSteps[`step${step}`] = true;
            this.setState({ curentTour: activeWeb, uniqueTargetStatus: true, tourStep: step, tourSteps });
        }
    // }
    }
    
    /**
     * Manage popover web user tour button
     * @data tooltip data
     * @step tooltip current step
    */
    onClickToManagePopoverButton = (event, data, step, tourSide) => {
        $('.trail_overlay').remove();
        $('.trail_web_user_tour').parents().css('z-index', '');
        // $('.trail_web_user_tour').parent().parent().removeAttr('style');
        $('.trail_web_user_tour').removeAttr('trail_web_user_tour');
        // $(`traiil_stop${this.state.tourStep}`).removeAttr(`traiil_stop${this.state.tourStep}`);
        
        let { tourSteps, tourStep, tourContent } = this.state;        
        let unqTarget = this.props.data[tourStep - 1].uniqueTarget;
        
        if(resizeScreen()) {
            if(this.props.data[tourStep - 1].unique_target_one!='') {
                unqTarget = this.props.data[tourStep - 1].unique_target_one;
            }
        }
        
        document.querySelector(unqTarget).classList.remove('trail_web_user_tour');
        if ((this.props.data[step - 1].url === document.URL)) {
            let type = this.props.data[step - 1].type;

            if (type === 'tooltip') {
                this.createPopOver(step);
                this.getWebUserTour(event, this.props.data[step - 1], step);
                this.props.tour(step, type, tourSide);
            } else {
                this.setState({ tourStep: (step - 1) });
                this.props.tour(step, type, tourSide);
            }
        } else {
            // Set loading true to show overlay
            this.props.setLoadingState(true);
            let type = this.props.data[step - 1].type;
            this.props.tour(step, type, tourSide);
            // chrome.runtime.sendMessage({type: "notification", options: {
            //     url: this.props.data[step - 1].url
            // }});
            window.location.href = this.props.data[step - 1].url;
            setTimeout(() => {
                this.createPopOver(step);
                this.getWebUserTour(event, this.props.data[step - 1], step);
            }, 2000);
        }
    }
        
    onClickToDoneTour = (data, step) => {
        let { tourSteps, tourStep } = this.state;
        $('.trail_web_user_tour').parents().css('z-index', '');
        $(`.trail_tour_ToolTipExtend`).remove();
        $('.trail_tooltip_done').remove();
        $('.trail_web_user_tour').removeAttr('trail_web_user_tour');
        $(`traiil_stop${tourStep}`).removeAttr(`traiil_stop${tourStep}`);
        $('.trail_overlay').remove();
        
        // $('.trail_web_user_tour').parent().parent().removeAttr('style');
        // if(document.querySelector(this.props.data[step - 1].uniqueTarget)) {
        //     document.querySelector(this.props.data[step - 1].uniqueTarget).classList.remove('trail_web_user_tour');
        // }
        
        Object.keys(tourSteps).map((r, i) => {
            tourSteps[r] = false;
        });
        
        this.setState({ tourSteps, tourStep: 1 });
        chrome.storage.local.set({closeContinue: false});
        this.props.toggle({ removePreviewTrails: true });
    };
    
    onLoadedEvent = (e) => {
        let  { uniqueTarget } = this.props.data[this.state.tourStep - 1];
        let targetElement = "html, body";
        let bounding = document.querySelector(uniqueTarget).getBoundingClientRect();
        const y = document.querySelector(uniqueTarget).getBoundingClientRect().top + document.querySelector(targetElement).scrollTop  + bounding.height - 300;
        $(targetElement).stop().animate({
            scrollTop: y
        }, 1000);
    };
    
    onButtonCloseHandler = async (e) => {
        // Call parent component function to close tooltip preview
        await this.props.closeButtonHandler(e);
    };
    
    render() {
        const { tourSteps, tourStep, tourContent, uniqueTargetStatus } = this.state;
        let preview = null;
        let mediaTypeStatus;
        
        if(resizeScreen() && this.props.data[tourStep - 1].unique_target_one!='') {
            mediaTypeStatus = this.props.data[tourStep - 1].mobile_media_type;
        } else {
            mediaTypeStatus = this.props.data[tourStep - 1].mediaType;
        }
        
        if (mediaTypeStatus && mediaTypeStatus === 'video') {
            preview = (
                <div className="tr_preview_video_bx">
                    <video className="preview-video" disablePictureInPicture controlsList="nodownload" controls onLoadedData={(e) => this.onLoadedEvent(e)} allow="autoplay" autoPlay>
                        <source src={this.props.data[tourStep - 1].web_url} />
                    </video>
                </div> 
            );
        } else if (mediaTypeStatus && mediaTypeStatus === 'audio') {                
            preview = <AudioTour data={this.props.data} toggle={this.props.toggle} tourStep={this.props.tourStep} tour={this.props.tour} previewInTooltip />
        } else if (mediaTypeStatus && mediaTypeStatus === 'image') {
            preview = (
                <div className="tr_preview_picture_bx">
                    <img className="preview-picture" src={this.props.data[tourStep - 1].web_url} alt="preview-img" />
                </div>   
            );
        }
                
        return (
            <div>
                {uniqueTargetStatus && (this.props.data[tourStep - 1].url === document.URL) && <React.Fragment>
                    {tourContent.map((res, index) => {
                        let unTarget = resizeScreen()?(res.unique_target_one!=''?res.unique_target_one:res.uniqueTarget):res.uniqueTarget;
                        let title, description;
                                        
                        if(resizeScreen() && res.unique_target_one!='') {
                            title = res.mobile_title;
                            description = res.mobile_description;
                        } else {
                            title = res.title;
                            description = res.description;
                        }
                        
                        return (
                            <Popover className={`trail_tooltip_done ${mediaTypeStatus && mediaTypeStatus === 'text'?'trail_text_only':'' || mediaTypeStatus && mediaTypeStatus === 'video'?'tr_video_only':'' || mediaTypeStatus && mediaTypeStatus === 'image'?'tr_picture_only':''  || mediaTypeStatus && mediaTypeStatus === 'audio'?'tr_audio_only':''}`} placement="top" isOpen={tourSteps[`step${res.step}`]} target={unTarget}>
                                {/* <button> */}
                                    <img 
                                        alt=".."
                                        className="trailit_IconRightBottom" 
                                        src={require(`../images/trailit_icon1.png`)} 
                                        onClick={ (e) => {
                                            
                                            // Call send tip open modal function
                                            this.props.onSendTipModalOpen();
                                        } }
                                    />
                                {/* </button> */}
                                <div className="trail_preview_bx">
                                <PopoverHeader className="top">{title}</PopoverHeader>
                                <PopoverBody>
                                    {<span dangerouslySetInnerHTML={{ __html: description }}></span>}

                                    { preview }
                                    
                                    {/* {this.props.data[tourStep - 1].mediaType && this.props.data[tourStep - 1].mediaType === 'video' && 
                                        <div className="btn-wrap">
                                            {1 < (tourStep) && <Button type="link" className="prev" onClick={(e) => this.onClickToManagePopoverButton(e, res, tourStep - 1, 'prev')}><Icon type="left" /></Button>}
                                            {this.props.data.length > tourStep && <Button type="link" className="next" onClick={(e) => this.onClickToManagePopoverButton(e, res, tourStep + 1, 'next')}><Icon type="right" /></Button>}
                                            {this.props.data.length === tourStep && <Button type="link" className="next" onClick={() => this.onClickToDoneTour(res, tourStep)}><Icon type="right" /></Button>}
                                        </div>
                                    }
                                    
                                    {this.props.data[tourStep - 1].mediaType && this.props.data[tourStep - 1].mediaType !== 'video' && <div className="btn-wrap">
                                        {1 < (tourStep) && <Button type="primary" onClick={(e) => this.onClickToManagePopoverButton(e, res, tourStep - 1, 'prev')}>Previous</Button>}
                                        {this.props.data.length > tourStep && <Button type="primary" onClick={(e) => this.onClickToManagePopoverButton(e, res, tourStep + 1, 'next')}>Next</Button>}
                                        {this.props.data.length === tourStep && <Button type="primary" onClick={() => this.onClickToDoneTour(res, tourStep)}>Done</Button>}
                                    </div>} */}
                                </PopoverBody>
                                <PopoverHeader className="bottom">{res.title}</PopoverHeader>
                                </div>
                                <div className="btn-wrap">
                                    {this.props.data.length > 0 && <Button type="link" className="trial_button_close" onClick={ this.onButtonCloseHandler }><Icon type="close" /></Button>}
                                    {1 < (tourStep) && <Button type="link" className="prev" onClick={(e) => this.onClickToManagePopoverButton(e, res, tourStep - 1, 'prev')}><Icon type="left" /></Button>}
                                    {this.props.data.length > tourStep && <Button type="link" className="next" onClick={(e) => this.onClickToManagePopoverButton(e, res, tourStep + 1, 'next')}><Icon type="right" /></Button>}
                                    {this.props.data.length === tourStep && <Button type="link" className="next" onClick={() => this.onClickToDoneTour(res, tourStep)}><Icon type="right" /></Button>}
                                </div>                                
                            </Popover>
                        )
                    })}
                </React.Fragment>}
            </div>
        )
    }
}

export default WebUserTour;
