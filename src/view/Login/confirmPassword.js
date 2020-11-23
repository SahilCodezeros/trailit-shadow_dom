import React from 'react';
import { Form, Icon, Input, Button, Avatar } from 'antd';

class ConfirmPassword extends React.Component {
	/**
	 * onClick to submit
	 */
	onClickToSubmit = e => {
		e.preventDefault();
		this.props.form.validateFields((err, values) => {
			if (!err) {
				console.log('Received values of form: ', values);
			}
		});
	};

	render() {
		const { getFieldDecorator } = this.props.form;
		
		return (
			<div className="tr_wrapper">
				<div className="tr_title">Set Password</div>
				<div className="tr_subtitle mb_40">Please enter your password to login into the Trailit account.</div>
				<div className="tr_label">Enter Password</div>
				<Form onSubmit={this.onClickToSubmit}>
					<Form.Item>
						{getFieldDecorator('password', {
							rules: [{ required: true, message: 'Please input Password!' }],
						})(<Input placeholder="Enter your email" className="tr_input" />)}
					</Form.Item>
					<Form.Item>
						{getFieldDecorator('ConfirmPassword', {
							rules: [{ required: true, message: 'Please input Confirm Password!' }],
						})(<Input type="password" placeholder="Confirm Password" className="tr_input" />)}
					</Form.Item>
					<Form.Item>
						<Button type="primary" htmlType="submit" className="tr_button">
							Continue
						</Button>
					</Form.Item>
				</Form>
				<a href="" className="tr_link back">
					BACK
				</a>
			</div>
		);
	}
}

export default Form.create({ name: 'normal_login' })(ConfirmPassword);
