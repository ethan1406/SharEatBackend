import React from 'react';
import ReactDOM from 'react-dom';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';

//redux stuff

import {BrowserRouter, Route, Switch} from 'react-router-dom';



ReactDOM.render(
	<BrowserRouter>
		<div>
			<Navbar />
			<Switch>
				<Route exact={true} path="/merchant/dashboard" component={Dashboard}/>
			</Switch>
		</div>
	</BrowserRouter>
	,
	document.getElementById('root')
);





