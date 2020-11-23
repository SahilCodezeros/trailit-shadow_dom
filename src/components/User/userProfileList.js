import React, { Component } from 'react';
import BgImage from '../../images/trailit_bx_img.png'
import $ from 'jquery';
import { getUserOneTrail } from '../../common/axios';
import _ from 'lodash';

const chrome = window.chrome;

const resizeScreen = () => {
    return window.innerWidth <= 760;
}

class UserProfileList extends Component {

    constructor(props) {
        super(props);
        this.state = {
            showMenu: false,
            isLoading: this.props.isLoading,
            list: this.props.list,
            isLoadingLink: false,
            isCopiedLink: false,
            isCopiedError: false            
        }
    }

    styleBgImg = {
		background: `url(${BgImage}) no-repeat scroll center center / cover`
	};

    async componentWillReceiveProps(nextProps, prevState) {
        const { addRaw, getOneEditRow } = nextProps;

        let list = await nextProps.list;
        if(!_.isEmpty(addRaw)) {
            let findRow = await list.find(r => r.trail_id==addRaw.trail_id);
            if(findRow==undefined) {
                list.push(addRaw);
            }
        }

        if(!_.isEmpty(getOneEditRow)) {
            let findInd = await list.findIndex(r => r.trail_id==getOneEditRow.trail_id);
            if(findInd!=-1) {
                list[findInd] = getOneEditRow;
            }
        }
        
        this.setState({isLoading: nextProps.isLoading, list: list});
    }

    onClickToEdit = (e, res) => {
        e.stopPropagation();
        $('body').attr('class', 'trailit_EditTrailShow');
        this.props.getRow(res);
        this.props.onEdit(true);
        this.setState({showMenu: false});
    }

    handleClickMenu = (e) => {
        e.stopPropagation();
        this.setState({showMenu: !this.state.showMenu});
    }
    
    onMouseLeave = (e) => {
        if (this.state.showMenu) {
            // Set show menu state
            this.setState({showMenu: false});
        }
    }
    
    onPublishLink = async (e, res) => {
        e.stopPropagation();
        this.setState({isLoadingLink: true});
        let screen = resizeScreen()?'mobile':'web';
        let result = await getUserOneTrail(res.user_id, res.trail_id, screen);
        if(result.status == 200) {
            if(result.data.response.statusCode == 200) {
                let trailList = result.data.response.result
                if(result.data.response.result.length > 0) {
                    const trailId = res.trail_id;
                    const URL = trailList[0].url;
                    let qryString = URL.split("?").length>1?"&":"?";
                    const trailUrl = `http://go.trialit.co/live/${URL}${qryString}trailUserId=${res.user_id}&trailId=${trailId}&trailPreview=true&tourStep=1`;
                    
                    function copyStringToClipboard (str) {
                        // Create new element
                        var el = document.createElement('textarea');
                        
                        // Set value (string to be copied)
                        el.value = str;

                        // Set non-editable to avoid focus and move outside of view
                        el.setAttribute('readonly', '');
                        el.style = {position: 'absolute', left: '-9999px'};
                        document.body.appendChild(el);

                        // Select text inside element
                        el.select();
                        
                        // Copy text to clipboard
                        document.execCommand('copy');

                        // Remove temporary element
                        document.body.removeChild(el);
                    };
                    
                    this.setState({isCopiedLink: true});

                    setTimeout(() => {
                        this.setState({isCopiedLink: false});
                    }, 2000);

                    copyStringToClipboard(trailUrl);
                } else {
                    this.setState({isCopiedError: true});

                    setTimeout(() => {
                        this.setState({isCopiedError: false});
                    }, 2000);
                }
            }
        }
        this.setState({isLoadingLink: false});
    }

    onBoxClick = (e, res) => {
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
            trail_id: res.trail_id,
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

        window.close();
	}
    
    render() {
        
        const { isLoadingLink, isCopiedLink, isCopiedError, isLoading, list } = this.state;
        const { profileImage } = this.props;
        
        return (
            <div className="trailit_userPanalContentInnerBox">
                {isLoadingLink && <div className="trailit_loaderBox">
                   <div class="trial_spinner"><img class="ring1" src={require(`../../images/loding1.png`)} /><img class="ring2" src={require(`../../images/loding2.png`)} /></div>
                </div>}
                {isCopiedLink && <div class="trailit_18600 trailit_mb3" style={{color: 'green'}}>Your link successfully copied</div>}
                {isCopiedError && <div class="trailit_18600 trailit_mb3" style={{color: 'red'}}>Please add trails data</div>}
                <div className="trailit_18600 trailit_mb3">{this.props.title}</div>
                <div className="trailit_scrollBoxs">
                    <div className="trailit_Row">
                        {isLoading && <div className="trailit_noData">Loading...</div>}
                        {(list.length === 0 && !isLoading) && <div className="trailit_noData">Data Not Available</div>}
                        {list.map(res => {
                            
                            let styles = "";
                            let stlStatus=false;
                            
                            if(res.cover_image_url!=null && res.cover_image_url!="null" && res.cover_image_url!="" && res.cover_image_url!=undefined) {
                                stlStatus=true;
                                styles = {
                                    background: `url(${res.cover_image_url}) no-repeat scroll center center / cover`
                                };
                            }
                            
                            return (
                                <div className="trailit_col6">
                                    <div className="trailit_bx" onClick={(e) => this.onBoxClick(e, res)} onMouseLeave={this.onMouseLeave}>
                                        <div className="img">
                                        <span className="img_bg" style={stlStatus?styles:this.styleBgImg}>
                                            <div className="trailit_img_content">
                                                <div className="trailit_top">
                                                    <div className="trailit_dotsMenu">
                                                    <button type="button" onClick={this.handleClickMenu} className="trailit_dotsButton">
                                                    <img width="16px" src={require('../../images/dots.svg')} alt="dots"/>
                                                    </button>
                                                    {this.state.showMenu && 
                                                    <div className="trailit_dotsMenuList">
                                                        <button type="button" onClick={(e) => this.onPublishLink(e, res)}>Share</button>
                                                        <button type="button" onClick={(e) => this.onClickToEdit(e, res)}>Edit</button>
                                                        <button type="button">Publish</button>
                                                        <button type="button">Delete</button>
                                                    </div>
                                                    }
                                                    </div>
                                                </div>
                                                <div className="trailit_bottom">
                                                    <div className="trailit_bottom_content d-flex justify-content-between">
                                                        <div className="trailit_10_500_roboto trailit_text_white align-items-center d-flex">
                                                            <img alt="twitter" className="trialit_user" src={profileImage==''?require("../../images/user.png"):profileImage}/>
                                                            <span className="trailit_ml2 trailit_ellipsis_40">{res.trail_name}</span>
                                                        </div>
                                                        <div className="trailit_8_500_roboto trailit_text_white align-items-center d-flex">
                                                            <img alt="twitter" width="11px" src={require("../../images/trailit_coin.png")}/>
                                                            <span className="trailit_ml2">94</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </span>
                                        </div>
                                        <div className="trailit_bx_title">
                                            <div className="trailit_10_500 trailit_ellips_2line">{res.trail_description}</div>
                                        </div>
                                    </div>
                                </div>
                        )})}
                    </div>
                </div>
            </div>
        )
    }
}

export default UserProfileList;