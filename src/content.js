// "static/media/trailit_logo.png": "static/media/trailit_logo.f410e0c0.png"

/*global chrome*/
/* src/content.js */
import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Icon } from 'antd';
import unique from 'unique-selector';
import { arrayMove } from 'react-sortable-hoc';
import root from "react-shadow/styled-components";
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

import $ from 'jquery';
import _, { functionsIn } from 'lodash';
import SortableItem, { SortableContainer } from './components/SortableItem';
import { socket } from './common/socket';
import Tooltip from './components/tooltip';
import VideoTour from './components/videoTour';
import SendTipForm from './common/SendTipForm';
import AudioTour from './components/audioTour';
import WebUserTour from './components/webUserTour';
import { sendTransection } from './code/sendtx';
import { getScrollParent } from './components/common';
import TooltipOverlay from './components/tooltipOverlay';
import { handleFileUpload } from './common/audAndVidCommon';
import { queryParentElement, getUrlVars } from './components/common';
import {
	getTrails,
	getTrailId,
	getAllUser,
	deleteTrail,
	uploadTrails,
	followTrails, 
	arraySorting,
	getFollowTrails, 
	updateTrailFlag,
	getUserOneTrail,
	UpdateTrailData,
	updateNotification,
	getAllNotification,
	unFollowTrailOfUser,
} from './common/axios';
import MySubscription from './components/mySubscription';
import CreateNewTrailModal from './components/CreateNewTrailModal';
import CreateModalComponent from './components/createModalComponent';
import PreviewModalComponent from './components/previewModalComponent';
import './index.css';
import './content.css';

// const { Dragger } = Upload;

// const props = {
// 	name: 'file',
// 	multiple: false,
// 	action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
// 	onChange(info) {
// 	  const { status } = info.file;
// 	  if (status !== 'uploading') {
// 		console.log(info.file, info.fileList);
// 	  }
// 	  if (status === 'done') {
// 		message.success(`${info.file.name} file uploaded successfully.`);
// 	  } else if (status === 'error') {
// 		message.error(`${info.file.name} file upload failed.`);
// 	  }
// 	},
// };

let app
let trailWebUserTour = [];
let allTrails = [];
let preventToggle = false;
let obj = {};
let root1 = 'none';

const resizeScreen = () => {
	return window.innerWidth <= 760;
}

