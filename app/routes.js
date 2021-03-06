import React from 'react';
import { Route, IndexRoute } from 'react-router';
import App from './containers/App';
import MapPage from './containers/MapPage';
import StatsPage from './containers/StatsPage';

function NoMatch () {
  return <div>No pages found!</div>;
};

export default (
  <Route path="/" component={App}>
    <IndexRoute component={MapPage} />
    <Route path="stats" component={StatsPage} />
    <Route path="*" component={NoMatch}/>
  </Route>
);
