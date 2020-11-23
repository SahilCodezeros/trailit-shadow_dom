import React from "react";
import {
  sortableContainer,
  sortableElement,
  sortableHandle,
} from "react-sortable-hoc";
import _ from "lodash";

const resizeScreen = () => {
  return window.innerWidth <= 760;
};

const onTitleClickHandler = (e) => {
  e.preventDefault();

  const titles = document.querySelectorAll(".en_title");

  titles.forEach((el) => {
    el.addEventListener("keydown", (e) => {
      e.stopPropagation();
    });
  });
};

const onDescriptionHandler = (e) => {
  e.preventDefault();

  const descriptions = document.querySelectorAll(".en_desc");
  descriptions.forEach((el) => {
    el.addEventListener("keydown", (e) => {
      e.stopPropagation();
    });
  });
};

/**
 * Draggable list handle
 */
const DragHandle = sortableHandle(() => (
  <span className="drag_icon">
    <img src={require("../images/move.png")} alt="drag icon" width="25px" />
  </span>
));

/**
 * Draggable item sort
 */
class SortableItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      MobileTargetNotFound: {},
      result: [],
      showMenu: false,
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    return {
      MobileTargetNotFound: nextProps.MobileTargetNotFound,
      result: nextProps.result,
    };
  }

  onClickToAddSubMenu = (e, result, tourStep) => {
    this.props.onClick(e, result, tourStep);
  };
  
  handleClickMenu = (e) => {
    e.stopPropagation();

    // Set show menu state
    this.setState({showMenu: !this.state.showMenu});
  };

  onMouseLeave = (e) => {
    if (this.state.showMenu) {
      // Set show menu state
      this.setState({showMenu: false});
    }
  };

  // componentDidUpdate() {
  //   const trailBuilderElement = document.querySelector('.trail_builder_side_panel_open');
  //   console.log('trailBuilderElement', trailBuilderElement);
  //   console.log('this.state.showMenu', this.state.showMenu);
  //   console.log(this.state.showMenu && trailBuilderElement);

  //   if (this.state.showMenu && trailBuilderElement) {
  //     // Hide detele button
  //     this.setState({ showMenu: false });
  //   }
  // };
  
  render() {
    let { i, result, tourStep, tourType } = this.props;

    const { MobileTargetNotFound } = this.state;
    let subStep = result.unique_target_one != "" ? true : false;
    let subStepStatus = false;

    if (!_.isEmpty(MobileTargetNotFound)) {
      subStepStatus =
        result.trail_data_id === MobileTargetNotFound.trail_data_id;
    }
    
    if (!resizeScreen()) {
      subStepStatus = false;
      subStep = false;
    }

    return (
      // <div key={i} className={`li done trailTourStep ${tourStep === (i + 1) ? 'active' : ''}`}>
      //     <DragHandle />
      //     <div className="counter"><span>{i + 1}</span></div>
      //     <div>
      //         <div className="en_title">
      //             {result.title}
      //         </div>
      //         <div className="en_desc mb-2">
      //             {(result.type !== 'audio' &&
      //             result.type !== 'video' &&
      //             result.mediaType === 'text') ? <span dangerouslySetInnerHTML={{ __html: result.description }}></span> : result.url}
      //         </div>
      //         {subStepStatus && <div>
      //             <button onClick={(e) => this.onClickToAddSubMenu(e, result, (i + 1))}>Add</button>
      //         </div>}
      //         {subStep && <div>
      //             <div className="en_title">
      //                 {result.mobile_title}
      //             </div>
      //             <div className="en_desc mb-2">
      //                 {(result.type !== 'audio' &&
      //                 result.type !== 'video' &&
      //                 result.mobile_media_type === 'text') ? <span dangerouslySetInnerHTML={{ __html: result.mobile_description }}></span> : result.url}
      //             </div>
      //         </div>}
      //     </div>
      // </div>
      
      //   <div className={`${
      //     this.state.showMenu
      //       ? "z-index-2"
      //       : ""
      //   }`}>
      <div>
        <div
          key={i}
          onMouseLeave={ this.onMouseLeave }
          className={`trailitStepBox ${
            tourStep === i + 1
              ? "active"
              : "" } ${this.state.showMenu
              ? "z-index-2"
              : ""
          }`}
        >
          {
            tourType !== 'preview' &&
              <DragHandle />
          }
          <div className="trailitStepTitle">
            Step {i + 1} - {result.title}
          </div>
          <div className="trailitIconRight">
            <div>
              {
                this.props.tourType === 'Make Edit' &&
                  <button
                    type="button"
                    onClick={ this.handleClickMenu }
                    className="trailit_dotsButton"
                  >
                    <img
                      width="16px"
                      src={require("../images/trailit_dotsPink.png")}
                      alt="dots"
                    />
                  </button>
              }
              {this.state.showMenu && (
                <div className={`trailit_dotsMenuList`}>
                  {/* <button type="button">Edit</button> */}
                  <button 
                    type="button"
                    onClick={ (e) => {
                      // Set show state
                      this.setState({ showMenu: false });

                      // Show delete modal
                      this.props.onDeleteModalOpen(result.title, result.trail_data_id);
                    } }
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            {result.mediaType === "image" && (
              <img
                width="16px"
                height="14px"
                src={require("../images/trialit_image.png")}
                alt="dots"
              />
            )}
            {result.mediaType === "video" && (
              <img
                width="18px"
                height="18px"
                src={require("../images/trialit_video.png")}
                alt="dots"
              />
            )}
            {result.mediaType === "text" && (
              <img
                width="16px"
                height="14px"
                src={require("../images/trailit_text.png")}
                alt="dots"
              />
            )}
            {result.mediaType === "audio" && (
              <img
                width="18px"
                height="18px"
                src={require("../images/trailit_audio.png")}
                alt="dots"
              />
            )}
          </div>
        </div>
        {subStep && <div
          key={i}
          className={`trailitStepBox trailitSubStepBox ${
            tourStep === i + 1 ? "active" : ""} ${this.state.showMenu ? "z-index-2" : "" 
          }`}
        >
          <DragHandle />
          <div className="trailitStepTitle">
            Step {i + 1} - {result.title}
          </div>
          {/* <div>
            <button
              type="button"
              onClick={this.handleClickMenu}
              className="trailit_dotsButton"
            >
              <img
                width="16px"
                src={require("../images/trailit_dotsPink.png")}
                alt="dots"
              />
            </button>
            {this.state.showMenu && (
              <div className={`trailit_dotsMenuList`}>
                <button type="button">Edit</button>
                <button type="button">Delete</button>
              </div>
            )}
          </div> */}
        </div>}
        {subStepStatus && tourType=='Make Edit' && <div className="trailitAddSubStep">
          <button type="button" onClick={(e) => this.onClickToAddSubMenu(e, result, (i + 1))}>
            <img
              width="10px"
              src={require("../images/imgpsh_fullsize_anim.png")}
              alt="..."
            />
            Substep
          </button>
        </div>}
      </div>
    );
  }
}

export default sortableElement(SortableItem);

/**
 * Draggable sort list
 */
export const SortableContainer = sortableContainer(({ children }) => {
  return <div>{children}</div>;
});
