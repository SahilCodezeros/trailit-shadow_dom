import React from 'react';
import { Form, Icon, Input, Button, Avatar } from 'antd';

class UserConfirmation extends React.Component {
    render() {
		return (
			<div className="tr_wrapper">
				<div className="text_center">
					<div className="tr_title f_36 mt_55">Thank You...!</div>
					<div className="tr_subtitle mt_55">Thank you for the register into the trailit.</div>
					<Button type="primary" htmlType="submit" className="tr_button mt_55" onClick={() => this.props.clickToRedirect('login')}>
						Login now
					</Button>
				</div>
			</div>
		);
	} 
}

export default UserConfirmation;
