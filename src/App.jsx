import { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import particlesConfig from './particles-config';
import './style.css';
import toast, { Toaster } from 'react-hot-toast';
import Confetti from 'react-confetti';

const MODULE_ADDRESS = "0x929f4f9a78a2c787fb206567c9dcb01dad770f0f4cdc2f599b71a85547427c52";
const NODE_URL = "https://fullnode.testnet.aptoslabs.com/v1";

function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const particlesInit = useCallback(async (engine) => { await loadSlim(engine); }, []);

  const handleConnect = async () => {
    const client = window.aptos;
    if (!client) return toast.error("Petra Wallet not found.");
    try {
      const response = await client.connect();
      setWalletAddress(response.address);
      toast.success("Wallet connected!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to connect wallet.");
    }
  };

  // Centralized transaction functions to be passed as props
  const runTransaction = async (payload) => {
    const client = window.aptos;
    if (!client || !walletAddress) {
      toast.error("Please connect wallet first.");
      throw new Error("Wallet not connected");
    }
    const tx = await client.signAndSubmitTransaction({ payload });
    return tx.hash;
  };

  const executeAction = async (actionPromise, messages) => {
    let txHash = null;
    try {
        txHash = await toast.promise(actionPromise, {
            loading: messages.loading,
            success: (result) => messages.success,
            error: (err) => messages.error || `Error: ${err.message}`,
        });
        if (txHash) {
            toast.success(
                <span>
                    {messages.success}
                    <a href={`https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`} target="_blank" rel="noopener noreferrer" style={{color: '#3498db', fontWeight: 'bold', marginLeft: '10px'}}>View Tx</a>
                </span>, { duration: 6000 }
            );
        }
        return txHash;
    } catch (error) {
        console.error("Action executed with an error", error);
        return null;
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} toastOptions={{duration: 6000}} />
      {showConfetti && <Confetti recycle={false} onConfettiComplete={() => setShowConfetti(false)} />}
      <Particles id="tsparticles" init={particlesInit} options={particlesConfig} />

      <div className="container">
        <Navbar walletAddress={walletAddress} onConnect={handleConnect} />
        <Routes>
          <Route path="/" element={
            <div className="card">
                <h2>Welcome to EduCertify!</h2>
                <p>Please select a dashboard from the navigation above to get started.</p>
            </div>
          } />
          <Route path="/student" element={
            <StudentDashboard 
                walletAddress={walletAddress} 
                runTransaction={runTransaction}
                executeAction={executeAction}
                MODULE_ADDRESS={MODULE_ADDRESS}
                NODE_URL={NODE_URL}
            />} 
          />
          <Route path="/teacher" element={
            <TeacherDashboard 
                walletAddress={walletAddress}
                runTransaction={runTransaction}
                executeAction={executeAction}
                MODULE_ADDRESS={MODULE_ADDRESS}
                setShowConfetti={setShowConfetti}
            />} 
          />
        </Routes>
      </div>
    </>
  );
}

export default App;