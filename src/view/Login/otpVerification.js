import React from 'react';
import { Form, Icon, Input, Button, Avatar } from 'antd';

class OtpVerification extends React.Component {
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
				<div className="tr_title">Forgot Password?</div>
				<div className="tr_subtitle mb_40">We will send OTP for your password recovery to your account.</div>
				<Form onSubmit={this.handleSubmit}>
					<Form.Item>
						{getFieldDecorator('username', {
							rules: [{ required: true, message: 'Please input your OTP!' }],
						})(<Input placeholder="Code" className="tr_input" />)}
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

export default Form.create({ name: 'normal_login' })(OtpVerification);
