import React from 'react';
import { Form, Icon, Input, Button, Avatar } from 'antd';
import './App.css';
import 'antd/dist/antd.css';
import {
	ForgotPassword,
	Login,
	UserConfirmation,
	UserProfile,
	UserVerification,
	OtpVerification,
	Signup,
	ConfirmPassword,
} from './view/Login';
import axios from 'axios';
import $ from 'jquery';

const chrome = window.chrome;
let bkg = chrome.extension.getBackgroundPage();

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			active: {
				login: false,
				signup: true,
				forgotPassword: false,
				userConfirmation: false,
				userVerification: false,
				userProfile: false,
				otpVerification: false,
				confirmPassword: false
			},
			token: ''
		};
	}
	
	componentDidMount() {
		$('#my-extension-root-flip').remove()
		chrome.storage.local.get(["auth_Tokan", "userData"], function(items) {
			if(items.userData) {
				this.onClickToRedirect('userProfile');
			} else {
				this.onClickToRedirect('login')
			}
		}.bind(this));
	}
	
	/**
	 * go to perticular component
	*/
	onClickToRedirect = (cmp) => {
		const { active } = this.state;
		
		Object.keys(active).map(res => active[res] = false);
		active[cmp] = true;
		// bkg.console.log(active);
		this.setState({active});
	}
	
	onClickToLogout = () => {
		this.onClickToRedirect('login');
		chrome.tabs.query({active: true, currentWindow: true}, tabs => {
			chrome.tabs.sendMessage(tabs[0].id, {status: 'logout'});
		});
		chrome.runtime.sendMessage({badgeText: ``});
		chrome.storage.local.set({trail_web_user_tour: [], notification: true})
		chrome.storage.local.clear();
	}

	render() {
		const {
			login,
			forgotPassword,
			userConfirmation,
			userVerification,
			userProfile,
			otpVerification,
			signup,
			confirmPassword
		} = this.state.active;

		chrome.storage.local.get(["isAuth"], function (items) {
			if (items.isAuth) {
				if($('.trail_overlay').attr('class')!==undefined) {
					$('.trail_overlay').remove();
				}
				// if($('.my-extension-defaultroot').attr('class')=='block') {
					$('.my-extension-defaultroot').css({display: 'none'});
				// }
		
				// if($('.my-extension-root').attr('class')=='block') {
					$('.my-extension-root').css({display: 'none'});
				// }
			}
		});
		
		return (
			<div className={'trailMain'}>
				{login && <Login clickToRedirect={this.onClickToRedirect}/>}
				{forgotPassword && <ForgotPassword clickToRedirect={this.onClickToRedirect}/>}
				{userConfirmation && <UserConfirmation clickToRedirect={this.onClickToRedirect}/>}
				{userVerification && <UserVerification clickToRedirect={this.onClickToRedirect}/>}
				{userProfile && <UserProfile clickToRedirect={this.onClickToRedirect} onClickToLogout={this.onClickToLogout}/>}
				{otpVerification && <OtpVerification clickToRedirect={this.onClickToRedirect}/>}
				{signup && <Signup clickToRedirect={this.onClickToRedirect}/>}
				{confirmPassword && <ConfirmPassword clickToRedirect={this.onClickToRedirect}/>}
			</div>
		);
	}
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
	for (var key in changes) {
	  var storageChange = changes[key];	  
	}
});

export default App;
