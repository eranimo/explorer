import React, { Component, PropTypes } from 'react';

export function formatCurrency(number) {
  const formatted = '$' + _.round(number, 2).toLocaleString();
  if (number < 0) {
    return <span style={{color: 'red'}}>{formatted}</span>;
  } else if (number > 0) {
    return <span style={{color: 'rgb(8, 204, 8)'}}>{formatted}</span>;
  }
  return formatted;
}


export function formatGood(good){
  if (!good) {
    return <span>None</span>
  }
  return <span style={{color: good.color}}>{good.title}</span>
}
