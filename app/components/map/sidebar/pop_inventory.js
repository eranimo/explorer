import React, { Component, PropTypes } from 'react';

export default class PopInventory extends Component {
  static propTypes = {
    inventory: PropTypes.array.isRequired
  };

  render () {
    let { inventory } = this.props;
    inventory = _.filter(inventory, (i) => {
      return i.contents[0] && i.contents[0].amount > 0
    });
    if (inventory.length === 0) {
      return (<span>None</span>);
    }
    return (
      <div>
        {inventory.map((i) => {
          return (
            <div>
              <span style={{color: i.good.color}}>{i.good.title}</span>: &nbsp;
              {i.contents[0] ? i.contents[0].amount : 0}
            </div>
          );
        })}
      </div>
    );
  }
}
