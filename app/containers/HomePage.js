import React, { Component } from 'react';
import Home from '../components/Home';
import Header from '../components/nav/Header';

export default class HomePage extends Component {
  render() {
    return (
      <div>
        <Header />
        <Home />
      </div>
    );
  }
}
