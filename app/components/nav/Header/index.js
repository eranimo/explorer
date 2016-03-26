import React, { Component } from 'react';
import { Link } from 'react-router';
import styles from './style.module.css';
import Controls from '../Controls';

export default class Header extends Component {
  render() {
    return (
      <div className={styles.Header}>
        <Link to="/map" className={styles.Link} activeClassName={styles.Link__active}>Map</Link>
        <Link to="/stats" className={styles.Link} activeClassName={styles.Link__active}>Statistics</Link>
        <Controls />
      </div>
    );
  }
}
