import React, { Component } from 'react';
import { Link } from 'react-router';
import styles from './Home.module.css';

export default class Home extends Component {
  render() {
    return (
      <div>
        <div className={styles.container}>
          <Link to="/map">to Map</Link>
        </div>
      </div>
    );
  }
}
