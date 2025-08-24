import { Link } from 'react-router-dom';

// This component displays the main navigation links and the connect button.
// It receives the walletAddress and the onConnect function as props from App.jsx.
export default function Navbar({ walletAddress, onConnect }) {
  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">🌱 EduCertify</Link>
      <div className="nav-links">
        <Link to="/student">Student Dashboard</Link>
        <Link to="/teacher">Teacher Dashboard</Link>
        <button id="connectBtn" onClick={onConnect}>
          {walletAddress ? `Connected: ${walletAddress.slice(0, 6)}...` : 'Connect Wallet'}
        </button>
      </div>
    </nav>
  );
}