import React, { Component } from 'react';


class Dashboard extends Component {
    render() {
        return (
        <div className="container">
            <img className="col-sm-4 col-sm-offset-4 " id="shareatlogo" src="/images/shareatlogo.jpg" />
            <div className="form-group">
                    <label style={{textAlign:'center'}} className="col-sm-12" htmlFor="email" id="emailForm">Email</label>
                    <input id = "email"  name="emailInputBox" type="text" className="col-sm-6 col-sm-offset-3 form-control" placeholder="Email" />
                    <label style={{textAlign:'center'}} className="col-sm-12" htmlFor="password" id="passwordForm">Password</label>
                    <input id = "password" name="passwordInputBox" type="password" className="col-sm-6 col-sm-offset-3 form-control" placeholder="Password" />
                    <button id="registerButton" style={{display:"block"}} 
                    className="col-sm-2 col-sm-offset-5 btn btn-success">Register</button>
                    <button id = 'loginBtn' style={{display:"block", marginTop: "10px"}} 
                    className="col-sm-2 col-sm-offset-5  btn btn-danger">Login</button>
                    <a id = 'loginBtn' style={{display:"block", marginTop: "10px"}} 
                    className="col-sm-2 col-sm-offset-5  btn btn-primary" href="/merchant/authorize">Connect With Stripe Testing</a>
            </div>
        </div>
        );
    }
}




export default Dashboard;