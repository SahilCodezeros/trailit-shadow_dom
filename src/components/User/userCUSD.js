import React, { Component } from "react";
import $ from "jquery";

import { wallet } from '../../common/celo';
import { sendTransection } from '../../code/sendtx';
import SendTipForm from '../../common/SendTipForm';

const chrome = window.chrome;

class userCUSD extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      toAddress: "",
      amount: "",
      sendLoader: false,
      privateKey: this.props.privateKey,
      isSuccess: false,
      setError: null
    };
  }

  componentDidMount() {
    this.setState({privateKey: this.props.privateKey})
  }

  onChangeInput = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  sendTip = async (e, toAddress, amount) => {
    e.preventDefault();

    this.setState({ sendLoader: true });
    
    const { privateKey } = this.state;
    sendTransection(privateKey, toAddress, amount)
      .then(res => {

        if (res && res.code && res.code === 400) {
          throw new Error(res.err);
        }

        // Set is success state
        this.setState({ isSuccess: true });

        setTimeout(() => {          
          // Hide side modal
          this.props.onHideSlide();

          // Set is success state
          this.setState({ isSuccess: false });
        }, 5000);
      })
      .catch(err => {  
        console.log('err', err);
        
        this.setState({ setError: err.message });

        setTimeout(() => {          
          // Hide side modal
          this.props.onHideSlide();

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

  onClear = () => {
    $("body").attr("class", "");
  };
  onSlide = () => {
    this.setState({ slideBalance: !this.state.slideBalance });
  };

  render() {
    const { isLoading, toAddress, amount, sendLoader } = this.state;

    return (
      <div className="trailit_userPanalLeftBox">
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
                isLoading={ isLoading }
                sendLoader={ sendLoader }
                sendTip={ this.sendTip }
                onCancel={ this.onClear }
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
      </div>
    );
  }
}

export default userCUSD;

// {/* <div>
//   { isLoading && (
//     <div className="trailit_loaderBox">
//       <div class="trial_spinner">
//         <img class="ring1" src={require(`../../images/loding1.png`)} alt="loader" />
//         <img class="ring2" src={require(`../../images/loding2.png`)} alt="loader" />
//       </div>
//     </div>
//   )}
//   {/* <div className="tr_description">
//     <p>Microtipping enabled through Celo Blockchain cUSD</p>
//   </div> */}
//   <form>
//     <div className="d-block">
//       <input
//         type="text"
//         className="trailit_inputIntro trailit_mb3"
//         placeholder="Enter your to address"
//         name="toAddress"
//         onChange={this.onChangeInput}
//         value={toAddress}
//       />
//     </div>
//     <div className="d-block">
//       <input
//         type="text"
//         className="trailit_inputIntro trailit_mb3"
//         placeholder="Enter your amount"
//         name="amount"
//         onChange={this.onChangeInput}
//         value={amount}
//       />
//     </div>
//     <div className="trailit_userPanalFooterBox">
//       <button type="button" className="trailit_btnGray" onClick={this.onClear}>
//         Cancel
//       </button>
//       <button
//         type="submit"
//         onClick={this.sendTip}
//         disabled={sendLoader}
//         className="trailit_btnPink"
//       >
//         {sendLoader ? "Loading..." : "Send Tip"}
//       </button>
//     </div>
//   </form>
// </div> */}
