import React, { useEffect, setState, useState } from "react";
import ReactDOM from "react-dom";
import "./balance.scss";
import profileStore from "../store/profileStore.js";
import { loadStripe } from "@stripe/stripe-js";
import {
  CardElement,
  Elements,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe("pk_test_7lBG8gut6VvygbnBDxJHYiK300GhqhqUOC");

const CheckOutForm = React.forwardRef(({ onFormCompleted, sources }, ref) => {
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
        .createPaymentMethod({
          type: "card",
          card: elements.getElement(CardElement),
          billing_details: {
            name: document.querySelector('input[name="name"]').value
          }
        })
        .then(function(result) {
          setStripeCardInfo(result.paymentMethod);
          if(result.error){
            setCount(1);
          } else {
            onFormCompleted({type: "NewCard", card: result.paymentMethod, amount: amount.value});
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
          <div className="field has-addons">
            <p className="control has-text-grey-light">Select Amount to Add</p>
            <div className="control">
              <input
                id="FormAmount"
                className="input"
                type="number"
                name="amount"
                placeholder="Amount in USD"
              />
            </div>
          </div>
        </div>
        <div id="Balance__Form" className={count != 1 ? "is-hidden" : ""}>
          <div className="field has-addons">
            <p className="control has-text-grey-light is-hidden-touch">Select Payment Method</p>
            <div className="select is-rounded">
              <select id='paymentMethod' onChange={handleChangePaymentMethod}>
                {getPaymentOptions()}
                <option value="WeChat">WeChat</option>
                <option value="NewCard" selected={paymentMethod == "NewCard" ? true : ''}>New Card</option>
                </select>
            </div>
          </div>
          <div className={`field has-addons ${paymentMethod != 'NewCard' ? 'is-hidden' : ''}`}>
            <p className="control has-text-grey-light">Name</p>
            <div className="control">
              <input
                className="input"
                type="text"
                name="name"
                placeholder="Jane Doe"
                required
              />
            </div>
          </div>
          <div className={`field has-addons ${paymentMethod != 'NewCard' ? 'is-hidden' : ''}`}>
            <p className="control has-text-grey-light">Card</p>
            <div className="control">
              <CardElement />
            </div>
          </div>
        </div>
        <div id="Balance__Form" className={count != 2 ? "is-hidden" : ""}>
          <div className="field has-addons">
            <p className="control has-text-grey-light">Payment Method</p>
            <a onClick={() => {setCount(1); onFormCompleted(null);}}className="control is-primary highlight has-text-weight-light">change</a>
          </div>
          <div className="field has-addons">
            <p className="control has-text-grey-light has-text-weight-light">
              {paymentMethod != "WeChat" ? (`Debit ending in ${stripeCardInfo?.card?.last4}`) : (`WeChat`)}
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
              disabled={count == 2 ? "disabled" : ""}
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
    this.state = { step: 0, profile: profileStore.getState(), summary: null};
    this.formRef = React.createRef();

    this.formComplete = this.formComplete.bind(this);
  }

  formComplete(result) {
    this.setState({summary: result});
  }

  componentDidMount() {
    profileStore.subscribe(profile => {
      this.setState({ profile: profileStore.getState() });
    });
  }

  handleStepChange(direction) {
    const desiredStep = this.state.step + direction;
    if (desiredStep > 2 || desiredStep < 0) return;
    this.setState({ step: desiredStep });
  }

  render() {
    return (
      <div id="Balance" className="container is-fluid">
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
              {this.state.summary?.amount && (<a className="button is-primary has-text-centered is-hidden-touch"><span>Place Order</span></a>)}
              {this.state.summary?.amount && 
              (<div className="field is-grouped is-grouped-centered is-hidden-desktop">
              <p className="control">
                <a
                onClick={() => {
                  this.setState({summary: null})
                }} 
                className="button is-light">
                  Previous
                </a>
              </p>
              <p className="control">
                <a className="button is-primary">
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

export default Balance;
