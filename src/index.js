import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Patch Node.prototype.removeChild to handle Google Places Autocomplete DOM conflicts
// This is a known issue where Google Places modifies the DOM in ways React doesn't expect
const originalRemoveChild = Node.prototype.removeChild;
Node.prototype.removeChild = function(child) {
  try {
    // Check if the child is actually a child of this node
    if (child && child.parentNode === this) {
      return originalRemoveChild.call(this, child);
    }
    // If not a child (Google Places moved it), return the child without error
    // This prevents React from throwing "not a child" errors
    return child;
  } catch (error) {
    // If the error is about the node not being a child, suppress it
    if (error.message && error.message.includes('not a child')) {
      return child;
    }
    // Re-throw other errors
    throw error;
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