class Main extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			menuOpen: false,
			trail_web_user_tour: [],
			modalSubscription: false,
			modalCreateNewTrailModal: false,
			currentUserId: null,
			followerList: [],
			closeContinue: false
		};
	};

	async componentDidMount() {
		chrome.storage.local.get(['trail_web_user_tour', 'trail_id', 'userData', 'previewUserId', "notification", "saveSort", 'tourStep', 'closeContinue'], async (items) => {
			this.setState({closeContinue: items.closeContinue===undefined?false:items.closeContinue, currentUserId: items.userData._id});
			
			socket.on('connect', () => {
				console.log('Client is connected');
			});

			socket.emit('userId', items.userData._id);
			
			socket.on('notification', (data) => {
				// Get chrome push notification
				this.getNewNotification();

				// Get notifiation data from server when socket notificatin listen
				this.userNotificaion();
			});
			
			// Get notifiation data from server when page load
			this.userNotificaion();
			
			chrome.storage.onChanged.addListener((changes) => {
				if(changes.closeContinue!==undefined) {
					this.setState({closeContinue: changes.closeContinue.newValue});
				}
				
				if(changes.openButton && changes.openButton.newValue === "ManageTrail") {
					this.props.mainToggle();
				}
				
				if ((changes.currentTourType && changes.currentTourType.newValue === '') &&
					(changes.tourStep && changes.tourStep.newValue === '') &&
					(changes.tourType && changes.tourType.newValue === '')
				) {
					chrome.storage.local.get(['trail_web_user_tour', 'userData', 'trail_id', 'previewUserId', "notification", "saveSort", 'tourStep'], async (items) => {
						try {
							// Call common get user data function
							await this.getCurrUserDataCommon(items);							
						} catch (err) {
							console.log(err);
						}
					});
				}
			});

			if (document.URL.includes(`${process.env.REACT_APP_MS4_URL}userTourDataDetail/readTrailit_trail_data_tour/`) && !items.saveSort) {
				
				let previewUserId;
				const url = new URL(document.URL);
				
				// Remove notification
				const data = {
					user_id: items.userData._id,
					updateValue: {
						flag: 'read'
					},
					updated: new Date().getTime()
				};
				
				try {
					const notiRes = await updateNotification(data);
					if (notiRes.data.response && notiRes.data.response.statusCode === '200') {
						// Remove asterisk from trail icon
						chrome.runtime.sendMessage('', { type: 'badgeText', badgeText: ''});
					}
					
					// if (!items.previewUserId) {
					// 	lesockett url = new URL(document.URL);
					// 	const params = new URLSearchParams(url.search.substring(1));
					// 	previewUserId = params.get('user_id');
					// } else {
					// 	previewUserId = items.previewUserId
					// }							
				} catch (err) {
					console.log(err);
				}

				const params = new URLSearchParams(url.search.substring(1));
				previewUserId = params.get('user_id');
				let trailId = params.get('trailId');
				
				// Get trails of preview user from database
				let screen = resizeScreen()?'mobile':'web';
				const res = await getUserOneTrail(previewUserId, trailId, screen);
				const result = res.data;
				
				if (result.response && result.response.statusCode !== 404 && result.response.result.length > 0) {	
					result.response.result.forEach(el => {
						allTrails.push({
							userId: previewUserId,
							trail_data_id: el.trail_data_id,
							url: el.url,
							path: el.path,
							selector: el.selector,
							class: el.class,
							title: el.title,
							description: el.description,
							web_url: el.web_url,
							trail_id: el.trail_id,
							type: el.type,
							uniqueTarget: el.unique_target,
							unique_target_one: el.unique_target_one,
							mobile_media_type: el.mobile_media_type,
							mobile_title: el.mobile_title,
							mobile_description: el.mobile_description,
							mediaType: el.media_type,
							created: el.created
						});
					});

					// if (allTrails.length > 0) {
					// 	allTrails.sort((a, b) => {
					// 		return (+a.created) - (+b.created);
					// 	});
					// }
					
					const data = {
						follower_id: items.userData._id,
						previewUserId
					};
					
					// Get follow data of user from database					
					const followData = await getFollowTrails(data);
					const followRes = followData.data;

					if (
						followRes.response.statusCode !== 404 || 
						followRes.response.result !== 'Trailit follow not found'
					) {			
						const follow = followRes.response.result.count.length > 0 ? true : false;
						
						obj.followingData = { 
							previewUserId, 
							follow
						};

						chrome.storage.local.set({ 
							followData: { 
								previewUserId, 
								follow
							} 
						});
					}

					preventToggle = true;
					trailWebUserTour = allTrails;

					chrome.storage.local.set({ trail_web_user_tour: allTrails, previewUserId });	
					
					this.openMenu('preview', previewUserId);
				}

			} else if (items.userData && (typeof items.previewUserId === 'undefined' || items.previewUserId === '') && !items.saveSort) {
				if (preventToggle) {
					preventToggle = false;
				}
				
				// Call function to get logged in user's data
				await this.getCurrUserDataCommon(items);
			}
		});
		
		chrome.storage.local.get(["trail_web_user_tour", "tourStatus", "tourType", "tourStep", "currentTourType", "loadingCount", "userData"], async function (items) {
			this.setState({ trail_web_user_tour: items.trail_web_user_tour });
			// trailWebUserTour = items.trail_web_user_tour;
			this.setState({menuOpen: true});
			// Store totalTrails number in localStorage
			localStorage.setItem(
				process.env.REACT_APP_LOCALSTORAGE, 
				items.trail_web_user_tour ? this.state.trail_web_user_tour.length : 0
			);
			
			if ((items.currentTourType === 'preview' || items.currentTourType === '') && items.tourType === 'preview' && items.tourStep !== "") {
				chrome.storage.local.set({ openButton: '', tourType: '' });
			}
			
			if (items.tourStep !== "" && items.currentTourType === "preview") {
				if (items.trail_web_user_tour !== undefined) {
					chrome.storage.local.set({ currentTourType: items.trail_web_user_tour[items.tourStep - 1].type });
				}
			}
			
			if ((items.currentTourType === 'tooltip' || items.currentTourType === 'video') && items.tourType === 'preview') {
				// this.props.downToggleButton(true);
				// this.props.downToggleButton(true);
			}

			if (items.trail_web_user_tour !== undefined) {
				this.setState({ trailList: items.trail_web_user_tour })
			}

			if (items.tourStatus !== undefined) {
				this.setState({ tourStatus: items.tourStatus })
			}
		
		}.bind(this));
		
		chrome.runtime.onMessage.addListener(this.onHandleSubscription);
		
		// 	(msg) => {
		// 	console.log("msg", msg.subject);
		// 	if(msg.subject === 'DOMObj') {
		// 		chrome.storage.local.get(["userData"], async function (items) { 
		// 			socket.emit('userId', items.userData._id)
		// 		})
		// 		socket.on('followerList', data => {
		// 			console.log('followerListdata', data);
		// 			let follower = data.map(result => {
						
		// 			})					
		// 		});
		// 		this.onToggleSubscription(true);
		// 	}
		// });
	}

	async getCurrUserDataCommon(items) {
		const user_id = items.userData._id;
		let res, trail_id = items.trail_id;
		
		try {
			// Get user's trails from database
			let screen = resizeScreen() ? 'mobile' : 'web';
			res = await getUserOneTrail(user_id, trail_id, screen);
			trailWebUserTour = items.trail_web_user_tour;			
		} catch (err) {
			console.log('err', err);
		}
		
		// if (items.trail_web_user_tour && items.trail_web_user_tour.length > 0) {
		// 	items.trail_web_user_tour.forEach(el => {
		// 		if (!el.trail_id) {
		// 			allTrails.push(el);
		// 		}
		// 	});
		// }
		
		const result = res.data;
		
		if (result.response && result.response.statusCode !== 404 && result.response.result.length > 0) {
			allTrails = result.response.result.map(el => {
				return {
					userId: user_id,
					trail_data_id: el.trail_data_id,
					url: el.url,
					path: el.path,
					selector: el.selector,
					class: el.class,
					title: el.title,
					description: el.description,
					web_url: el.web_url,
					trail_id: el.trail_id,
					type: el.type,
					uniqueTarget: el.unique_target,
					unique_target_one: el.unique_target_one,
					mobile_media_type: el.mobile_media_type,
					mobile_title: el.mobile_title,
					mobile_description: el.mobile_description,
					mediaType: el.media_type,
					created: el.created,
					sortId: el.trail_sortId ? el.trail_sortId : '',
					flag: el.flag
				};
			});
		} else {
			trailWebUserTour = [];
			allTrails = [];
		}
		
		// if (allTrails.length > 0) {
		// 	allTrails.sort((a, b) => {
		// 		if (a.sortId !== '') {
		// 			return (+a.sortId) - (+b.sortId);
		// 		} else {
		// 			return (+a.created) - (+b.created);
		// 		}
		// 	});
		// }
		
		trailWebUserTour = allTrails;
		obj.trailList = allTrails;
		
		this.setState({trail_web_user_tour: trailWebUserTour})
		chrome.storage.local.set({ 
			trail_web_user_tour: allTrails, 
			tourStep: items.tourStep ? items.tourStep : '',
			trail_id
		});
	};
	
	componentWillUnmount() {
		chrome.storage.local.set({ loadingCount: 0 });
	}
	
	onHandleSubscription = async (msObj) => {
		if(msObj.subject === 'DOMInfo') {
			chrome.storage.local.get(['userData', 'trail_id', 'trail_web_user_tour'], async (items) => {
				await this.getCurrUserDataCommon(items);
			});

			this.setState({menuOpen: true});
		}
		
		chrome.storage.local.get(["closeContinue"], async function (items) {
			// console.log('closeContinuecloseContinue', items.closeContinue)
			
			this.setState({closeContinue: items.closeContinue===undefined?false:items.closeContinue});
		}.bind(this))
		
		if(msObj.subject === 'CreateTrail') {
			this.onToggleCreateNewTrailModal(true);
		}
		
		if(msObj.subject === 'DOMObj') {
			let allUserData = await getAllUser();
			chrome.storage.local.get(["userData"], async function (items) {
				socket.emit('userId', items.userData._id)
			})
			
			socket.on('followerList', (data) => {
				if(allUserData.status === 200) {
					let follower = data.map(result => {
						let findFollower = allUserData.data.data.response.find(r => r._id === result);
						return findFollower.email;
					})	
					this.setState({followerList: follower});
				}
			});
			
			this.onToggleSubscription(true);
		}
	}
	
	// Get all notification of user
	userNotificaion() {
		chrome.storage.local.get(['userData'], async (items) => {
			// Get notification count from database	
			const data = {
				user_id: items.userData._id,
				flag: 'unread'
			};
			
			try {
				const res = await getAllNotification(data);
				
				if (res.data.response && res.data.response.statusCode === '200') {
					// Set count of notification in chrome runtime
					chrome.runtime.sendMessage('', { type: 'budgeText', badgeText: `${res.data.response.result.length}` });
				}			
			} catch (err) {
				console.log(err);
			}
		});
	};
	
	// Get new notification of client from server and send it to chrome notification
	getNewNotification = () => {
		chrome.runtime.sendMessage('', {
			type: 'notification',
			options: {
			title: 'Just wanted to notify you',
			message: 'How great it is!',
			iconUrl: 'https://ca.slack-edge.com/TC9UZTSLX-UC8TZ2210-f65b94665589-48',
			type: 'basic'
			}
		});
		// chrome.runtime.sendMessage('', {
		// 	type: 'notification',
		// 	options: {
		// 		title: 'Trailit',
		// 		message: 'You have got new notification!',
		// 		iconUrl: 'https://ca.slack-edge.com/TC9UZTSLX-UC8TZ2210-f65b94665589-512',
		// 		type: 'basic'
		// 	}
		// });
	}
	
	openMenu = async (type, previewId, closeContinue) => {
		let mainObj = {}, objStatus = true;
		
		if(document.URL.includes("https://twitter.com") && (type === 'video' || type === 'audio')) {
			alert(`You don't have permission to add ${type} in this site`);
			return '';
		} else if (
			(document.URL.includes(`${process.env.REACT_APP_MS4_URL}userTourDataDetail/readTrailit_trail_data_tour/`) && previewId !== '')
				&& 
			(type === 'video'  || type === 'audio' || type === 'tooltip')
		) {
			alert(`You don't have permission to add ${type} in this site`);
			return '';
		}
		
		switch (type) {
			case 'tooltip':
				mainObj.tourType = "tooltip";
				// this.props.toggle();
				this.props.mainToggle(true);
				break;
			case 'Make Edit':
				mainObj.tourType = "Make Edit";
				this.props.mainToggle(true);
				break;
			case 'modal':
				mainObj.tourType = "modal";
				chrome.runtime.sendMessage('', {
					type: 'chromeModal',
					status: true
				});
				this.props.mainToggle(true);
				break;
			case 'video':
				mainObj.tourType = "video";
				// this.props.this.props.mainToggle();
				this.props.mainToggle(true);
				break;
			case 'preview':
				mainObj.tourType = "preview";
				objStatus = false;
				// let { trail_web_user_tour } = this.state;
				chrome.storage.local.get(["trail_web_user_tour", "userData"], async function (items) {
					
					let trail_web_user_tour = items.trail_web_user_tour;
					
					if (trail_web_user_tour && trail_web_user_tour.length > 0) {
						this.setState({trail_web_user_tour: items.trail_web_user_tour});
						let tour = {};
						
						trail_web_user_tour.forEach((el, i) => {
							if (el.flag === "continue") {
								tour = {
									tourStep: i + 1,
									currentTourType: el.type,
									tourType: el.tourType,
									url: el.url
								};
							}
						});
						
						// if (trail_web_user_tour[0].url !== document.URL) {
						// 	chrome.storage.local.set({ 
						// 		openButton: 'CreateTrail', 
						// 		tourStep: tour.tourStep ? tour.tourStep : 1, 
						// 		currentTourType: tour.currentTourType ? tour.currentTourType : trail_web_user_tour[0].type, 
						// 		tourType: tour.tourType ? tour.tourType : 'preview' 
						// 	});
						
						// 	window.location.href = trail_web_user_tour[0].url;
						// } else {
						// 	chrome.storage.local.set({ 
						// 		openButton: 'CreateTrail', 
						// 		tourStep: tour, 
						// 		currentTourType: trail_web_user_tour[0].type, 
						// 		tourType: 'preview' 
						// 	});

						// 	// window.location.href = trail_web_user_tour[0].url;
						// }

						if(tour.url) {
							if(closeContinue!==undefined) {
								let tourTData = trail_web_user_tour[trail_web_user_tour.length === tour.tourStep ? 0 : tour.tourStep];
								tour = {
									tourStep: trail_web_user_tour.length === tour.tourStep ? 1 : tour.tourStep + 1,
									currentTourType: tourTData.type,
									tourType: 'preview',
									url: tourTData.url
								};
							}
						}
									
						chrome.storage.local.set({
							openButton: 'CreateTrail', 
							tourStep: tour.tourStep ? tour.tourStep : 1, 
							currentTourType: tour.currentTourType ? tour.currentTourType : trail_web_user_tour[0].type, 
							tourType: tour.tourType ? tour.tourType : 'preview' 
						});

						if (tour.url && tour.url !== document.URL && (closeContinue!==undefined || closeContinue===undefined)) {
							
							// Set loading state to false
							chrome.storage.local.set({ loading: 'true' });
						
							document.location.href = tour.url;
							// chrome.tabs.getCurrent(function (tab) {
							// 	chrome.tabs.update(tab.id, { url: tour.url });
							// });
						} else if (!tour.url && trail_web_user_tour[0].url !== document.URL && (closeContinue !== undefined || closeContinue === undefined)) {
							// Set loading state to false
							chrome.storage.local.set({ loading: 'true' });
						
							document.location.href = trail_web_user_tour[0].url;
							// chrome.tabs.getCurrent(function (tab) {
							// 	chrome.tabs.update(tab.id, { url: trail_web_user_tour[0].url });
							// });
							
							// } else if(tour.url && tour.url !== document.URL && closeContinue===undefined) {
							// 	console.log('url 3333');

							// 	// Set loading state to false
							// 	chrome.storage.local.set({ loading: 'true' });

							// 	document.location.href = tour.url;
							// 	// chrome.tabs.getCurrent(function (tab) {
							// 	// 	chrome.tabs.update(tab.id, { url: tour.url });
							// 	// });

						} else if (!tour.url && trail_web_user_tour[0].url === document.URL && (closeContinue !== undefined || closeContinue === undefined)) {
							
							// Set loading state to false
							chrome.storage.local.set({ loading: 'false' });
							
						} else if (tour.url && tour.url === document.URL && (closeContinue !== undefined || closeContinue === undefined)) {							
							// Set loading state to false
							chrome.storage.local.set({ loading: 'false' });
						}
					} else {
						if(trail_web_user_tour && trail_web_user_tour.length > 0) {
							chrome.storage.local.set({ openButton: 'CreateTrail', tourStep: 1, currentTourType: 'preview' });
						} else {
							alert("There are no any trails, Please create the trails");
						}
					}
					if (!preventToggle && trail_web_user_tour && trail_web_user_tour.length > 0) {
						this.props.onChangeTourType(mainObj.tourType);
						this.props.mainToggle(true);
					}
				}.bind(this));
				
				// this.setState({ trail_web_user_tour: trailWebUserTour });

				break;
			case '':
				this.setState({ menuOpen: !this.state.menuOpen });
				break;
			case 'audio':
				mainObj.tourType = "audio";
				// this.props.toggle();
				this.props.mainToggle(true);
				break;
			default:
				break;
		}
		
		if (mainObj.tourType && objStatus) {
			chrome.storage.local.set({ openButton: 'CreateTrail', tourType: mainObj.tourType === undefined ? '' : mainObj.tourType, currentTourType: 'preview' });
		}
		
		if(mainObj.tourType !== 'preview') {
			this.props.onChangeTourType(mainObj.tourType);
		} else {
			
		}
	};
	
	onToggleSubscription = (modalSubscription) => {
		this.setState({modalSubscription});
	}
	
	onToggleCreateNewTrailModal = (modalCreateNewTrailModal) => {
		this.setState({modalCreateNewTrailModal});
	}
	
	onContinueTour = (e) => {
		this.openMenu('preview', '', 'closeContinue');
	}
	
	// Copy Web app link
	copyWebApplink = (e) => {
		const { currentUserId } = this.state;
		chrome.storage.local.get(['trail_web_user_tour', 'userData', 'previewUserId', "notification", "saveSort", 'tourStep', 'closeContinue'], async (items) => {
			if(items.trail_web_user_tour!=undefined && items.trail_web_user_tour.length == 0) {
				alert("Please create trail");
				return null;
			}
			
			let trail_web_user_tour = items.trail_web_user_tour;
			
			const trailId = trail_web_user_tour[0].trail_id;
			const URL = trail_web_user_tour[0].url;
			let qryString = URL.split("?").length>1?"&":"?";
			const trailUrl = `http://go.trialit.co/live/${URL}${qryString}trailUserId=${currentUserId}&trailId=${trailId}&trailPreview=true&tourStep=1`
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
			
			alert("Successfully copied");
			copyStringToClipboard(trailUrl);
		})
	}
	
	render() {

			const { menuOpen, modalSubscription, modalCreateNewTrailModal, followerList, closeContinue } = this.state;

			return (
				<div id="my-extension-root">
					<div className={'my-extension'}>
						{closeContinue && <button className="trail_continue_btn" onClick={this.onContinueTour}>Continue...</button>}
						<MySubscription open={modalSubscription} toggle={this.onToggleSubscription} followerList={followerList}/>
						<CreateNewTrailModal open={modalCreateNewTrailModal} toggle={this.onToggleCreateNewTrailModal} followerList={followerList}/>
						
						<div className={`wrap ${menuOpen ? 'open' : ''}`}>
							<button className="blob" onClick={e => this.openMenu('preview')} data-title="Preview">
								<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
									<g id="Group_471" data-name="Group 471" transform="translate(11703 4613)">
										<circle id="Ellipse_101" data-name="Ellipse 101" cx="24" cy="24" r="24" transform="translate(-11703 -4613)" fill="#fff" />
										<g id="visibility" transform="translate(-11694 -4688.449)">
											<g id="Group_278" data-name="Group 278" transform="translate(0 90.449)">
												<g id="Group_277" data-name="Group 277" transform="translate(0)">
													<path id="Path_103" data-name="Path 103" d="M28.032,98.985c-2.049-5.106-7.668-8.536-13.983-8.536S2.116,93.879.066,98.985a.915.915,0,0,0,0,.682c2.051,5.105,7.671,8.535,13.983,8.535s11.931-3.43,13.983-8.535A.915.915,0,0,0,28.032,98.985Zm-13.983,7.387c-5.428,0-10.253-2.817-12.141-7.047,1.886-4.23,6.711-7.046,12.141-7.046S24.3,95.1,26.19,99.325C24.3,103.555,19.477,106.372,14.049,106.372Z" transform="translate(0 -90.449)" fill="#fb542b" className="svg_btn" stroke="#fff" stroke-width="0.5" />
												</g>
											</g>
											<g id="Group_280" data-name="Group 280" transform="translate(8.66 93.987)">
												<g id="Group_279" data-name="Group 279" transform="translate(0 0)">
													<path id="Path_104" data-name="Path 104" d="M156.762,152.32a5.338,5.338,0,1,0,5.338,5.338A5.344,5.344,0,0,0,156.762,152.32Zm0,8.846a3.508,3.508,0,1,1,3.508-3.508A3.512,3.512,0,0,1,156.762,161.166Z" transform="translate(-151.424 -152.32)" fill="#fb542b" className="svg_btn" stroke="#fff" stroke-width="0.5" />
												</g>
											</g>
										</g>
									</g>
								</svg>
								{/* <span>Preview</span> */}
							</button>
							<button class="blob" onClick={e => this.openMenu('tooltip')} data-title="Create Tool Tip">
								<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
									<g id="Group_471" data-name="Group 471" transform="translate(11703 4613)">
										<circle id="Ellipse_101" data-name="Ellipse 101" cx="24" cy="24" r="24" transform="translate(-11703 -4613)" fill="#fff" />
										<g id="drawing-tablet" transform="translate(-11693.5 -4603)">
											<path id="Path_105" data-name="Path 105" d="M293.045,393.1a.549.549,0,1,0-.549-.549A.549.549,0,0,0,293.045,393.1Zm0,0" transform="translate(-275.972 -370.488)" fill="#fb542b" className="svg_btn2" stroke="#fb542b" stroke-width="0.25" />
											<path id="Path_107" data-name="Path 107" d="M25.853,6.147H24.348l2.4-2.4a2.195,2.195,0,1,0-3.1-3.1l-5.5,5.5H3.244A2.747,2.747,0,0,0,.5,8.89V25.354A2.747,2.747,0,0,0,3.244,28.1h22.61A2.747,2.747,0,0,0,28.6,25.354V8.89a2.747,2.747,0,0,0-2.744-2.744ZM13.314,12.77a1.652,1.652,0,0,1,.4-.643l.022-.022,1.552,1.552-.022.022a1.655,1.655,0,0,1-.644.4l-1.959.653Zm-.379-1.42a2.754,2.754,0,0,0-.663,1.073l-.956,2.868-.709.662a.549.549,0,1,0,.748.8l.724-.675,2.887-.963a2.755,2.755,0,0,0,1.073-.663l3.917-3.918h4.249V23.708H7.085V10.537h6.664Zm3.126,1.53-1.552-1.552,8.357-8.357,1.552,1.552ZM24.419,1.419a1.1,1.1,0,0,1,1.552,1.552l-.776.776L23.643,2.2ZM27.5,25.354A1.648,1.648,0,0,1,25.853,27H3.244A1.648,1.648,0,0,1,1.6,25.354V8.89A1.648,1.648,0,0,1,3.244,7.244h13.8l-2.2,2.195H6.536a.549.549,0,0,0-.549.549V24.256a.549.549,0,0,0,.549.549h18.22a.549.549,0,0,0,.549-.549V9.988a.549.549,0,0,0-.549-.549h-3.7l2.2-2.195h2.6A1.648,1.648,0,0,1,27.5,8.89Zm0,0" transform="translate(0 0)" fill="#fb542b" className="svg_btn2" stroke="#fb542b" stroke-width="0.25" />
											<path id="Path_108" data-name="Path 108" d="M333.041,317.492h3.293a.549.549,0,0,0,.549-.549v-4.39a.549.549,0,1,0-1.1,0v3.841h-2.744a.549.549,0,0,0,0,1.1Zm0,0" transform="translate(-313.773 -294.882)" fill="#fb542b" className="svg_btn2" stroke="#fb542b" stroke-width="0.25" />
										</g>
									</g>
								</svg>
								{/* <span>Create Tool Tip</span> */}
							</button>
							<button class="blob" onClick={e => this.openMenu('modal')} data-title="Create Modal">
								<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
									<g id="Group_471" data-name="Group 471" transform="translate(11703 4613)">
										<circle id="Ellipse_101" data-name="Ellipse 101" cx="24" cy="24" r="24" transform="translate(-11703 -4613)" fill="#fff"/>
										<g id="interface" transform="translate(-11693 -4602)">
										<path className="svg_btn" id="Path_1" data-name="Path 1" d="M0,6.186V25.2H27.657V1H0ZM24.2,2.729h1.729V4.457H24.2ZM1.729,6.186h24.2V23.471H1.729Z" fill="#fb542b"/>
										<path className="svg_btn" id="Path_2" data-name="Path 2" d="M3,6H6.457V7.729H3Z" transform="translate(2.186 3.643)" fill="#fb542b"/>
										<path className="svg_btn" id="Path_3" data-name="Path 3" d="M6,6H18.1V7.729H6Z" transform="translate(4.371 3.643)" fill="#fb542b"/>
										<path className="svg_btn" id="Path_4" data-name="Path 4" d="M3,8H6.457V9.729H3Z" transform="translate(2.186 5.1)" fill="#fb542b"/>
										<path className="svg_btn" id="Path_5" data-name="Path 5" d="M6,8H18.1V9.729H6Z" transform="translate(4.371 5.1)" fill="#fb542b"/>
										<path className="svg_btn" id="Path_6" data-name="Path 6" d="M3,10H6.457v1.729H3Z" transform="translate(2.186 6.557)" fill="#fb542b"/>
										<path className="svg_btn" id="Path_7" data-name="Path 7" d="M6,10H18.1v1.729H6Z" transform="translate(4.371 6.557)" fill="#fb542b"/>
										</g>
									</g>
								</svg>

								{/* <span>Create Modal</span> */}
							</button>
							<button className="menu" onClick={(e) => this.openMenu("")}>
								<img className="trail_plus"
									alt=""
									src={require('./images/imgpsh_fullsize_anim.png')}
								/>
								<img className="trail_edit" src={require(`./images/edit-tools.png`)}/>
							</button>
							{!document.URL.includes("https://twitter.com") && <React.Fragment>
								<button className="blob" onClick={(e) => this.openMenu('video')} data-title="Create Video">
									<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
										<g id="Group_472" data-name="Group 472" transform="translate(-1820 -597)">
											<circle id="Ellipse_101" data-name="Ellipse 70" cx="24" cy="24" r="24" transform="translate(1820 597)" fill="#fff" />
											<g id="video-camera-side-view-outlined-tool-symbol" transform="translate(1832 502.041)">
												<g id="Group_281" data-name="Group 281" transform="translate(0 111.272)">
													<path id="Path_109" data-name="Path 109" d="M15.317,126.681a2.156,2.156,0,0,0,2.2-2.2V113.473a2.156,2.156,0,0,0-2.2-2.2H2.2a2.156,2.156,0,0,0-2.2,2.2V124.48a2.156,2.156,0,0,0,2.2,2.2ZM1.1,124.459V113.493a1.092,1.092,0,0,1,1.113-1.12H15.431a1.092,1.092,0,0,1,1.113,1.12v10.966a1.093,1.093,0,0,1-1.113,1.122H2.213A1.093,1.093,0,0,1,1.1,124.459Z" transform="translate(0 -111.272)" fill="#fb542b" className="svg_btn2" stroke="#fb542b" stroke-width="0.2" />
													<path id="Path_110" data-name="Path 110" d="M475.162,121.072v1.348l5.414,4.261V111.272l-5.414,4.3v1.379l4.313-3.236v10.592Z" transform="translate(-456.362 -111.272)" fill="#fb542b" className="svg_btn2" stroke="#fb542b" stroke-width="0.2" />
												</g>
											</g>
										</g>
									</svg>
										{/* <span>Create Video</span> */}
								</button>
								<button className="blob" onClick={e => this.openMenu('audio')} data-title="Create Audio">
									<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
										<g id="Group_471" data-name="Group 471" transform="translate(11717 4613)">
											<circle id="Ellipse_101" data-name="Ellipse 101" cx="24" cy="24" r="24" transform="translate(-11717 -4613)" fill="#fff" />
											<g id="audio-interface-speaker-symbol" transform="translate(-11707 -4671.857)">
												<g id="Group_282" data-name="Group 282" transform="translate(0 72.857)">
													<path stroke-width="0" id="Path_111" data-name="Path 111" d="M3.9,86.838l9.831,5.992V72.857L3.9,78.849H1.3A1.3,1.3,0,0,0,0,80.181v5.327A1.3,1.3,0,0,0,1.3,86.84H3.9ZM1.248,80.1H3.9l8.586-4.746v14.98L3.9,85.486H1.248Z" transform="translate(0 -72.857)" fill="#fb542b" className="svg_btn" />
													<path stroke-width="0" id="Path_112" data-name="Path 112" d="M349.714,171.382v1.387a7.074,7.074,0,0,0,0-12.483v1.387s2.5,1.059,2.5,4.855S349.714,171.382,349.714,171.382Z" transform="translate(-334.734 -156.541)" fill="#fb542b" className="svg_btn" />
													<path stroke-width="0" id="Path_113" data-name="Path 113" d="M524.571,117.829v1.648s3.745-1.8,3.745-8.738S524.571,102,524.571,102v1.62s2.5,1.378,2.5,7.118S524.571,117.829,524.571,117.829Z" transform="translate(-502.101 -100.752)" className="svg_btn" fill="#fb542b" />
													<path stroke-width="0" id="Path_114" data-name="Path 114" d="M437.143,144.543v1.58s3.745-2.06,3.745-7.49-3.745-7.49-3.745-7.49v1.528s2.5,1.624,2.5,5.962S437.143,144.543,437.143,144.543Z" transform="translate(-418.418 -128.647)" className="svg_btn" fill="#fb542b" />
												</g>
											</g>
										</g>
									</svg>
									{/* <span>Create Audio</span> */}
								</button>
							</React.Fragment>}
							{/* <button className="blob" onClick={e => this.openMenu('saved')} data-title="Edit Trail">
							<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
							<g id="Group_471" data-name="Group 471" transform="translate(11697 4613)">
								<circle id="Ellipse_101" data-name="Ellipse 101" cx="24" cy="24" r="24" transform="translate(-11697 -4613)" fill="#fff"/>
								<g id="edit" transform="translate(-11683.37 -4600.589)">
								<path id="Path_1" className="svg_btn2" data-name="Path 1" d="M18.7,49.861a.5.5,0,0,0-.5.5v4.481a1.515,1.515,0,0,1-1.514,1.514H2.523a1.515,1.515,0,0,1-1.514-1.514V41.7a1.516,1.516,0,0,1,1.514-1.514H7a.5.5,0,0,0,0-1.009H2.523A2.526,2.526,0,0,0,0,41.7V54.846A2.526,2.526,0,0,0,2.523,57.37h14.16a2.526,2.526,0,0,0,2.523-2.523V50.365a.5.5,0,0,0-.5-.5Zm0,0" transform="translate(0 -36.948)" fill="#fb542b"/>
								<path id="Path_2" className="svg_btn2" data-name="Path 2" d="M121.737.926a2.271,2.271,0,0,0-3.212,0l-9,9a.5.5,0,0,0-.13.222l-1.184,4.274a.5.5,0,0,0,.621.621l4.274-1.184a.5.5,0,0,0,.222-.13l9-9a2.273,2.273,0,0,0,0-3.212Zm-11.115,9.331,7.369-7.369,2.376,2.376L113,12.634Zm-.475.953,1.9,1.9-2.626.728Zm11.469-7.194-.535.535L118.7,2.175l.535-.535a1.262,1.262,0,0,1,1.784,0l.592.592A1.263,1.263,0,0,1,121.616,4.016Zm0,0" transform="translate(-102.73)" fill="#fb542b"/>
								</g>
							</g>
							</svg>
								
							</button> */}
							{resizeScreen() && <button className="blob" onClick={e => this.openMenu('Make Edit')} data-title="Make Edit Trail">
								<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
									<g id="Group_471" data-name="Group 471" transform="translate(11697 4613)">
										<circle id="Ellipse_101" data-name="Ellipse 101" cx="24" cy="24" r="24" transform="translate(-11697 -4613)" fill="#fff"/>
										<g id="signs" transform="translate(-11683 -4599)">
											<path id="Path_1" className="svg_btn2" data-name="Path 1" d="M10.143,20.286A10.143,10.143,0,1,1,20.286,10.143,10.154,10.154,0,0,1,10.143,20.286Zm0-19.018a8.875,8.875,0,1,0,8.875,8.875A8.885,8.885,0,0,0,10.143,1.268Zm0,0" fill="#fb542b"/>
											<path id="Path_2" className="svg_btn2" data-name="Path 2" d="M137.509,241.268h-8.875a.634.634,0,0,1,0-1.268h8.875a.634.634,0,1,1,0,1.268Zm0,0" transform="translate(-122.929 -230.491)" fill="#fb542b"/>
											<path id="Path_3" className="svg_btn2" data-name="Path 3" d="M240.634,138.143a.634.634,0,0,1-.634-.634v-8.875a.634.634,0,1,1,1.268,0v8.875A.634.634,0,0,1,240.634,138.143Zm0,0" transform="translate(-230.491 -122.929)" fill="#fb542b"/>
										</g>
									</g>
								</svg>
							</button>}
							<button className="blob" onClick={e => this.openMenu('Make Edit')} data-title="Edit Trail">
								<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
									<g id="Group_471" data-name="Group 471" transform="translate(11697 4613)">
										<circle id="Ellipse_101" data-name="Ellipse 101" cx="24" cy="24" r="24" transform="translate(-11697 -4613)" fill="#fff"/>
										<g id="signs" transform="translate(-11683 -4599)">
											<path id="Path_1" className="svg_btn2" data-name="Path 1" d="M10.143,20.286A10.143,10.143,0,1,1,20.286,10.143,10.154,10.154,0,0,1,10.143,20.286Zm0-19.018a8.875,8.875,0,1,0,8.875,8.875A8.885,8.885,0,0,0,10.143,1.268Zm0,0" fill="#fb542b"/>
											<path id="Path_2" className="svg_btn2" data-name="Path 2" d="M137.509,241.268h-8.875a.634.634,0,0,1,0-1.268h8.875a.634.634,0,1,1,0,1.268Zm0,0" transform="translate(-122.929 -230.491)" fill="#fb542b"/>
											<path id="Path_3" className="svg_btn2" data-name="Path 3" d="M240.634,138.143a.634.634,0,0,1-.634-.634v-8.875a.634.634,0,1,1,1.268,0v8.875A.634.634,0,0,1,240.634,138.143Zm0,0" transform="translate(-230.491 -122.929)" fill="#fb542b"/>
										</g>
									</g>
								</svg>
							</button>
							<button className="blob" onClick={this.copyWebApplink} data-title="Share Trail">
								<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
									<g id="Group_471" data-name="Group 471" transform="translate(11697 4613)">
										<circle id="Ellipse_101" data-name="Ellipse 101" cx="24" cy="24" r="24" transform="translate(-11697 -4613)" fill="#fff"/>
										<g id="signs" transform="translate(-11683 -4599)">
											<path id="Path_1" className="svg_btn2" data-name="Path 1" d="M10.143,20.286A10.143,10.143,0,1,1,20.286,10.143,10.154,10.154,0,0,1,10.143,20.286Zm0-19.018a8.875,8.875,0,1,0,8.875,8.875A8.885,8.885,0,0,0,10.143,1.268Zm0,0" fill="#fb542b"/>
											<path id="Path_2" className="svg_btn2" data-name="Path 2" d="M137.509,241.268h-8.875a.634.634,0,0,1,0-1.268h8.875a.634.634,0,1,1,0,1.268Zm0,0" transform="translate(-122.929 -230.491)" fill="#fb542b"/>
											<path id="Path_3" className="svg_btn2" data-name="Path 3" d="M240.634,138.143a.634.634,0,0,1-.634-.634v-8.875a.634.634,0,1,1,1.268,0v8.875A.634.634,0,0,1,240.634,138.143Zm0,0" transform="translate(-230.491 -122.929)" fill="#fb542b"/>
										</g>
									</g>
								</svg>
							</button>
						</div>
					</div>
				</div>			
			);
	}
}

