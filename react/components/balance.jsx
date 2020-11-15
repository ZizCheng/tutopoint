import React, { useEffect, setState, useState } from "react";
import ReactDOM from "react-dom";
import { withRouter } from "react-router-dom";
import "./balance.scss";
import store from "../store/store.js";
import balanceAPI from "../api/balance.js";
import { loadStripe } from "@stripe/stripe-js";
import QRCode from 'qrcode.react';
import {
  CardElement,
  Elements,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";

import stripeImport from '../../secret.js';
const stripePromise = loadStripe(stripeImport.stripe.pk_key);

const CheckOutForm = React.forwardRef(({ onFormCompleted, sources, balanceerror }, ref) => {
  const [count, setCount] = useState(0);
  const [stripeCardInfo, setStripeCardInfo] = useState("invalid");
  const [paymentMethod, setPaymentMethod] = useState('NewCard')
  const stripe = useStripe();
  const elements = useElements();

  const handleNext = () => {
    const amount = document.querySelector("#FormAmount");
    if(count == 0){
      if(amount.value == ''){
        return
      }
      count >= 2 ? "" : setCount(count + 1);
    }
    else if (count == 1) {
      if(paymentMethod == "NewCard"){
        stripe
        .createToken(elements.getElement(CardElement))
        .then(function(result) {
          setStripeCardInfo(result);
          if(result.error){
            setCount(1);
          } else {
            onFormCompleted({type: "NewCard", card: result, amount: amount.value});
            count >= 2 ? "" : setCount(count + 1);
          }
        });
      }
      else if(paymentMethod == "WeChat"){
        onFormCompleted({type: "WeChat", amount: amount.value})
        count >= 2 ? "" : setCount(count + 1);
      }
      else {
        const paymentMethod_el = document.querySelector("#paymentMethod");
        setStripeCardInfo({card: sources[paymentMethod_el.selectedIndex]})
        onFormCompleted({type:"SavedCard", card: sources[paymentMethod_el.selectedIndex], amount: amount.value})
        count >= 2 ? "" : setCount(count + 1);
      }

    }
    else {
      count >= 2 ? "" : setCount(count + 1);
    }
  };

  const getPaymentOptions = () => {
    return sources?.map((paymentOption, i) => {
      return <option key={i} value={paymentOption.id}>Card ending in {paymentOption.last4}</option>;
    });
  };

  const handleChangePaymentMethod = (e) => {
    setPaymentMethod(e.target.value);
  }


  return (
    <form id="Balance__FormCheckout" ref={ref}>
      <div id="Balance__FormContainer" className="container">
        <BalanceSteps step={count} />

        <div id="Balance__Form" className={count != 0 ? "is-hidden" : ""}>
          <div className="select-amount-form field has-addons">
            <p className="control has-text-grey-light">Select Amount to Add</p>
            <div className="control">
              <input id="FormAmount" className="input" type="number" name="amount" placeholder="Amount in USD" />
            </div>
            <p class={`footnote ${balanceerror ? "shake-horizontal highlight" : null}`}>*Sessions cost $60/hour. You need at least $60 in your
            balance to book a session.</p>
          </div>
        </div>
        <div id="Balance__Form" className={count != 1 ? "is-hidden" : ""}>
          <div className="field has-addons">
            <p className="control has-text-grey-light">Select Payment Method:</p>
            <div className="select is-rounded is-light">
              <select defaultValue={"NewCard"} id='paymentMethod' className="has-text-gray" onChange={handleChangePaymentMethod}>
                {getPaymentOptions()}
                <option value="WeChat">WeChat</option>
                <option value="NewCard">New Card</option>
                </select>
            </div>
          </div>
          <div className={`field has-addons ${paymentMethod != 'NewCard' ? 'is-hidden' : ''}`}>
            <p className="control has-text-grey-light">Name On Card:</p>
            <div className="control">
              <input className="input" type="text" name="name"  placeholder="Jane Doe" required />
            </div>
          </div>
          <div className={`field has-addons ${paymentMethod != 'NewCard' ? 'is-hidden' : ''}`}>
            <p className="control has-text-grey-light">Card Number:</p>
            <div className="control">
              <CardElement />
            </div>
          </div>
        </div>
        <div id="Balance__Form" className={count != 2 ? "is-hidden" : ""}>
          <div className="field has-addons Balance__FormConfirmation">
            <p className="control has-text-grey-light">Payment Method</p>
            <a onClick={() => {setCount(1); onFormCompleted(null);}}className="control is-primary highlight has-text-weight-light">change</a>
          </div>
          <div className="field has-addons Balance__FormConfirmation">
            <p className="control has-text-grey-light has-text-weight-light">
              {paymentMethod != "WeChat" ? (`Debit ending in ${stripeCardInfo?.card?.last4 || stripeCardInfo?.token?.card?.last4}`) : (`WeChat`)}
            </p>
          </div>
        </div>
        <div id="Balance__Control" className="field is-grouped">
          <p className="control">
            <a
              onClick={() => {
                count <= 0 ? "" : setCount(count - 1);
                onFormCompleted(null)
              }}
              className="button is-primary"
              disabled={count == 0 ? "disabled" : ""}
            >
              Previous
            </a>
          </p>
          <p className="control">
            <a
              onClick={() => {
                handleNext();
              }}
              className="button is-primary"
              disabled={(count == 2 || stripeCardInfo != 'invalid') ? "disabled" : ""}
            >
              Continue
            </a>
          </p>
        </div>
      </div>
    </form>
  );
});

class Balance extends React.Component {
  constructor(props) {
    super(props);
    const search = props.location.search;
    const params = new URLSearchParams(search);
    const balance= Boolean(params.get('balanceerror')) ? true : false;
    this.state = { step: 0, profile: store.getState().profileState, summary: null, wechat: false, balanceerror: balance};
    this.formRef = React.createRef();

    this.formComplete = this.formComplete.bind(this);
    this.confirmPay = this.confirmPay.bind(this);
    this.closeWeChatHandler = this.closeWeChatHandler.bind(this);
  }

  formComplete(result) {
    this.setState({summary: result});
  }

  componentDidMount() {
    store.subscribe(profile => {
      this.setState({ profile: store.getState().profileState });
    });
  }

  handleStepChange(direction) {
    const desiredStep = this.state.step + direction;
    if (desiredStep > 2 || desiredStep < 0) return;
    this.setState({ step: desiredStep });
  }

  handlePaymentSource(src, that){
    balanceAPI.pay(src.id, this.state.summary.amount)
      .then((data) => {
        if(data.error){
          console.log(data.error);
          return that.props.history.push('/fail');
        } else {
          store.dispatch({type: "Update Balance", data: {balance: data.ending_balance} });
          store.dispatch({type: "Update Transactions", data: {transactions: data.transactions}});
          that.props.history.push('/success');
        }

      });
  }

  pollSource(src, that, timeout = 300000, interval = 500, start = null){
    const endStates = ['pending', 'canceled', 'failed', 'consumed'];
    start = start ? start : Date.now()
    stripePromise
      .then(stripe => {
        stripe
      .retrieveSource({
        id: src.id,
        client_secret: src.client_secret,
      })
      .then(function(result) {
        if (endStates.includes(result.source.status) && Date.now() < start + timeout) {
          // Not done yet. Let's wait and check again.
           setTimeout(function(){
             that.pollSource(src, that, timeout, interval, start)
            }, 3000);
        } else {

          if (endStates.includes(result.source.status)) {
            // Status has not changed yet. Let's time out.
            console.log(result.source.status)
            console.warn(new Error('Polling timed out.'));
          } else {
            that.handlePaymentSource(result.source, that);
          }
        }
      });
      })
  }

  confirmPay(){
    const that = this;
    if(this.state.summary.type == "WeChat"){
      stripePromise
      .then(stripe => {
        stripe.createSource({
          type: 'wechat',
          amount: this.state.summary.amount*100,
          currency: 'usd',
        })
        .then(function(result) {
          that.setState({wechat: true, wechat_qrcode: result.source.wechat["qr_code_url"]})
          that.pollSource(result.source, that)
        });
      })
    }
    else if(this.state.summary.type == "SavedCard"){
      balanceAPI.pay(this.state.summary.card.id, this.state.summary.amount, true)
      .then((data) => {
        if(data.error){
          console.log(data.error);
          return that.props.history.push('/fail');
        } else {
          store.dispatch({type: "Update Balance", data: {balance: data.ending_balance} });
          store.dispatch({type: "Update Transactions", data: {transactions: data.transactions}});
          that.props.history.push('/success');
        }
      });
    }
    else if(this.state.summary.type == "NewCard"){
      balanceAPI.pay(this.state.summary.card.token.id, this.state.summary.amount)
      .then((data) => {
        if(data.error){
          console.log(data.error);
          return that.props.history.push('/fail');
        } else {
          store.dispatch({type: "Update Balance", data: {balance: data.ending_balance} });
          store.dispatch({type: "Update Transactions", data: {transactions: data.transactions}});
          that.props.history.push('/success');
        }
      });
    }


  }

  closeWeChatHandler() {
    this.setState({wechat: false});
  }

  render() {
    return (
      <div id="Balance" className="container is-fluid">
        {this.state.wechat && (<div className="overlay"><div className="overlay-center">
          <button onClick={this.closeWeChatHandler}class="modal-close is-large"></button>
          <div className="card">
            <div className="card-content">
            <QRCode value={this.state.wechat_qrcode} />
            </div>
          </div>
          </div>
          </div>)}
        <div className="columns">
          <div className={`column is-three-quarters ${!this.state.summary ? '' : 'is-hidden-touch'}`}>
            <div id="Balance__PaymentFormCard" className="card">
              <header className="card-header">
                <p className="is-size-3 card-header-title">Add Money</p>
              </header>
              <div className="card-content">
                <Elements stripe={stripePromise}>
                  <CheckOutForm
                    ref={this.formRef}
                    onFormCompleted={this.formComplete}
                    sources={this.state.profile?.stripe.sources.data}
                    balanceerror={this.state.balanceerror}
                  />
                </Elements>
              </div>
            </div>
          </div>
          <div className={`column ${this.state.summary ? '' : 'is-hidden-touch'}`}>
            <div id="Balance__Summary" className="card">
              <header className="card-header">
                <p className="is-size-3 card-header-title">Order Summary</p>
              </header>
              <div className="card-content">
              {this.state.summary?.amount && (<div className="Balance__SummaryContainer">
                  <p>Item(s):</p>
                  <p>${this.state.summary?.amount} of Tuto Credit</p>
                  <p>Total: ${this.state.summary?.amount}</p>
              </div>)}
              {this.state.summary?.amount && (<a onClick={this.confirmPay} className="button is-primary has-text-centered is-hidden-touch"><span>Place Order</span></a>)}
              {this.state.summary?.amount &&
              (<div className="field is-grouped is-grouped-centered is-hidden-desktop">
              <p className="control">
                <a
                onClick={() => {
                  this.setState({summary: null});
                }}
                className="button is-light">
                  Previous
                </a>
              </p>
              <p className="control">
                <a onClick={this.confirmPay} className="button is-primary">
                  Place Order
                </a>
              </p>
            </div>)}
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }
}

const BalanceSteps = ({ step }) => {
  const steps = ["Select Amount", "Select Payment Method", "Confirmation"];
  let stepElements = steps.map((stepName, i) => {
    return (
      <li key={i} className={`steps-segment ${step == i ? "is-active" : ""}`}>
        <span className={`steps-marker ${step == i ? "is-hollow" : ""}`}>
          {i + 1}
        </span>
        <div className="steps-content">
          <p className="is-size-4 has-text-weight-bold has-text-grey-light">
            {stepName}
          </p>
        </div>
      </li>
    );
  });

  return (
    <ul className="steps has-content-centered has-gaps is-short">{stepElements}</ul>
  );
};

export default withRouter(Balance);
