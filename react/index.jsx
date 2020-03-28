import React, {Suspense} from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter as Router} from 'react-router-dom';
import Loading from "./components/loading.jsx";
const App = React.lazy(() =>  import('./components/app.jsx'));


ReactDOM.render(
  <Suspense fallback={<Loading/>}><Router><App/></Router></Suspense>,
  document.getElementById('root')
);