let popoverCount = 0;

// function getBase64(img, callback) {
// 	const reader = new FileReader();
// 	reader.addEventListener('load', () => callback(reader.result));
// 	reader.readAsDataURL(img);
// }

// function beforeUpload(file) {
// 	const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
// 	if (!isJpgOrPng) {
// 		message.error('You can only upload JPG/PNG file!');
// 	}
// 	const isLt2M = file.size / 1024 / 1024 < 2;
// 	if (!isLt2M) {
// 		message.error('Image must smaller than 2MB!');
// 	}
// 	return isJpgOrPng && isLt2M;
// }

let defaultComp;
let flipped;
let tourUrl;

class DefaultButton extends React.PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			open: false,
			trailList: [],
			tourStatus: 'continue',
			tourType: '',
			tourStep: '',
			currentTourType: '',
			web_url: '',
			tourSide: 'next',
			message: '',
			overlay: false,
			loading: false,
			fileLoading: false,
			fileAddStatus: false,
			title: '',
			currUserId: null,
			follow: false,
			publishButtonShow: false,
			publishLoader: false,
			count: 0,
			saveSort: false,
			fileName: '',
			createModalOpen: false,
			hideNav: false,
			rowData: {},
			MobileTargetNotFound: {},
			deleteModal: {
				show: false,
				title: null,
				id: null
			},
			sendTipModal: false,
			isLoading: false,
			sendLoader: false,
			isSuccess: false,
      		setError: null
		};

		this.onDeleteButtonClick = this.onDeleteButtonClick.bind(this);
	};

	// Hide send tip modal
    onSendTipModalClose = () => {

        // Hide send tip modal
        this.setState({ 
			sendTipModal: false,
			sendLoader: false,
			isLoading: false
		});
    };

    // Show send tip modal
    onSendTipModalOpen = () => {

        // Show send tip modal
        this.setState({ sendTipModal: true });
    };

	// Hide delete modal
    onDeleteModalClose = () => {

        // Delete modal state to false
        this.setState({ deleteModal: {
			show: false,
			title: null,
			id: null
		} });
    };

    // Show delete modal
    onDeleteModalOpen = (title, id) => {
        // Delete modal state to true
        this.setState({ deleteModal: {
			show: true,
			title,
			id
		} });
	};

    // On delete button click
    async onDeleteButtonClick(e) {
		try {
			const { id } = this.state.deleteModal;

			// Delete trail by id
			const { data } = await deleteTrail(id);
			
			if (data.response && data.response.statusCode === '200') {
				chrome.storage.local.get(['userData', 'trail_id', 'trail_web_user_tour'], async (items) => {	
	
					// Call common get user data function
					await this.getCurrUserDataCommon(items);
				});
			}

			// Call on delete modal close to hide modal
			this.onDeleteModalClose();

        } catch (err) {
            console.log(err);
        }
	};
	
	async getCurrUserDataCommon(items) {
		const user_id = items.userData._id;
		let res, trail_id = items.trail_id;
		
		try {
			// Get user's trails from database
			let screen = resizeScreen() ? 'mobile' : 'web';
			res = await getUserOneTrail(user_id, trail_id, screen);
			trailWebUserTour = items.trail_web_user_tour;			
		} catch (err) {
			console.log('err', err);
		}
		
		// if (items.trail_web_user_tour && items.trail_web_user_tour.length > 0) {
		// 	items.trail_web_user_tour.forEach(el => {
		// 		if (!el.trail_id) {
		// 			allTrails.push(el);
		// 		}
		// 	});
		// }
		
		const result = res.data;
		
		if (result.response && result.response.statusCode !== 404 && result.response.result.length > 0) {
			allTrails = result.response.result.map(el => {
				return {
					userId: user_id,
					trail_data_id: el.trail_data_id,
					url: el.url,
					path: el.path,
					selector: el.selector,
					class: el.class,
					title: el.title,
					description: el.description,
					web_url: el.web_url,
					trail_id: el.trail_id,
					type: el.type,
					uniqueTarget: el.unique_target,
					unique_target_one: el.unique_target_one,
					mobile_media_type: el.mobile_media_type,
					mobile_title: el.mobile_title,
					mobile_description: el.mobile_description,
					mediaType: el.media_type,
					created: el.created,
					sortId: el.trail_sortId ? el.trail_sortId : '',
					flag: el.flag
				};
			});
		} else {
			trailWebUserTour = [];
			allTrails = [];
		}
		
		// if (allTrails.length > 0) {
		// 	allTrails.sort((a, b) => {
		// 		if (a.sortId !== '') {
		// 			return (+a.sortId) - (+b.sortId);
		// 		} else {
		// 			return (+a.created) - (+b.created);
		// 		}
		// 	});
		// }
		
		trailWebUserTour = allTrails;
		obj.trailList = allTrails;
		
		this.setState({trail_web_user_tour: trailWebUserTour})
		chrome.storage.local.set({ 
			trail_web_user_tour: allTrails, 
			tourStep: items.tourStep ? items.tourStep : '',
			trail_id
		});
	};

	componentDidMount() {
		// window.onload=function(){
		// 	setTimeout(function(){
		// 		scrollTo(0,-1);
		// 	},0);
		// }
	
		const { currentTourType, tourType } = this.state;
		
		window.addEventListener("resize", this.resize);
		this.resize();
	
		this.setState({overlay: true});
		this.onChromeStorageChange();
		this.onCreateTooltipHandle();
	
		window.addEventListener("load", () => {
			this.setState({overlay: false});
			this.onCreateTooltipHandle();
		}, false);
		
		chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
		chrome.storage.onChanged.addListener((changes) => {
			if((changes.tourType && changes.tourType.newValue === 'preview') || (changes.currentTourType && changes.currentTourType.newValue === 'preview') || (changes.tourStep && changes.tourStep.newValue === 1)) {
				this.onChromeStorageChange();
				this.setState({ overlay: false });

			} else if (
				changes.trail_web_user_tour && 
				(
					changes.trail_web_user_tour.newValue.length > 0 ||
					changes.trail_web_user_tour.newValue.length !== changes.trail_web_user_tour.oldValue.length
				)
			) {
				this.onChromeStorageChange();
				this.setState({ overlay: false });

			}
			//  else if (
			// 	changes.trail_web_user_tour && 
			// 	changes.trail_web_user_tour.newValue.length !== changes.trail_web_user_tour.oldValue.length				
			// ) {
			// 	this.onChromeStorageChange();
			// 	this.setState({ overlay: false });
			// }
	
			if(changes.openButton && changes.openButton.newValue === 'CreateTrail') {
				this.onChromeStorageChange();
			}

			if ((changes.currentTourType && changes.currentTourType.newValue === 'preview') &&
				(changes.tourType && (changes.tourType.newValue === 'audio' || changes.tourType.newValue === 'video'))
			) {
				if(changes.tourType && changes.tourType.newValue === 'tooltip') {
					this.setState({ open: false });
				} else {
					this.setState({ open: true });
				}
			}

			// if (changes.tourStep && changes.tourStep.newValue && changes.tourStep.newValue > 0) {
			// 	// this.setLoadingState(false);

			// 	// Add trailit logo when trail menu open
			// 	this.addTrailitLogo();

			// } else {
			// 	if (changes.currentTourType && changes.currentTourType.newValue === '') {
			// 		// Remove trailit logo function
			// 		this.removeTrailitLogo();					
			// 	}
			// }

			if ((changes.tourType && (
				changes.tourType.newValue === 'tooltip' || 
				changes.tourType.newValue === 'audio' ||
				changes.tourType.newValue === 'video' ||	
				changes.tourType.newValue === 'modal' 
				)) && (changes.tourType && changes.currentTourType.newValue === 'preview') 
			) {
				// this.setLoadingState(false);

				// Add trailit logo when trail menu open
				this.addTrailitLogo();

			} else {
				if (changes.currentTourType && changes.currentTourType.newValue === '') {
					// Remove trailit logo function
					this.removeTrailitLogo();					
				}
			}
		});
		
		// console.log('currentTourType', currentTourType);
		// console.log('tourType', tourType);
		// console.log('tourUrl', tourUrl);

		// if ((
		// 	currentTourType === 'tooltip' || 
		// 	currentTourType === 'audio' || 
		// 	currentTourType === 'video' || 
		// 	currentTourType === 'modal'
		// 	) && tourType === 'preview' && tourUrl
		// ) {
		// 	this.setLoadingState(false);
		// }
	}
	
	onCreateTooltipHandle = () => {
		// to handle border add on mousover event
		// document.querySelector('.a4bIc .gLFyf.gsfi').style.background = 'green';
		document.querySelector('body').addEventListener('mouseover', e => {
			chrome.storage.local.get(["tourStatus", "tourType", "tourStep", "currentTourType", "closeContinue"], function (items) {
				if (items.tourType !== undefined && (this.state.tourType !== items.tourType)) {
					if (items.tourType === 'preview') {
						if (this.state.trailList.length > 0) {
							let tourStape = items.tourStep === '' ? 1 : items.tourStep;
							this.setState({ tourStep: tourStape, tourType: items.tourType, currentTourType: this.state.trailList[tourStape - 1].type })
						} else {
							this.setState({ tourType: items.tourType });
						}
					} else {
						if(items.tourType === 'tooltip') {
							this.setState({ tourType: items.tourType, open: false });
						} else if (items.tourType === 'Make Edit') {
							this.setState({ tourType: items.tourType, open: true });
						} else {
							this.setState({ tourType: items.tourType });
						}
					}
				}
			}.bind(this));

			if (this.state.tourStatus === 'continue' && (this.state.tourType === 'tooltip' || (this.state.tourType === 'Make Edit' && !_.isEmpty(this.state.rowData)))) {
				let parentElement = queryParentElement(e.target, '.sidepanal');
				let parentElement1 = queryParentElement(e.target, '.trail_tooltip');
				let getClass = parentElement == null ? "" : parentElement.getAttribute('class');
				let getClass1 = parentElement1 == null ? "" : parentElement1.getAttribute('class');
				// let root1 = ReactDOM.findDOMNode(this).parentNode.style.display
				
				// if(parentElement == null) {
				// console.log("parentElement1", parentElement1);
				// 	if(e.target.getAttribute('class') === 'ant-popover-inner-content') {
				// 		$(e.target).parent().attr("class", "trail_tooltip")
				// 	}
				// }

				if (root1 === 'block' && getClass === "" && getClass1 === "") {
					e.target.classList.add('trail_select_bx');
				}
			}
		});
		
		// to handle on click event to add tooltip
		document.querySelector('body').addEventListener('click', e => {
			e.target.classList.remove('trail_select_bx');
			let uniqueTarget = $.trim(unique(e.target));
			
			if (this.state.tourStatus === 'continue' && (this.state.tourType === 'tooltip' || this.state.tourType === 'Make Edit')) {
				if(this.state.tourType === 'tooltip' || (this.state.tourType === 'Make Edit' && !_.isEmpty(this.state.rowData))){
					let parentElement = queryParentElement(e.target, '.sidepanal');
					let parentElement1 = queryParentElement(e.target, '.trail_tooltip');
					let getClass = parentElement == null ? "" : parentElement.getAttribute('class');
					let getClass1 = parentElement1 == null ? "" : parentElement1.getAttribute('class');
					let getClass2 = $(".trail_overlay").attr('class');
					// let root1 = ReactDOM.findDOMNode(this).parentNode.style.display;
					
					if (root1 === 'block' && getClass === "" && getClass1 === "" && getClass2 === undefined) {
						e.preventDefault();
						e.stopPropagation();
						e.target.classList.add('trail_web_user');
						e.target.classList.add('trail_tour_tooltip');
						let original = document.querySelector(uniqueTarget);
						let bounding = original.getBoundingClientRect();
						let offset = $(uniqueTarget).offset();
						let leftPosition = offset.left;
						let topPosition = offset.top;
						var docHeight = document.documentElement.scrollHeight;
						$(".trail_tour_tooltip").prepend("<span class='trail_user_tooltip trail_tour_ToolTipExtend'></span>");
						let node = document.querySelector(".trail_user_tooltip");
						
						let elementIndex = Array.from(e.target.parentElement.children).indexOf(e.target);
						
						$('body').append("<div class='trail_overlay'></div>");
						let bodyElement = $(unique(getScrollParent(document.querySelector(uniqueTarget)))).scrollHeight;
						$(".trail_overlay").append(`
							<svg height="100%" width="100%">
								<polygon points="0,0 ${window.innerWidth},0 ${window.innerWidth},${docHeight} 0,${docHeight} 0,${topPosition + bounding.height + 10} ${leftPosition + bounding.width + 10},${topPosition + bounding.height + 10} ${leftPosition + bounding.width + 10},${topPosition - 10} ${leftPosition - 10},${topPosition - 10} ${leftPosition - 10},${topPosition + bounding.height + 10} 0,${topPosition + bounding.height + 10}" style="fill:rgba(0,0,0,0.8);"/>
								Sorry, your browser does not support inline SVG.
							</svg>`
						);
						
						document.querySelector("body").classList.add('trail_body');
						$(".trail_overlay")
							.height(docHeight)
							.css({
								'position': 'absolute',
								'top': 0,
								'left': 0,
								'width': '100%',
								'z-index': 99999999
							});
							
						ReactDOM.render(
							<Tooltip 
								uniqueTarget={uniqueTarget} 
								target={e.target} 
								elementIndex={elementIndex} 
								path={e.path}
								type={this.state.tourType}
								rowData={this.state.rowData} 
								count={popoverCount}
								onSave={this.state.tourType === 'Make Edit'?this.onUpdateTrail:this.onSaveTrail} 
								onCancel={this.onCancelTooltip} 
								onHandleChange={ this.handleChange }	
							/>, node
						);
						popoverCount++;
					}
				}
			}
		}, true);
		
		// to handle border remove on mousout event
		document.querySelector('body').addEventListener('mouseout', e => {
			e.preventDefault();
			if (this.state.tourStatus === 'continue' && (this.state.tourType === 'tooltip' || this.state.tourType === 'Make Edit')) {
				let parentElement = queryParentElement(e.target, '.sidepanal');
				let parentElement1 = queryParentElement(e.target, '.trail_tooltip');
				let getClass = parentElement == null ? "" : parentElement.getAttribute('class');
				let getClass1 = parentElement1 == null ? "" : parentElement1.getAttribute('class');
				// let root1 = ReactDOM.findDOMNode(this).parentNode.style.display;
				if (root1 === 'block' && getClass === "" && getClass1 === "") {
					e.target.classList.remove('trail_select_bx');
				}
			}
		});
	}
	
	resize = () => {
		this.setState({hideNav: window.innerWidth <= 760});
	}
	
	onNotFoundTarget = (data) => {
		this.setState({ MobileTargetNotFound: data });
		chrome.storage.local.set({ MobileTargetNotFound: data });
	}

	onChromeStorageChange = () => {
		chrome.storage.local.get(["trail_web_user_tour", "tourStatus", "tourType", "tourStep", "currentTourType", "userData", "previewUserId", 'followData', 'saveSort', 'loading', 'MobileTargetNotFound'], async function (items) {
			if (items.followData) {
				obj.followingData = items.followData;
			}

			if (items.previewUserId && items.previewUserId !== '') {
				obj.previewUserId = items.previewUserId;
			} else {
				obj.previewUserId = undefined;
			}
			
			if (items.trail_web_user_tour) {
				obj.trailList = items.trail_web_user_tour;
			}

			if (items.tourStatus !== undefined) {
				obj.tourStatus = items.tourStatus;
			}

			if (items.tourType !== undefined) {
				obj.tourType = items.tourType;
				// if(items.tourType === 'modal') {
				// 	this.onToggleCreateModal(true);
					
				// }
			}

			if (items.currentTourType !== undefined) {
				obj.currentTourType = items.currentTourType;
				// if (obj.currentTourType == 'tooltip' || obj.currentTourType == 'video' || obj.currentTourType == 'audio') {
			}
			
			if (items.currentTourType === 'tooltip' || items.tourType === 'tooltip') {
				this.setState({ open: false });
			}
			
			if(items.currentTourType === 'Make Edit' || items.tourType === 'Make Edit') {
				console.log("tourType", items.currentTourType, items.tourType);
				this.setState({ open: true });
			}
			
			if(items.MobileTargetNotFound!=undefined && !_.isEmpty(items.MobileTargetNotFound)) {
				this.setState({MobileTargetNotFound: items.MobileTargetNotFound});
			} else {
				this.setState({MobileTargetNotFound: {}});
			}
			
			if (items.tourStep !== undefined) {
				obj.tourStep = items.tourStep;
			}
				
			if (items.userData._id !== undefined) {
				obj.currUserId = items.userData._id;
			}
			
			if ((obj.currentTourType === 'video' || obj.currentTourType === 'audio') && obj.tourType === 'preview') {
				let myExtensionDefaultroot = $('#my-extension-defaultroot').css('display');
				let myExtensionRoot = $('#my-extension-root').css('display');
				
				if (myExtensionRoot === 'none' && myExtensionDefaultroot === 'none') {					
					if (obj.trailList[obj.tourStep - 1].url === document.URL) {
						$('#my-extension-defaultroot').css('display', 'block')
					}
				}
			}

			if (items.loading !== undefined && items.loading === 'false') {
				obj.loading = false;
			}

			if (items.loading !== undefined && items.loading === 'true') {
				obj.loading = true;
			}
			
			this.setState({
				trailList: obj.trailList ? obj.trailList : [],
				tourStatus: obj.tourStatus ? obj.tourStatus : 'continue',
				tourType: obj.tourType ? obj.tourType : '',
				currentTourType: obj.currentTourType ? obj.currentTourType : '',
				tourStep: obj.tourStep ? obj.tourStep : '',
				currUserId: obj.currUserId ? obj.currUserId : null,
				follow: obj.followingData ? obj.followingData.follow : false,
				count: this.state.count++,
				saveSort: items.saveSort ? items.saveSort : false,
				loading: obj.loading ? obj.loading : false
				// publishButtonShow: localStorageCount && +localStorageCount !== trailListCount
			});
			
			// this.setState({...this.state, obj}, () => {
			// 	console.log("this.steete", this.state);
			// });

		}.bind(this));
	}
		
	handleMessage(msg) {
		// Handle received messages
		// if (msg.target === 'app') {
		//  if (msg.type === 'setMessage') {
		if(msg.message === "chrome_modal") {
			this.onToggleCreateModal(true);
		}
		this.setState({ message: msg.body });
		//  }
		// }
	}
	
	componentWillUnmount() {
		// Remove listener when this component unmounts
		window.removeEventListener("resize", this.resize);
		chrome.runtime.onMessage.removeListener(this.handleMessage);
	}
	
	/**
		* on cancel tooltip data
	*/
	onCancelTooltip = (target, count) => {
		$('.trail_tour_tooltip').parents().css('z-index', '');
		target.classList.remove('trail_web_user');
		target.classList.remove(`trail_tour_tooltip`);
		// trail_user_tooltip1
		// trail_tooltip
		// $('.trail_tooltip').remove();
		$('.trail_overlay').remove();
		$(`.trail_user_tooltip`).remove();
		$(`.trail_tour_ToolTipExtend`).remove();
		
		this.props.mainToggle();
		chrome.storage.local.set({ tourType: '', currentTourType: '', tourStep: '' });
		this.setState({ web_url: '', tourType: '', currentTourType: '', tourStep: '', overlay: false, rowData:{} });
		this.props.onChangeTourType('');
	};
	
	/**
	* on click to Update tour
	*/
	onUpdateTrail = async (data) => {
		let res = await UpdateTrailData(data);
		console.log("res", res);
		if(res.status === 200) {
			let resultData = res.data.response[0];
			resultData.uniqueTarget = resultData.unique_target
			resultData.mediaType = resultData.media_type;
			let rowInd = this.state.trailList.findIndex(r => r.trail_data_id == resultData.trail_data_id);
			this.state.trailList[rowInd] = resultData;
			let rows = this.state.trailList;
			chrome.storage.local.set({ trail_web_user_tour: rows });
			this.setState({ trailList: rows });
		}

		// chrome.storage.local.set({ trail_web_user_tour: newDataArray });
		// this.setState({ trailList: newDataArray });
		this.onCancelTooltip();
		// this.setState({ trailList: trailData, web_url: '', fileAddStatus: false, fileName: '' });
	}
	
	/**
	* on click to save tour in local system
	*/
	onSaveTrail = async (data) => {
		let trailData = []
		let obj = {};
		let responsive = 'web';
		chrome.storage.local.get(["trail_web_user_tour", "userData", "trail_id"], function (items) {
			
			const trail_id = items.trail_id;
			if (items.trail_web_user_tour !== undefined) {
				trailData = items.trail_web_user_tour
			}

			let timeStamp = new Date().getTime();
			
			// This if check work on tooltip audio video upload
			if (data.type === 'tooltip' && data.mediaType !== 'text') {
				obj = {
					trail_id,
					userId: items.userData._id,
					url: data.url,
					path: data.path,
					selector: data.selector,
					class: data.class,
					title: data.title,
					web_url: data.web_url,
					type: data.type,
					responsive,
					uniqueTarget: data.uniqueTarget,
					mediaType: data.mediaType,
					created: timeStamp,
					trailIndex: items.trail_web_user_tour.length + 1,
					flag: ''
				};
				
				trailData.push(obj);

			} else if (this.state.tourType === 'video' || this.state.tourType === 'audio') {
				
				obj = {
					trail_id,
					userId: items.userData._id,
					url: document.URL,
					path: '',
					selector: '',
					class: '',
					responsive,
					title: this.state.title,
					web_url: this.state.web_url,
					type: this.state.tourType,
					mediaType: this.state.tourType,
					created: timeStamp,
					trailIndex: items.trail_web_user_tour.length + 1,
					flag: ''
				}
				
				trailData.push(obj);
			} else if(data.type === 'modal' && data.mediaType === 'modal') {

				obj = {
					trail_id,
					userId: items.userData._id,
					url: data.url,
					path: "",
					selector: "",
					class: "",
					responsive,
					title: data.title,
					description: data.description,
					web_url: '',
					type: data.type,
					uniqueTarget: '',
					mediaType: data.mediaType,
					created: timeStamp,
					trailIndex: items.trail_web_user_tour.length + 1,
					flag: ''
				};
				
				trailData.push(obj);
			} else {
				obj = {
					...data,
					trail_id,
					responsive,
					userId: items.userData._id,
					created: timeStamp,
					// web_url: '',
					trailIndex: items.trail_web_user_tour.length + 1,
					flag: ''
				}
				
				trailData.push(obj);
			}
			
			this.setState({ trailList: trailData, web_url: '', fileAddStatus: false, fileName: '' });
			chrome.storage.local.set({ trail_web_user_tour: trailData, tourType: '' });
			
			console.log('onSaveTrail', obj);
			// Save trail into database
			this.publishTrails(obj);

		}.bind(this));
		
		// this.props.this.props,mainToggle();
		this.props.onChangeTourType("");
		this.props.mainToggle();
	}
	
	/**
	* on click to submit tour into the database
	*/
	onClickToSubmitTour = () => {
		chrome.storage.local.set({ tourStatus: 'done' });
		this.setState({ tourStatus: 'done' });
	}
	
	/**
		* on clear tour
	*/
	onClearToggle = async () => {
		chrome.storage.local.get(["previewUserId", "trail_web_user_tour"], function (items) {
			if (items.previewUserId !== '' || items.previewUserId !== undefined) {
				const userTrails = items.trail_web_user_tour.filter(el => {
					if (el.userId !== items.previewUserId) {
						return el;
					}
				});
				
				chrome.storage.local.set({ previewUserId: '', trail_web_user_tour: userTrails });
			}
		});
		
		try {
			const data = {
				trail_data_id: this.state.trailList[this.state.tourStep - 1].trail_data_id,
				flag: ''
			};
			
			// Call update trail api to add flag into table
			await updateTrailFlag(data);
			// Call back arrow click handler function
			// Remove overlay and other added element
			$('.trail_web_user_tour').parents().css('z-index', '');
			$(`.trail_tour_ToolTipExtend`).remove();
			$('.trail_tooltip_done').remove();
			$('.trail_web_user_tour').removeAttr('trail_web_user_tour');	
			$(`traiil_stop${this.state.tourStep}`).removeAttr(`traiil_stop${this.state.tourStep}`);
			
			const trailOverlay = document.querySelector('.trail_overlay');
			if (trailOverlay) {
				trailOverlay.parentNode.removeChild(trailOverlay);
			}
			// this.props.mainToggle();
		} catch (err) {
			console.log(err);
		}
		
		// chrome.storage.local.set({ tourType: '', currentTourType: '', tourStep: '' });
		// this.setState({
		// 	tourType: '',
		// 	tourStep: '',
		// 	currentTourType: ''
		// });
		// this.props.onChangeTourType("");
		
		chrome.storage.local.set({ tourType: '', currentTourType: '', tourStep: '' });
		this.setState({ web_url: '', tourType: '', currentTourType: '', tourStep: '', overlay: false, loading: false });						
		this.props.onChangeTourType("");
		this.props.mainToggle();
		
		// Clear continue flag from trail data
	}
	
	openPopup = () => {
		this.setState({ open: !this.state.open });
	};
	
	/**
	* on change input value
	*/	
	onChangeToInput = (e) => {
		this.setState({ [e.target.name]: e.target.value })
	}
	
	/**
	* tour step and type manage
	* @step tourStep
	* @type tourType
	*/
	tourManage = (step, type, tourSide) => {
		chrome.storage.local.set({ currentTourType: type, tourStep: step });
		this.setState({ currentTourType: type, tourStep: step, tourSide });
	}
	
	/**
	* on trail video trail next, previos manage
	* @step tourStep
	*/
	onTourVideoTrail = (step) => {
		if (this.state.trailList[step - 1]) {
			let type = this.state.trailList[step - 1].type;
			chrome.storage.local.set({ currentTourType: type, tourStep: step });
			this.setState({ currentTourType: type, tourStep: step });
			if (this.state.trailList[step - 1].url !== document.URL) {
				window.location.href = this.state.trailList[step - 1].url;
			}
		}
	}
	
	uploadFile = (file) => {
		this.setState({ fileLoading: true });
		
		handleFileUpload(file)
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
		const { tourType } = this.state;        
		const file = e.target.files[0];
		const fileType = file.type.split('/');
		e.target.value = null;
		
		if (tourType === 'audio' && fileType[1] === 'mp4') {
			// Upload file function
			this.uploadFile(file);
		} else if (tourType !== fileType[0]) {
			// Return alert
			return alert(`Please upload ${tourType} file!`);
		} else if (tourType === 'video' && fileType[1] === 'x-matroska') {
			// Return alert
			return alert('MKV format suport coming soon.');
		} else {
			// Upload file function
			this.uploadFile(file);
		}
	};
	
	/**
	* It will invoked on step drag and drop.
	*/
	onSectionDragAndDrop = async ({ oldIndex, newIndex }) => {
		// this.props.onDashboardSectionSort(
		// 	arrayMove(this.state.trailList, oldIndex, newIndex).map(r => ({ id: r.id })),
		// 	this.props.usersData._id
		// );
		
		const sorted = arrayMove(this.state.trailList, oldIndex, newIndex);
		
		this.setState({ trail_web_user_tour: sorted, trailList: sorted });
		chrome.storage.local.set({ trail_web_user_tour: sorted });
		
		// Update sorted array in database
		const res = await arraySorting(sorted);
		
		if (!res.data.response || !res.data.response.result) {
			alert('Something went wrong!');
		}
	};
	
	saveSortedTrails = async (e) => {
		e.preventDefault();
		
		// Update sorted array in database
		const res = await arraySorting(this.state.trailList);
		
		if (!res.data.response || !res.data.response.result) {
			alert('Something went wrong!');
		}

		this.setState({ saveSort: false });
		chrome.storage.local.set({ saveSort: false });
	};

	// Save trails into database
	publishTrails = async (data) => {
		try {
			console.log('publishTrails', data);
			const res = await uploadTrails(data);
			this.setState({publishLoader: false})	
			if (!res.data.response) {
				throw new Error('Saving trails failed!');
			}
			
			/// const result = res.data.response.result.map(el => {
			// 	return {
			// 		trail_data_id: el.trail_data_id,
			// 		url: el.url,
			// 		path: el.path,
			// 		selector: el.selector,
			// 		class: el.class,
			// 		title: el.title,
			// 		description: el.description,
			// 		web_url: el.web_url,
			// 		trail_id: el.trail_id,
			// 		type: el.type,
			// 		uniqueTarget: el.unique_target,
			// 		mediaType: el.media_type,
			// 		created: el.created,
			// 		trailIndex: el.trailIndex
			// 	}
			// });
			
			// let newArray = [];

			// this.state.trailList.forEach(el => {
			// 	if (el.trail_id) {
			// 		newArray.push(el);
			// 	}
			// });
			
			// newArray = newArray.concat(result);
			
			// newArray.sort((a, b) => {
			// 	return (+a.trailIndex) - (+b.trailIndex);
			// });

			chrome.storage.local.get(["trail_id"], async function (items) {
				// Get all trail from database
				let screen = resizeScreen()?'mobile':'web';
				const allDataRes = await getUserOneTrail(this.state.currUserId, items.trail_id, screen);
				const newDataArray = allDataRes.data.response.result.map(el => {
					return {
						userId: this.state.currUserId,
						trail_data_id: el.trail_data_id,
						url: el.url,
						path: el.path,
						selector: el.selector,
						class: el.class,
						title: el.title,
						description: el.description,
						web_url: el.web_url,
						trail_id: el.trail_id,
						type: el.type,
						uniqueTarget: el.unique_target,
						unique_target_one: el.unique_target_one,
						mobile_media_type: el.mobile_media_type,
						mobile_title: el.mobile_title,
						mobile_description: el.mobile_description,
						mediaType: el.media_type,
						created: el.created,
						trailIndex: el.trailIndex
					}
				});

				chrome.storage.local.set({ trail_web_user_tour: newDataArray });
				this.setState({ trailList: newDataArray });
			}.bind(this));

		} catch (err) {
			this.setState({publishLoader: false})
			console.log('from publish trails', err);
		}
	};
	
	tooltipShareBtn = (e) => {
		const { trailList } = this.state;
		const trailDataId = trailList[trailList.length - 1].trail_data_id;
		const trailId =  trailList[trailList.length - 1].trail_id;
		const trailUrl = `${process.env.REACT_APP_MS4_URL}userTourDataDetail/readTrailit_trail_data_tour/${trailDataId}?trailId=${trailId}&user_id=${this.state.currUserId}`;
	
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
		
		alert("Successfully copied");
		copyStringToClipboard(trailUrl);
	};

	// Copy Web app link
	copyWebApplink = (e) => {
		const { trailList, currUserId } = this.state;
			
		if(trailList.length == 0) {
			alert("Please create trail")
			return null
		}
		
		const trailId = trailList[trailList.length - 1].trail_id;
		const URL = trailList[0].url;
		let qryString = URL.split("?").length>1?"&":"?";
		const trailUrl = `http://go.trialit.co/live/${URL}${qryString}trailUserId=${currUserId}&trailId=${trailId}&trailPreview=true&tourStep=1`;
		
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

		alert("Successfully copied");
		copyStringToClipboard(trailUrl);
	}
	
	followTrail = (e) => {
		e.preventDefault();
		const previewUserId = this.state.trailList[this.state.tourStep - 1].userId;
		
		const followData = {
			follower_id: this.state.currUserId,
			previewUserId
		};
		
		followTrails(followData)
			.then(res => {
				if (res.data.response && res.data.response.statusCode !== '201') {
					console.log('Error while following trail');
				}
				
				// Set followData into chrome storage
				chrome.storage.local.set({ followData: { previewUserId, follow: true } });
				this.setState({ follow: true });
			})
			.catch(err => {
				console.log(err);
		})
	};
	
	unFollowTrail = (e) => {
		e.preventDefault();
		const previewUserId = this.state.trailList[this.state.tourStep - 1].userId;
		
		const followData = {
			follower_id: this.state.currUserId,
			previewUserId
		};
		
		unFollowTrailOfUser(followData)
			.then(res => {
				if (res.data.response && res.data.response.statusCode !== '200') {
					console.log('Error while unFollowing trail');
				}
				
				// Set followData into chrome storage
				chrome.storage.local.set({ followData: {} });
				this.setState({ follow: false });
			})
			.catch(err => {
				console.log(err);
			})
	};
	
	// Send notification to follower when publish button clicked
	sendNotification = (e) => {
		e.preventDefault();
		this.setState({publishLoader: true});
		
		// Socket notification
		socket.emit('sendNotification', this.state.currUserId);
		
		setTimeout(() => {
			this.setState({publishLoader: false});
		}, 1000);
	
		localStorage.setItem(process.env.REACT_APP_LOCALSTORAGE, this.state.trailList.length);
	};
		
	// Save last show preview trail
	onBackArrowClickHandler = async (e, close) => {	
		// e.preventDefault();
		
		if(close === undefined) {
			chrome.storage.local.set({closeContinue: false});
		}
		
		const removeThisElements = () => {
			// Remove overlay and other added element
			$('.trail_web_user_tour').parents().css('z-index', '');
			$(`.trail_tour_ToolTipExtend`).remove();
			$('.trail_tooltip_done').remove();
			$('.trail_web_user_tour').removeAttr('trail_web_user_tour');	
			$(`traiil_stop${this.state.tourStep}`).removeAttr(`traiil_stop${this.state.tourStep}`);
			

			const tooltip = document.querySelector('.trail_tooltip');
			if (tooltip) {
				// $('.trail_tooltip').remove();
				tooltip.parentNode.removeChild(tooltip);
			}

			const trailOverlay = document.querySelector('.trail_overlay');
			if (trailOverlay) {
				trailOverlay.parentNode.removeChild(trailOverlay);
			}
			
			// $('.trail_overlay').remove();
			// $('.trail_web_user_tour').parent().parent().removeAttr('style');

			// if(this.state.tourStep && 
			// 	this.state.tourStep !== '' && 
			// 	this.state.tourType === 'preview' &&
			// 	this.state.trailList[this.state.tourStep - 1].uniqueTarget && 
			// 	document.querySelector(this.state.trailList[this.state.tourStep - 1]) &&				
			// 	document.querySelector(this.state.trailList[this.state.tourStep - 1].uniqueTarget)
			// ) {
			// 	document.querySelector(this.state.trailList[this.state.tourStep - 1].uniqueTarget).classList.remove('trail_web_user_tour');
			// 	document.querySelector(this.state.trailList[this.state.tourStep - 1].uniqueTarget).classList.remove(`traiil_stop${this.state.tourStep}`);
			// }
		
		};
		
		chrome.storage.local.get(['previewUserId'], async (items) => {
			if (!items.previewUserId || items.previewUserId === '') {
				const { currentTourType, tourType } = this.state;
				if ((currentTourType === 'tooltip' || 
					currentTourType === 'audio' || 
					currentTourType === 'video' || 
					currentTourType === 'modal') &&
					tourType === 'preview'
				) {
					// Remove elements
					await removeThisElements();
										
					if (this.state.trailList.length > 0) {
						try {
							const data = {
								trail_data_id: this.state.trailList[this.state.tourStep - 1].trail_data_id,
								flag: 'continue'
							};	
							
							// Call update trail api to add flag into table
							await updateTrailFlag(data);			
						} catch (err) {
							console.log(err);
						}
					
						await removeThisElements();
					
						// Call toggle function
						chrome.storage.local.set({ tourType: '', currentTourType: '', tourStep: '' });
						this.setState({ web_url: '', tourType: '', currentTourType: '', tourStep: '', overlay: false, loading: false });						
						this.props.onChangeTourType("");
						this.props.mainToggle();
					}

				} else if (currentTourType === 'preview' && tourType === 'modal') {
					this.props.mainToggle();
					this.props.onChangeTourType("");
					this.setState({ web_url: '', tourType: '', currentTourType: '', tourStep: '', overlay: false, createModalOpen: false, loading: false });
					chrome.storage.local.set({ tourType: '', currentTourType: '', tourStep: '' });
			
				} else {
					// Remove elements
					await removeThisElements();
					
					this.props.mainToggle();
					this.props.onChangeTourType("");
					this.setState({ web_url: '', tourType: '', currentTourType: '', tourStep: '', overlay: false, fileName: '', loading: false });
					chrome.storage.local.set({ tourType: '', currentTourType: '', tourStep: '' });		
				}

				if (this.state.deleteModal.show) {

					// Hide delete modal
					this.onDeleteModalClose();
				}

			}  else {
				// Remove elements
				await removeThisElements();
				this.props.mainToggle();
				this.props.onChangeTourType("");
				this.setState({ web_url: '', tourType: '', currentTourType: '', tourStep: '', overlay: false, loading: false });
				chrome.storage.local.set({ tourType: '', currentTourType: '', tourStep: '' });		
			}
		});
	};
	
	onToggleCreateModal = (status) => {
		if(!status) {
			chrome.storage.local.set({ tourType: '', currentTourType: '', tourStep: '' });
			this.setState({ web_url: '', tourType: '', currentTourType: '', tourStep: '', overlay: false, createModalOpen: status });
			this.props.mainToggle();
			this.props.onChangeTourType('');
		} else {
			this.setState({createModalOpen: status});
		}

		// ReactDOM.render(
		// 	<CreateModalComponent 
		// 		open={status} 
		// 		toggle={this.onToggleCreateModal} 
		// 		onSave={this.onSaveTrail} 
		// 	/>
		// , document.querySelector('body'));
	}
	
	onCloseTooltipHandle = (e) => {		
		const { trailList, tourStep } = this.state;

		if (trailList.length > 0 && trailList.length === tourStep) {
			console.log("Helllo")
			// Hide continue button
			chrome.storage.local.set({ closeContinue: false });

			// Call clear toggle function
			this.onClearToggle();
		} else {
			console.log("Helllo111")
			// Show continue button
			chrome.storage.local.set({closeContinue: true});
			
			// Call back arrow click handler function
			this.onBackArrowClickHandler(e, 'close');
		}
	}
	
	setLoadingState = (query) => {
		this.setState({ loading: query });
	};
	
	onClickToGetRow = (e, result, tourStep) => {
		e.preventDefault();
		this.setState({ MobileTargetNotFound: {}});
		chrome.storage.local.set({ MobileTargetNotFound: {}});
		this.setState({rowData: result, tourStep, open: false});
	};

	addTrailitLogo = () => {
		const body = document.querySelector('body');
		const image = document.querySelector('.trailit_logoLeftBottom');
		// <img src={require('/images/trailit_logo.png')} className="trailit_logoLeftBottom" alt=".."/>
		if (body && !image) {
			const element = document.createElement('img');
			element.src = "https://trailit.co/wp-content/uploads/2020/04/logo.png";
			element.className = 'trailit_logoLeftBottom';
			element.alt = 'logo_image_in_preview';

			// Append element in body 
			body.appendChild(element);
		}
	};

	removeTrailitLogo = () => {
		const image = document.querySelector('.trailit_logoLeftBottom');

		if (image) {
			// Remove image from perent node
			image.parentNode.removeChild(image);
		}
	};

	// Send tip function
	sendTip = async (e, toAddress, amount) => {
		e.preventDefault();

		this.setState({ sendLoader: true });

		// const { privateKey } = this.state;
		const privateKey = undefined; // Need to send private key but for demos hard code in code		
		sendTransection(privateKey, toAddress, amount)
		  	.then(res => {
	
				if (res && res.code && res.code === 400) {
				throw new Error(res.err);
				}
		
				// Set is success state
				this.setState({ isSuccess: true });
		
				setTimeout(() => {      
					// Hide modal
					this.onSendTipModalClose();
		
					// Set is success state
					this.setState({ isSuccess: false });
				}, 5000);
			})
			.catch(err => {  
				console.log('err', err);
				
				this.setState({ setError: err.message });
		
				setTimeout(() => {  
					
					// Hide modal
					this.onSendTipModalClose();
			
					// Set is success state
					this.setState({ setError: false });
				}, 5000);
			});
		// await wallet.transfer(this.state.toAddress, this.state.amount);
		// let balance = await wallet.balance();
		// this.setState({
		//   toAddress: "",
		//   amount: "",
		//   balance,
		//   sendLoader: false,
		// });
	};
	
	render() {
		let { 
			open, 
			trailList, 
			tourStatus, 
			tourType, 
			tourStep, 
			currentTourType, 
			web_url, 
			overlay, 
			follow, 
			publishLoader,
			fileName,
			fileLoading,
			createModalOpen,
			loading
		} = this.state;
		
		const localStorageCount = localStorage.getItem(process.env.REACT_APP_LOCALSTORAGE);
		const stateCount = trailList.length;
		
		if (web_url !== '') {
			this.setState({ fileAddStatus: true });
		}
		
		tourUrl = false;
		
		if(tourStep !== '' && stateCount > 0) {
			tourUrl = trailList[tourStep - 1].url === document.URL;			
			// if(trailList[tourStep - 1].url !== document.URL) {
			// 	window.location.href = trailList[tourStep - 1].url;
			// }
		}
		
		let openSidebar = open;
		
		if(tourType==='audio' || tourType==='video') {
			openSidebar = true
		}
		
		if (!openSidebar && flipped && defaultComp) {
			const flipId = document.getElementById('my-extension-root-flip');
			flipId.setAttribute('class', 'trail_flip_box');
		} else if (openSidebar || !flipped) {
			const trailFlipBox = document.querySelector('.trail_flip_box');
			if (trailFlipBox) {
				trailFlipBox.removeAttribute('class');
			}
		}
		
		if (loading) {
			ReactDOM.render(
				<TooltipOverlay data={trailList} toggle={this.onClearToggle} tourStep={tourStep} tour={this.tourManage} tourSide={this.state.tourSide} />, 
				document.body.appendChild(document.createElement('div'))
			);
		}
		
		if ((
			currentTourType === 'tooltip' || 
			currentTourType === 'audio' || 
			currentTourType === 'video' || 
			currentTourType === 'modal' ||
			currentTourType === 'Make Edit' ||
			currentTourType === ''
			) && (tourType === 'preview' || tourType === '') && (tourUrl || !tourUrl)
		) {
			chrome.storage.local.set({ loading: 'false' });
			this.setLoadingState(false);

			// // Add trailit logo when trail menu open
			// this.addTrailitLogo();
		}
		
		// console.log('overlay', overlay);
		// console.log('currentTourType', currentTourType);
		// console.log('tourType', tourType);
		// console.log('tourUrl', tourUrl);
		$(document).ready(() => {
			const modalDiv = document.querySelector('.tr_modal');
            
			if (modalDiv) {
                if (!modalDiv.parentNode.parentNode.parentNode.getAttribute("class")) {
                    modalDiv.parentNode.parentNode.parentNode.setAttribute('class', 'trial_modal_show trial_create_modal_main');
                }
            }
		});	
		
		return (
			<div id="my-extension-defaultroot">
				{/* Delete modal */}
				<Modal 
					className="tr_modal trail_create_modal"
					toggle={ this.onDeleteModalClose } 
					isOpen={ this.state.deleteModal.show } 
				>
					<ModalHeader className="tr_modal_trail_modal_header" closeButton>Delete Alert
						{/* <Modal.Title className="w-100 pho_18_600 text-danger text-center">
							Status Alert
						</Modal.Title> */}
					</ModalHeader>
					<ModalBody>
						<p className="trailit_DeleteText">
							{/* Are you sure want to delete Account { props.userDetail ? `(${props.userDetail.firstName} ${props.userDetail.lastName})` : '' } ? */}
							Are you sure want to delete trail { this.state.deleteModal.title ? `(${this.state.deleteModal.title})` : '' }?
						</p>
						<div className="trailButtonsWrapper">
							<button 
								type="button" 
								className="ant-btn ant-btn-primary trail_add_step_btn"
								onClick={ this.onDeleteModalClose }
							>
								Cancel
							</button>
							<button 
								type="button" 
								className="ant-btn ant-btn-primary trail_add_step_btn"
								onClick={ (e) => this.onDeleteButtonClick(e) }
							>
								DELETE
							</button>
						</div>
					</ModalBody>
					{/* <ModalFooter className="d-flex justify-content-center border-0">
						<Button 
							variant="outline-success" 
							className="btn-sm mr-5" 
							onClick={ this.onDeleteModalClose }
						>
							CANCEL
						</Button>
						<Button 
							variant="outline-danger" 
							className="btn-sm" 
							onClick={ this.onDeleteButtonClick }
						>
							DELETE                        
						</Button>
					</ModalFooter> */}
				</Modal>

				{/* Send tip modal */}
				<Modal 
					className="tr_modal trail_create_modal"
					toggle={ this.onSendTipModalClose } 
					isOpen={ this.state.sendTipModal } 
				>
					<ModalHeader className="tr_modal_trail_modal_header" closeButton>Send Tip
						{/* <Modal.Title className="w-100 pho_18_600 text-danger text-center">
							Status Alert
						</Modal.Title> */}
					</ModalHeader>
					<ModalBody>
						{ 
							this.state.isSuccess ?
								<div className="tr_description">
									<p 
										style={{ color: "#0c8026", textAlign: 'center' }}
									>
										Transaction completed successfully.
									</p>
								</div>
							:
								
								!this.state.setError ?
									<SendTipForm 
										sendTip={ this.sendTip }
										onCancel={ this.onSendTipModalClose }
										isLoading={ this.state.isLoading }
										sendLoader={ this.state.sendLoader }
									/>
								:
									<div className="tr_description">
										<p 
											style={{ color: "#d21e1e", textAlign: 'center' }}
										>
											{ this.state.setError }
										</p>
									</div>          
							} 
					</ModalBody>
					{/* <ModalFooter className="d-flex justify-content-center border-0">
						<Button 
							variant="outline-success" 
							className="btn-sm mr-5" 
							onClick={ this.onSendTipModalClose }
						>
							CANCEL
						</Button>
						<Button 
							variant="outline-danger" 
							className="btn-sm" 
							onClick={ this.onSendButtonClick }
						>
							SEND                        
						</Button>
					</ModalFooter> */}
				</Modal>

				<div className="sidepanal adadad trail_sidepanel_overlay">
					{ createModalOpen && <CreateModalComponent open={createModalOpen} toggle={this.onToggleCreateModal} closeButtonHandler={ this.onBackArrowClickHandler } onSave={this.onSaveTrail} /> } 
					<div>
						{/* {currentTourType === 'tooltip' && tourType === 'preview' && !overlay && tourStep!=='' && tourUrl && <TooltipOverlay data={trailList} toggle={this.onClearToggle} tourStep={tourStep} tour={this.tourManage} tourSide={this.state.tourSide} />} */}
						{/* <TooltipOverlay data={trailList} toggle={this.onClearToggle} tourStep={tourStep} tour={this.tourManage} tourSide={this.state.tourSide} /> */}
						{currentTourType === 'tooltip' && tourType === 'preview' && !overlay && tourStep!=='' && tourUrl && <WebUserTour data={trailList} toggle={this.onClearToggle} tourStep={tourStep} tour={this.tourManage} closeButtonHandler={ this.onCloseTooltipHandle  } setLoadingState={ this.setLoadingState } onNotFoundTarget={ this.onNotFoundTarget } onSendTipModalOpen={ this.onSendTipModalOpen } />}
						{currentTourType === 'video' && tourType === 'preview' && !overlay && tourStep!=='' && tourUrl && <VideoTour data={trailList} toggle={this.onClearToggle} tourStep={tourStep} tour={this.tourManage} tourSide={this.state.tourSide} closeButtonHandler={ this.onCloseTooltipHandle } setLoadingState={ this.setLoadingState } />}
						{currentTourType === 'audio' && tourType === 'preview' && !overlay && tourStep!=='' && tourUrl && <AudioTour data={trailList} toggle={this.onClearToggle} tourStep={tourStep} tour={this.tourManage} tourSide={this.state.tourSide} closeButtonHandler={ this.onCloseTooltipHandle } setLoadingState={ this.setLoadingState } />}
						{currentTourType === 'modal' && tourType === 'preview'&& !overlay && tourStep!=='' && tourUrl && <PreviewModalComponent data={trailList} toggle={this.onClearToggle} tourStep={tourStep} tour={this.tourManage} tourSide={this.state.tourSide} closeButtonHandler={ this.onCloseTooltipHandle } setLoadingState={ this.setLoadingState } onSendTipModalOpen={ this.onSendTipModalOpen } />}
						{/* <img src={require('./images/trailit_logo.png')} className="trailit_logoLeftBottom" alt=".."/> */}
					</div>
					<div className={`sidepopup ${openSidebar ? 'open trail_builder_side_panel_open' : ''}`}>
						<div className="space"></div>
						{/* <div className="preview">.
								Preview
							</div>
							<div className="createToolTip">.
								Create Tool Tip
							</div> */}
						<div>
							{/* ----------------befor submit------------- */}
							<div className="first_step">
								<div className="hdr">
									<div className="titleBack">
										<button onClick={ this.onBackArrowClickHandler }>
											<svg xmlns="http://www.w3.org/2000/svg" width="7.734" height="13.404" viewBox="0 0 7.734 13.404">
												<g id="left-arrow" transform="translate(0.557 0.557)">
													<path id="Path_2" data-name="Path 2" d="M39.276,18.719a.437.437,0,0,0,.617,0,.437.437,0,0,0,0-.617l-5.428-5.428,5.428-5.428a.437.437,0,0,0-.617-.617l-5.748,5.737a.437.437,0,0,0,0,.617Z" transform="translate(-33.4 -6.5)" fill="#289728" stroke="#fb542b" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" />
												</g>
											</svg>
											{/* <img src="https://res.cloudinary.com/dlhkpit1h/image/upload/v1569327303/pfeba7xz9tqogmh7wb2r.png" /> */}
										</button>
										<span>Trail Builder</span>
									</div>
									{/* {trailList.length > 0 && <div className="optionBtn">
										<Button type="0primary" onClick={this.copyWebApplink}>Copy Web App Link</Button>
									</div>} */}
									{obj.previewUserId && obj.previewUserId !== ''  && <div className="optionBtn">
										{follow
											?	
												<Button type="primary" onClick={ this.unFollowTrail }>Unfollow</Button>
											:
												<Button type="primary" onClick={ this.followTrail }>Follow</Button>
										}
										{/* <Button type="primary">Subscribe</Button> */}
										{/* <button>
											<img src="https://res.cloudinary.com/dlhkpit1h/image/upload/v1569314445/yj7ztrq0c7oqw1acpxtn.png" alt="optionBtn" />
										</button> */}
									</div>}
								</div>
								<div id="scroll" className="sidepopcontent scrollbar">
									{
										tourType === 'audio' || tourType === 'video'
											? 
												<h4 className="title my-4">Upload Media</h4>
											: 
												<h4 className="title my-4">Trail It, Curated Guided Tour</h4>

									}
									<div className="pl-4 trail_video_frm">
										{tourStatus !== 'preview' && tourType === 'video' && <input type="text" name="title" onChange={this.onChangeToInput} placeholder="Enter Video title" className="ant-input mb-2" autoComplete="off" />}
										{tourStatus !== 'preview' && tourType === 'video' && <input type="text" name="web_url" value={ fileName } onChange={this.onChangeToInput} placeholder="Add Video URL" className="ant-input mb-2" />}
										{tourStatus !== 'preview' && tourType === 'video' && <div className="upload_bx">
											<div className="ant-upload">
												<p className="ant-upload-drag-icon">
													{fileLoading && <div class="trial_spinner"><img class="ring1" src={require(`./images/loding1.png`)} /><img class="ring2" src={require(`./images/loding2.png`)} /></div>}
													{!fileLoading && <Icon type='cloud-upload' />}
												</p>
												<p className="ant-upload-text">Upload Video</p>
											</div>
											<input type="file" name="media" onChange={this.handleChange} />
										</div>}
										{/* {imageUrl ? <input type="text" value={imageUrl} className="ant-input mb-2"/> : ''} */}
										{tourStatus !== 'preview' && tourType === 'video' && <button disabled={ fileLoading } onClick={this.onSaveTrail} value="ADD" className="ant-btn ant-btn-primary trail_add_step_btn">ADD STEP</button>}

										{/* { tourType === 'video' && web_url && fileAddStatus &&
											<Button type="primary">
												Preview
											</Button>
										} */}

										{tourStatus === 'preview' && tourType === 'video' && <input type="submit" onClick={() => this.onTourVideoTrail(this.state.tourStep - 1)} value="Previous" className="ant-btn ant-btn-primary" />}
										{tourStatus === 'preview' && tourType === 'video' && <input type="submit" onClick={() => this.onTourVideoTrail(this.state.tourStep + 1)} value="Next" className="ant-btn ant-btn-primary" />}
										{tourStatus !== 'preview' && tourType === 'audio' && <input type="text" name="title" placeholder="Enter Audio Title" className="ant-input mb-2" onChange={this.onChangeToInput} autoComplete="off" />}
										{tourStatus !== 'preview' && tourType === 'audio' && <input type="text" name="web_url" value={fileName} onChange={this.onChangeToInput} placeholder="Add Audio URL" className="ant-input mb-2" />}
										{tourStatus !== 'preview' && tourType === 'audio' && <div className="upload_bx">
											<div className="ant-upload">
												<p className="ant-upload-drag-icon">
													{fileLoading && <div class="trial_spinner"><img class="ring1" src={require(`./images/loding1.png`)} /><img class="ring2" src={require(`./images/loding2.png`)} /></div>}
													{!fileLoading && <Icon type='cloud-upload' />}
												</p>
												<p className="ant-upload-text">Upload Audio</p>
											</div>
											<input type="file" name="media" onChange={this.handleChange} />
										</div>}
										{tourStatus !== 'preview' && tourType === 'audio' && <button disabled={ fileLoading } onClick={this.onSaveTrail} value="ADD" className="ant-btn ant-btn-primary trail_add_step_btn" >ADD STEP</button>}
										
										{/* { tourType === 'audio' && web_url && fileAddStatus &&
											<Button type="primary">
												Preview
											</Button>
										} */}

										{tourStatus === 'preview' && tourType === 'audio' && <input type="submit" onClick={() => this.onTourVideoTrail(this.state.tourStep - 1)} value="Previous" className="ant-btn ant-btn-primary" />}
										{tourStatus === 'preview' && tourType === 'audio' && <input type="submit" onClick={() => this.onTourVideoTrail(this.state.tourStep + 1)} value="Next" className="ant-btn ant-btn-primary" />}
									</div>
									{/* <div className="trailit_loaderBox">
										<div class="trial_spinner"><img class="ring1" src={require(`./images/loding1.png`)} /><img class="ring2" src={require(`./images/loding2.png`)} /></div>
									</div> */}
									<form className="flow tr_side_form" id="">
										<SortableContainer onSortEnd={this.onSectionDragAndDrop} useDragHandle>
											{ this.state.trailList.map((result, index) => (
												<SortableItem 
													key={`item-${index}`} 
													tourType={this.state.tourType} 
													onClick={this.onClickToGetRow} 
													index={index} 
													i={index} 
													tourStep={tourStep} 
													result={result} 
													isDeleteModalOpen={ this.state.deleteModal.show }
													onDeleteModalOpen={ this.onDeleteModalOpen }
													MobileTargetNotFound={this.state.MobileTargetNotFound}
												/>
											)) }
										</SortableContainer>
										{/* {trailList.map((result, i) => {
											return (<div key={i} className={`li done trailTourStep ${tourStep === (i + 1)?'active':''}`}>
												<div className="counter">{i + 1}</div>
												<div contenteditable="true" className="en_title">
													{result.title}
												</div>
												<div contenteditable="true" className="en_desc mb-2">
												{(result.type !== 'audio' && result.type !== 'video')?result.description:result.web_url}
												</div>
											</div>)
										})} */}

										{/* {(tourStep === (i + 1)) && <div>
											{1 < (i + 1) && <input type="submit" onClick={() => this.onTourVideoTrail(this.state.tourStep - 1)} value="Previous" className="btn" />}
											{trailList.length > (i + 1) && <input type="submit" onClick={() => this.onTourVideoTrail(this.state.tourStep + 1)} value="Next" className="btn" />}
											{trailList.length === (i + 1) && <input type="submit" onClick={this.onClearToggle} value="Done" className="btn" />}
										</div>} */}
										{/* <div className="li done">
										<div className="counter">2</div>
										<div contenteditable="true" className="en_title">
											Enter Title
										</div>
										<div contenteditable="true" className="en_desc mb-2">
											Lorem ipsum dolor sit conctetur adipiscing elit imperdiet eget voluteuismod
											tortor diam con lorem.
										</div>
									</div>
									<div className="li done">
										<div className="counter">3</div>
										<div contenteditable="true" className="en_title">
											Enter Title
										</div>
										<div contenteditable="true" className="en_desc mb-2">
											Lorem ipsum dolor sit conctetur adipiscing elit imperdiet eget voluteuismod
											tortor diam con lorem.
										</div>
									</div> */}
										{/* {(tourStatus !== 'preview' && tourType === 'video') && <input type="submit" onClick={this.onClickToSubmitTour} value="DONE" className="btn" />} */}
									</form>
										{/* <div className="trailButtonsWrapper">
											<Button type="primary" >Done </Button>
											{ this.state.follow
												?	
													<Button type="primary" onClick={ this.unFollowTrail }>Unfollow</Button>
												:
													<Button type="primary" onClick={ this.followTrail }>Follow</Button>
											}
										</div> */}
										
										<div>
											{/* <div className="trailButtonsWrapper">
												<Button type="primary" >Add </Button>
												<Button type="primary" >Done </Button>
											</div> */}

											{ this.state.saveSort && 
												<div className="trailButtonsWrapper">
													<Button type="primary" onClick={ this.saveSortedTrails }>Save</Button>
												</div>
											}

											{ 
												this.state.trailList.length > 0 
													&& 
												<div className="trailButtonsWrapper">
													{/* { tourType === 'preview' && trailList[trailList.length - 1].trail_data_id && <Button type="primary" onClick={ this.tooltipShareBtn }>Share</Button>} */}													
													<Button type="primary" onClick={ this.tooltipShareBtn }>Share</Button>
													{/* <Button type="primary" onClick={ this.sendNotification }>{publishLoader?'Loading...':'Publish'} </Button>  */}
												</div>
											}
											
										</div>
								</div>
							</div>
							{/* ----------------after submit------------- */}
							{/* <div className="last_step">
								<div className="hdr">
									<div className="titleBack">
										<button>
											<img src="https://res.cloudinary.com/dlhkpit1h/image/upload/v1569327303/pfeba7xz9tqogmh7wb2r.png" />
										</button>
										<span>BACK</span>
									</div>
									<div className="optionBtn">
										<button>
											<img src="https://res.cloudinary.com/dlhkpit1h/image/upload/v1569314445/yj7ztrq0c7oqw1acpxtn.png" />
										</button>
									</div>
								</div>
								<h4 className="title my-4">Neque lorem quisquam dolorem ipsum dummy</h4>
								<form className="pl-4 flow">
									<div className="li done">
										<div className="counter">1</div>
										<div contenteditable="true" className="en_title">
											Enter Title
										</div>
										<div contenteditable="true" className="en_desc mb-2">
											Lorem ipsum dolor sit conctetur adipiscing elit imperdiet eget voluteuismod
											tortor diam con lorem.
										</div>
									</div>
									<input type="submit" value="PUBLISH" className="btn" />
									<input type="submit" value="SAVE LATER" className="btn mr-2" />
								</form>
							</div> */}
							{/* ------------------------------ */}
						</div>
						{/* <div className="audio">.
						Create Audio
					</div>
					<div className="savedTrails">.
						Saved Trails
					</div> */}
						<div className="space"></div>
					</div>
					<button className="menu pop" onClick={this.openPopup}>
						<img
							alt=""
							src={require('./images/imgpsh_fullsize_anim.png')}
						/>
					</button>
				</div>
			</div>
		);
	}
}

