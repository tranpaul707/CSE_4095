import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Route, Routes } from 'react-router-dom';
import './styles.css';

function App() {
  return <BrowserRouter><header className="site-header"><Link className="brand" to="/">✳ Math Meadow</Link><nav aria-label="Main navigation"><NavLink to="/practice/setup">Practice</NavLink><NavLink to="/statistics">Statistics</NavLink><NavLink to="/settings">Settings</NavLink></nav></header><main id="main"><Routes><Route path="/" element={<><h1>A little practice.<br />A lot of growth.</h1><Link to="/practice/setup">Start Practice</Link></>} /><Route path="*" element={<h1>Getting ready to grow</h1>} /></Routes></main></BrowserRouter>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
