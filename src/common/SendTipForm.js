import React, { Component } from 'react';
import { Form, Input } from "antd";

class SendTipForm extends Component {
  constructor(props) {
    super();
    this.state = {
      toAddress: "",
      amount: ""
    };
  }

  onChangeInput = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  onCancelButtonClick = (e) => {
    // Set state to init value
    this.setState({
      toAddress: '',
      amount: ''
    });

    // Call on cancel function
    this.props.onCancel();
  };

  render() {
    const { toAddress, amount } = this.state;
    const { isLoading, sendLoader } = this.props;

    return(
      <div>
        { isLoading && (
          <div className="trailit_loaderBox">
            <div class="trial_spinner">
              <img class="ring1" src={require(`../images/loding1.png`)} alt="loader" />
              <img class="ring2" src={require(`../images/loding2.png`)} alt="loader" />
            </div>
          </div>
        )}
        {/* <div className="tr_description">
          <p>Microtipping enabled through Celo Blockchain cUSD</p>
        </div> */}
        <Form>
          <Form.Item>
          <Input
              type="text"
              placeholder="Enter your to address"
              autoComplete="off"
              name="toAddress"
              onChange={this.onChangeInput}
              value={toAddress }
          />
          </Form.Item>
          <Form.Item>
          <Input
              type="text"
              placeholder="Enter your amount"
              autoComplete="off"
              name="amount"
              onChange={this.onChangeInput}
              value={amount }
          />
          </Form.Item>
          <div className="trailButtonsWrapper">
            <button 
              type="button" 
              className="ant-btn ant-btn-primary trail_add_step_btn"
              onClick={ this.onCancelButtonClick }
            >
              Cancel
            </button>

            <button
              type="submit"              
              onClick={ (e) => this.props.sendTip(e, toAddress, amount) }
              disabled={ sendLoader || ( !this.state.amount.length > 0 && !this.state.length > 0 ) }
              className="ant-btn ant-btn-primary trail_add_step_btn"
            >
              {sendLoader ? "Loading..." : "Send Tip"}
            </button>
          </div>
        </Form>        
        {/* <form> */}
          {/* <div className="d-block">
            <input
              type="text"
              className="trailit_inputIntro trailit_mb3"
              placeholder="Enter your to address"
              name="toAddress"
              onChange={this.onChangeInput}
              value={toAddress }
            />
          </div> */}
          
          {/* <div className="d-block">
            <input
              type="text"
              className="trailit_inputIntro trailit_mb3"
              placeholder="Enter your amount"
              name="amount"
              onChange={this.onChangeInput}
              value={amount}
            />
          </div> */}

          {/* <div className="trailit_userPanalFooterBox">
            <button 
              type="button" 
              className="ant-btn ant-btn-primary trail_add_step_btn"
              onClick={ this.onCancelButtonClick }
            >
              Cancel
            </button>
            <button
              type="submit"              
              onClick={ (e) => this.props.sendTip(e, toAddress, amount) }
              disabled={ sendLoader || ( !this.state.amount.length > 0 && !this.state.length > 0 ) }
              className="ant-btn ant-btn-primary trail_add_step_btn"
            >
              {sendLoader ? "Loading..." : "Send Tip"}
            </button>
          </div> */}
        {/* </form> */}
      </div>
    );
  };
};

export default SendTipForm;