app = document.createElement('div');
app.id = 'my-extension-root-flip';
app.href = chrome.extension.getURL('/static/css/content.css');

document.body.appendChild(app);

class MainFlip extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			mainComponent: false,
			defaultComponent: false,
			isFlipped: false,
			tourType: ""
		}

		this.onStorageHandleChange = this.onStorageHandleChange.bind(this);
	}
	
	componentDidMount() {
		document.addEventListener("visibilitychange", function () {
			if (document.hidden) {
			//...
			}
		}, false);
	
		chrome.storage.local.get(["openButton", "tourType"], function (items) {
			this.onChangeTourType(items.tourType);
			if(items.tourType !== 'preview') {
				this.setState({defaultComponent: false, mainComponent: false, isFlipped: false})
			} else {
				toggle()
				this.setState({defaultComponent: true, mainComponent: false, isFlipped: true})
			}
		}.bind(this));
	
	}
	
	onStorageHandleChange = ( changes ) => {
		if(changes.newValue.tourType!==undefined && changes.newValue.tourType === "") {
			this.setState({isFlipped: false})
		} else if (changes.newValue.tourType!==undefined && changes.newValue.tourType !== "") {
			this.setState({isFlipped: true})
		}
	}
	
	mainToggle = (isTrue) => {
		if(this.state.mainComponent || isTrue) {
			root1 = 'block'
			this.setState({defaultComponent: true, mainComponent: false, isFlipped: true})
		} else {
			root1 = 'none'
			this.setState({defaultComponent: false, mainComponent: true, isFlipped: false})
		}
	}
	
	downToggleButton = (status) => {
		if (status) {
			root1 = 'block'
			this.setState({defaultComponent: true, mainComponent: false})
		} else {
			root1 = 'none'
			this.setState({defaultComponent: false, mainComponent: true})
		}
	}
	
	onChangeTourType = (type) => {
		if(type==="" || type === undefined) {
			this.setState({isFlipped: false, tourType: ""})
		} else {
			this.setState({isFlipped: true, tourType: type})
		}
	}
	
	render() {		
		const { defaultComponent, mainComponent, isFlipped, tourType } = this.state;
		defaultComp = defaultComponent;
		flipped = isFlipped;
		
		return(
			<React.Fragment>
				<div className={`trail_card ${isFlipped?'trail_flipped':''}`}>
					<div className={"trail_card__face trail_card__face--front"}>
						<Main mainToggle={this.mainToggle} onChangeTourType={this.onChangeTourType} downToggleButton={this.downToggleButton}/>
					</div>
					<div className={"trail_card__face trail_card__face--back"}>
						<DefaultButton mainToggle={this.mainToggle} onChangeTourType={this.onChangeTourType} downToggleButton={this.downToggleButton}/>
					</div>
				</div>
			</React.Fragment>
		)
	}
}

