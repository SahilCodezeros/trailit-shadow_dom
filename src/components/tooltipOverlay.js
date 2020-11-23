import React from 'react';
import ReactPlayer from 'react-player';
import $ from 'jquery';

const chrome = window.chrome;

class TooltipOverlay extends React.Component {
    
    constructor(props) {
        super(props);
        this.state = {
            content: {}
        }
    }
    
    componentDidMount() {
        const { data, tourStep } = this.props;

        this.setState({content: data[tourStep - 1]==undefined?{}:data[tourStep - 1]})
    }
    
    /**
     * Manage popover web user tour button
     * @data tooltip data
     * @step tooltip current step
    */
    onClickToManagePopoverButton = (event, step, tourSide) => {
        let { tourStep } = this.props;
        
        if(this.props.data[step - 1].url === document.URL) {
            let type = this.props.data[step - 1].type;
            this.setState({content: this.props.data[step - 1]});
            this.props.tour(step, type, tourSide)
        } else {
            let type = this.props.data[step - 1].type;
            this.props.tour(step, type, tourSide)
            window.location.href = this.props.data[step - 1].url;
        }
    }
    
    onClickToDoneTour = (data, step) => {
        let { tourSteps } = this.props;        
        this.props.toggle(true);
    }
    
    render() {
        const { data, tourStep, tourSide} = this.props;    

        // {(this.props.data[tourStep - 1].url === document.URL) && <div className={tourSide==='prev'?"trail_vC trail_video_overlayPrev":" trail_vC trail_video_overlayNext"}></div>
        return (
            <React.Fragment>
                <div className={"trail_vC trail_video_overlayPrev"}>
                    <img className="trail_loader_video" src={require('../images/loader.png')} />
                    {/* <div className="video-wrap">
                        {(this.props.data[tourStep - 1].url === document.URL) && <div className={"trail_vC trail_video_overlayPrev"}>
                            <div className="video-wrap">
                                <p className="contentTitle videoShow">{this.state.content.title}</p>
                                <div className="description videoShow" dangerouslySetInnerHTML={{ __html: this.state.content.description }}></div>
                                <div className="bottom-links videoShow">
                                    {1 < (tourStep) && <React.Fragment><a onClick={(e) => this.onClickToManagePopoverButton(e, tourStep - 1, 'prev')}>Previous</a><a>|</a></React.Fragment>}
                                    {this.props.data.length > tourStep && <React.Fragment><a onClick={(e) => this.onClickToManagePopoverButton(e, tourStep + 1, 'next')}>Next</a></React.Fragment>}
                                    {this.props.data.length === tourStep && <React.Fragment><a onClick={() => this.onClickToDoneTour(tourStep)}>Done</a></React.Fragment>}
                                    {/* <a href="">Previous</a>
                                    <a>|</a>
                                    <a href="">Next</a> 
                                    </div>
                                </div>}                            
                                    */}
                </div>
            </React.Fragment>
        )
    }
}

export default TooltipOverlay;
