import React from 'react';
import ReactPlayer from 'react-player';
import $ from 'jquery';
import Dragabilly from 'draggabilly';
import { Button, Icon } from 'antd';

import dragElement from '../common/draggable';
import { stopMediaPlaying } from '../common/stopePlayingMedia';
import { addTrailitLogo, removeTrailitLogo } from '../common/trailitLogoInPreview';

let draggie, dragEle;
const chrome = window.chrome;
class VideoTour extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            fullScreen: true,
            loadVideo: false,
            draggable: false,
            webUrl: ''
        }
    };

    elementDragging = () => {
        dragEle = document.querySelector('.video-wrap_tooltip');
        draggie = new Dragabilly(dragEle);
    };
    
    componentDidMount() {
        //Make the DIV element draggable
        // this.elementDragging();
        this.setState({ loadVideo: true, fullScreen: false, draggable: true });
        let video = $("#trail_video");
        $('.tr_play_button').css('display', 'block')
        chrome.storage.local.get(['AutoPlayMediaToggle'], (items) => {
            if(items.AutoPlayMediaToggle===undefined || items.AutoPlayMediaToggle) {
                let playPromise = video[0].play();
                if (playPromise !== undefined) {
                    playPromise.then(function() {
                        $('.tr_play_button').css('display', 'none');
                    }).catch(function(error) {
                        $('.tr_play_button').css('display', 'block')
                    });
                }
            }
        })
        
        if(this.props.data[this.props.tourStep - 1].url !== document.URL) {
            window.location.href = this.props.data[this.props.tourStep - 1].url;
        }
        
        // if(document.URL.includes('youtube.com')) {
        //     let videoElem = document.querySelector('.video-stream.html5-main-video');
        //     videoElem.addEventListener('onloadeddata', () => {
        //         videoElem.pause();
        //     })
        //     setTimeout(() => {
        //         videoElem.pause();
        //     }, 1000)
        // }

        // setTimeout(() => {
        //     document.querySelectorAll('video').forEach(res => {
        //         if(res.className !== "preview-video") {
        //             res.pause()    
        //         }
        //     })
        // }, 1000)

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
            console.log('doc is ready');
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
        
        // let pipButton = document.getElementById('trail_pip_video_button');
        // let videoShow = $('.videoShow');
        // let pipWindow;
        
        // pipButton.addEventListener('click', async function(event) {
        //     pipButton.disabled = true;
        //     try {
        //         if (video !== document.pictureInPictureElement)
        //             await video.requestPictureInPicture();
        //         else
        //             await document.exitPictureInPicture();
        //     } catch (error) {
        //     } finally {
        //         pipButton.disabled = false;
        //     }
        // });
        
        // video.addEventListener('enterpictureinpicture', function (event) {
        //     pipWindow = event.pictureInPictureWindow;
        //     video.style.display = "none";
        //     videoShow.css({display: 'none'});
        //     $('.trail_vC').css({display: 'none'});
        // });
        
        // video.addEventListener('leavepictureinpicture', function (event) {
        //     video.style.display = "block";
        //     videoShow.css({display: 'block'});
        //     $('.trail_vC').css({display: 'block'});
        // });

        // Add trailit logo
        addTrailitLogo();
    }
    
    /**
     * Manage popover web user tour button
     * @data tooltip data
     * @step tooltip current step
    */
    onClickToManagePopoverButton = (event, step, tourSide) => {
        let { tourStep } = this.props;
        
        if($('body')) {
            $('body').removeClass("trail_fullscreen")
        }

        if(this.props.data[step - 1].url === document.URL) {
            let type = this.props.data[step - 1].type;
            this.props.tour(step, type, tourSide);
        } else {
            // Set loading true to show overlay
            this.props.setLoadingState(true);

            let type = this.props.data[step - 1].type;
            this.props.tour(step, type, tourSide);
            window.location.href = this.props.data[step - 1].url;
        }
    }
    
    static getDerivedStateFromProps(nextProps, prevState){
        let getVideo = document.getElementById("trail_video");
        let getSource = document.getElementById("sourceVideo");

        if(getVideo!==null && (prevState.webUrl !== nextProps.data[nextProps.tourStep - 1].web_url)) {
            getVideo.load();
            if(getSource!==null) {
                getSource.setAttribute("src", nextProps.data[nextProps.tourStep - 1].web_url);
            }
        }
        
        return {
            webUrl: nextProps.data[nextProps.tourStep - 1].web_url
        }
    }
    
    onClickToDoneTour = (data, step) => {
        let { tourSteps } = this.props;
        if($('body')) {
            $('body').removeClass("trail_fullscreen")
        }
        chrome.storage.local.set({closeContinue: false});
        this.props.toggle({ removePreviewTrails: true });
    }

    toggleScreen = (e) => {
        e.preventDefault();
        if (!this.state.fullScreen && this.state.draggable) {
            $('body').addClass("trail_fullscreen");
            // Make video full screen   
            this.setState(prevState => {
                return {
                    fullScreen: !prevState.fullScreen,
                    draggable: false
                };
            });
        
        } else {
            // Setting top and left for small video screen
            document.querySelector('.video-wrap_tooltip').style.top = 'calc(100% - 180.344px)';
            document.querySelector('.video-wrap_tooltip').style.left = 'calc(100% - 430px)';
        
            $('body').removeClass("trail_fullscreen")
            
            // Make video small screen
            this.setState(prevState => {
                return {
                    fullScreen: !prevState.fullScreen,
                    draggable: true
                }
            });
        }
    };
    
    onClickToPlayVideo = () => {
        var video = $("#trail_video");
        video[0].play();
        $('.tr_play_button').css('display', 'none')
    }

    onClickPauseVideo = () => {
        $('.tr_play_button').css('display', 'block')
    }

    componentWillUnmount() {
        // Remove trailit log
        removeTrailitLogo();
    }
    
    // videoPlayIconChange = (e) => {
    //     e.preventDefault();
    //     console.log('mouseIn');
    //     document.addEventListener('keypress', (e) => {
    //         console.log('keypress');
    //         if (e.keyCode === 32 || e.which === 32) {
    //             const playIcon = document.querySelector('.tr_play_button');
    
    //             if (playIcon.style.display === 'block') {
    //                 playIcon.style.display = 'none';
    //             } else {
    //                 playIcon.style.display = 'block';
    //             }
    //         }
    //     });
    // };
    
    render() {        
        if (this.state.loadVideo) {
            if (!this.state.fullScreen) {
                // Enable dragging
                // draggie.enable();
                dragElement(document.querySelector('.video-wrap_tooltip'));
            } else {
                // Disable dragging
                // draggie.disable();
            }
        }

        // picture in picture mode code
        // <a id="trail_pip_video_button" className="icon videoShow"><img src={ this.fullScreen ? "https://res.cloudinary.com/dlhkpit1h/image/upload/v1578376401/iti33lwa5ued6zunxefv.png":  } /></a>
        
        // overlay
        // className={tourSide==='prev'?"trail_vC trail_video_overlayPrev trail_tooltip_done":"trail_vC trail_video_overlayNext trail_tooltip_done"}
        
        // tooltip overlay
        // tourSide==='prev'?"trail_vC trail_video_overlayPrev trail_tooltip_done":"trail_vC trail_video_overlayNext trail_tooltip_done"        
        
        const { tourStep, tourSide, play} = this.props;
        
        return (
            <div className={ [this.state.fullScreen ? tourSide === 'prev' ? "trail_vC trail_video_overlayPrev trail_tooltip_done" : "trail_vC trail_video_overlayNext trail_tooltip_done" : null].join(' ') }>
                <div className={ ['video-wrap_tooltip', this.state.fullScreen ? 'video-wrap_tooltip-fullScreen' : 'video-wrap_tooltip-smallScreen'].join(' ') }>
                    {this.props.data.length > 0 && !this.state.fullScreen && <Button type="link" className="trial_button_close" onClick={ this.props.closeButtonHandler }><Icon type="close" /></Button>}
                    {/* <p className="title videoShow">Next Learn I will show you</p> */}
                    <div className={[!this.state.fullScreen ? 'tr_gradient_border' : ''].join(' ')}>
                        <div className='video-wrap_tooltip-inner'>
                            <video className="tr_video" id="trail_video" controls allow="autoplay" onPause={this.onClickPauseVideo} onEnded={this.onClickPauseVideo} disablePictureInPicture controlsList="nodownload nofullscreen" >
                                <source id="sourceVideo" src={this.props.data[this.props.tourStep - 1].web_url} />
                            </video>
                            <div className="tr_play_button" onClick={this.onClickToPlayVideo}></div>
                        </div>
                    </div>
                    <div className={ ['btn-wrap', 'videoShow', this.state.fullScreen ? 'videoShow-fullScreen' : 'videoShow-smallScreen'].join(' ') }>                    
                        {1 < (tourStep) && <React.Fragment><button className="ant-btn ant-btn-primary ex_mr_10" onClick={(e) => this.onClickToManagePopoverButton(e, tourStep - 1, 'prev')}>Previous</button></React.Fragment>}
                        {this.props.data.length > tourStep && <React.Fragment><button className="ant-btn ant-btn-primary ex_mr_10" onClick={(e) => this.onClickToManagePopoverButton(e, tourStep + 1, 'next')}>Next</button></React.Fragment>}
                        {this.props.data.length === tourStep && <React.Fragment><button className="ant-btn ant-btn-primary ex_mr_10" onClick={() => this.onClickToDoneTour(tourStep)}>Done</button></React.Fragment>}
                    </div>                    

                    <a onClick={(e) => this.toggleScreen(e)} id="trail_pip_video_button" className={ ['icon videoShow', this.state.fullScreen ? 'video-icon-fullScreen' : 'video-icon-smallScreen'].join(' ') }><img alt="full-small screen button img" src={ !this.state.fullScreen ? "https://www.materialui.co/materialIcons/navigation/fullscreen_white_36x36.png" : "https://res.cloudinary.com/dlhkpit1h/image/upload/v1578376401/iti33lwa5ued6zunxefv.png" } /></a>
                </div>
            </div>
        )
    }
}

export default VideoTour;
