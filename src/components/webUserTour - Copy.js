import React from 'react';
import Tour from "react-user-tour";
import { Button, notification } from 'antd';
import ReactDOM from 'react-dom';
import { Popover, PopoverHeader, PopoverBody } from 'reactstrap';
import { urlStingCheck, getScrollParent } from './common';
import unique from 'unique-selector';
import $ from 'jquery';

const chrome = window.chrome;

function getWindowRelativeOffset(parentWindow, elem) {
    var offset = {
        left : 0,
        top : 0
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

class WebUserTour extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isTourActive: true,
            tourStep: 1,
            tourSteps: {},
            tourContent: [],
            uniqueTargetStatus: false
        };
    }

    componentDidMount() {
        let { tourStep, tourContent } = this.state;
        
        if(document.querySelector(this.props.data[tourStep - 1].uniqueTarget) != null) {
            this.getWebUserTour();
        } else {
            let a = () => {
                if(document.querySelector(this.props.data[tourStep - 1].uniqueTarget) != null) {
                    clearInt();
                    this.getWebUserTour();
                }
            }
            const interval = setInterval(a, 1000);
            function clearInt() {
                clearInterval(interval);
            }
            notification.error({message: 'Plese scroll down the page', placement: 'topLeft'});
        }
    }

    getDerivedStateFromProps(props, state) {
        this.setState({
            tourStep: props.tourStep
        })
    }

    /**
     * get currentweb user tour
    */
    getWebUserTour = () => {
        let checkFirstStep = true;
        let { tourSteps, tourStep } = this.state
        
        let tourContent = this.props.data.map((res, index) => {
            let countClass = 0;
            let pathCount = 0;
            let selector = "";
            let elementTrgetedIndex = 1;
            tourSteps[`step${index+1}`] = false;            
            if(res.type === 'tooltip') {
                if((res.url === document.URL) || (urlStingCheck(res.url, ['/#', '/#/']) && urlStingCheck(document.URL, ['/#', '/#/']))) {
                    if(this.props.tourStep === (index + 1)) {
                        document.querySelector(res.uniqueTarget).classList.add(`traiil_stop${index + 1}`);
                        tourSteps[`step${index+1}`] = true;
                        document.querySelector(res.uniqueTarget).classList.add('trail_web_user_tour');
                        this.setState({tourStep: (index+1), uniqueTargetStatus: true});
                        $(unique(getScrollParent(document.querySelector(res.uniqueTarget)))).append("<div class='trail_overlay'></div>");
                        $(unique(getScrollParent(document.querySelector(res.uniqueTarget)))).css({position: 'relative'});
                        let targetElement = unique(getScrollParent(document.querySelector(res.uniqueTarget)));
                        var docHeight = document.querySelector(targetElement).scrollHeight;
                        $(".trail_overlay")
                            .height(docHeight)
                            .css({
                                'opacity': 0.8,
                                'position': 'absolute',
                                'top': 0,
                                'left': 0,
                                'background-color': 'black',
                                'width': '100%',
                                'z-index': 99999999
                            });
                        
                        const y = document.querySelector(res.uniqueTarget).getBoundingClientRect().top + document.querySelector(targetElement).scrollTop - 500;
                        
                        $(targetElement).stop().animate({
                            scrollTop: y
                        }, 2000);
                    }

                    let obj = {
                        step: index + 1,
                        uniqueTarget: res.uniqueTarget,
                        selector: res.selector,
                        title: <div>{res.title}</div>,
                        body: <div>{res.description}</div>,
                        url: res.url
                    }
                    return obj
                }
            }
        }).filter(r => r!==undefined);
        
        this.setState({tourContent, tourSteps, tourStep: this.props.tourStep});
    }

    /**
     * Manage popover web user tour button
     * @data tooltip data
     * @step tooltip current step
    */
    onClickToManagePopoverButton = (event, data, step, tourSide) => {
        let { tourSteps, tourStep, tourContent } = this.state;
        document.querySelector(this.props.data[tourStep - 1].uniqueTarget).classList.remove('trail_web_user_tour');
        if((this.props.data[step - 1].url === document.URL) || (urlStingCheck(this.props.data[step - 1].url, ['/#', '/#/']) && urlStingCheck(document.URL, ['/#', '/#/']))) {            
            let type = this.props.data[step - 1].type;
            if(type === 'tooltip') {
                document.querySelector(this.props.data[step - 1].uniqueTarget).classList.add('trail_web_user_tour');
                Object.keys(tourSteps).map((r, i) => {
                    if((i + 1) === step) {
                        tourSteps[r] = true
                    } else {
                        tourSteps[r] = false
                    }
                })
                // var scrollTop = $(data.selector);
                // // tourSteps[tourStep - 1].selector
                // $(window).scrollTop(scrollTop);
                const y = document.querySelector(this.props.data[step - 1].uniqueTarget).getBoundingClientRect().top + window.scrollY - 500;
                event.preventDefault();
                $(unique(getScrollParent(document.querySelector(this.props.data[step - 1].uniqueTarget)))).stop().animate({
                    scrollTop: y,
                    behavior: 'smooth'
                }, 2000);
                this.setState({tourSteps, tourStep: (step - 1)});
                this.props.tour(step, type, tourSide);
            } else {
                Object.keys(tourSteps).map((r, i) => {
                    tourSteps[r] = false
                })
                $('.trail_overlay').remove();
                // step, type
                this.setState({tourSteps, tourStep: (step - 1)})
                this.props.tour(step, type, tourSide)
            }
        } else {
            let type = this.props.data[step - 1].type;
            Object.keys(tourSteps).map((r, i) => {
                tourSteps[r] = false
            })            
            this.props.tour(step, type, tourSide)
            chrome.runtime.sendMessage({type: "notification", options: { 
                url: this.props.data[step - 1].url
            }});
        }
    }

    onClickToDoneTour = (data, step) => {
        let { tourSteps, tourStep, tourContent } = this.state;
        $('.trail_overlay').remove();
        document.querySelector(this.props.data[step - 1].uniqueTarget).classList.remove('trail_web_user_tour');
        Object.keys(tourSteps).map((r, i) => {
            tourSteps[r] = false
        });
        this.setState({tourSteps, tourStep: 1})
        this.props.toggle();
    }

    render() {
        const { tourSteps, tourStep, uniqueTargetStatus } = this.state;
        return (
            <div>
                { this.state.tourContent && this.state.tourContent.length > 0 && uniqueTargetStatus && <React.Fragment>
                    {this.state.tourContent.map((res,  index) => {
                        return (<Popover className="trail_tooltip_done" placement="top" isOpen={tourSteps[`step${res.step}`]} target={res.uniqueTarget}>
                                    <PopoverHeader>{res.title}</PopoverHeader>
                                    <PopoverBody>
                                        {res.body}
                                        <div className="btn-wrap">
                                            {1 < (tourStep) && <Button onClick={(e) => this.onClickToManagePopoverButton(e, res, tourStep - 1, 'prev')}>Previous</Button>}
                                            {this.props.data.length > tourStep && <Button onClick={(e) => this.onClickToManagePopoverButton(e, res, tourStep + 1, 'next')}>Next</Button>}
                                            {this.props.data.length === tourStep && <Button onClick={() => this.onClickToDoneTour(res, tourStep)}>Done</Button>}
                                        </div>                                        
                                    </PopoverBody>
                                </Popover>);
                    })}
                </React.Fragment>}
            </div>
        )
    }
}

export default WebUserTour;