chrome.storage.local.get(['isAuth', 'auth_Tokan', 'userData'], function (items) {
	if (items.isAuth) {
		ReactDOM.render(<MainFlip />, app);
		// ReactDOM.render(<Main />, app);
		// ReactDOM.render(<DefaultButton />, appd);
	}
});

app.style.display = 'none';

// app = document.createElement('div');
// app.id = 'my-extension-root';
// app.href = chrome.extension.getURL('/static/css/content.css');
// appd = document.createElement('div');
// appd.id = 'my-extension-defaultroot';
// appd.href = chrome.extension.getURL('/static/css/content.css');

// document.body.appendChild(app);
// document.body.appendChild(appd);
// chrome.storage.local.get(['isAuth', 'auth_Tokan', 'userData'], function (items) {
// 	if (items.isAuth) {
// 		ReactDOM.render(<Main />, app);
// 		ReactDOM.render(<DefaultButton />, appd);
// 	}
// });
// appd.style.display = 'none';

chrome.runtime.onMessage.addListener(msgObj => {
	if (msgObj.status === 'logout') {
		app.style.display = 'none';
		// appd.style.display = 'none';
	} else {
		if(msgObj.subject !== 'DOMObj' && msgObj !=="chrome_modal" && msgObj.subject !== 'CreateTrail') {
			setTimeout(() => {
				// to handle open tab in entire tab
				chrome.storage.local.get(["openButton", "tourType"], function (items) {
					// if(items.openButton === 'CreateTrail') {
					// 	appd.style.display = 'block';
					// } else {
					if (app.style.display === 'none') {
						// this.props.toggle();
						app.style.display = 'block';
						// toggle()
					}
					// }
				});
			})
		}
	}
});

const toggle = () => {
	if (app.style.display === 'none') {
		app.style.display = 'block';
		// appd.style.display = 'none';
	} else {
		app.style.display = 'none';
		// appd.style.display = 'block';
	}
};

// const downToggleButton = (status) => {
// 	if (status) {
// 		appd.style.display = 'block'; 	 	
// 	} else {
// 		appd.style.display = 'none';
// 	}
// }
		