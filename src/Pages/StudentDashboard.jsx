import { useState } from 'react';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import CertificateModal from '../components/CertificateModal'; // Assuming modal is in components

// This component represents the dashboard for the student.
export default function StudentDashboard({ walletAddress, runTransaction, executeAction, MODULE_ADDRESS, NODE_URL }) {
  const [isLoading, setIsLoading] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);

  const handleInitializeStudentStore = async () => {
    setIsLoading(true);
    const promise = runTransaction({ function: `${MODULE_ADDRESS}::educertify::initialize_certificate_store`, type_arguments: [], arguments: [] });
    await executeAction(promise, { loading: "Initializing store...", success: "Certificate store initialized!", error: "Failed to initialize store." });
    setIsLoading(false);
  };

  const handleViewCertificates = async () => {
    if (!walletAddress) return toast.error("Please connect your wallet first.");
    const toastId = toast.loading("Fetching certificates...");
    setIsLoading(true);
    try {
      const response = await fetch(`${NODE_URL}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ function: `${MODULE_ADDRESS}::educertify::get_certificates`, type_arguments: [], arguments: [walletAddress] }),
      });
      if (!response.ok) throw new Error("Could not fetch certificates. Account may not be initialized.");
      const data = await response.json();
      setCertificates(data[0] || []);
      toast.success("Certificates loaded.", { id: toastId });
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: toastId });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareToTwitter = () => {
    if (!walletAddress || certificates.length === 0) return;
    const certCount = certificates.length;
    const text = `I just updated my Skills Passport on EduCertify with ${certCount} verifiable credential${certCount > 1 ? 's' : ''} on @Aptos!`;
    const url = `https://explorer.aptoslabs.com/account/${walletAddress}?network=testnet`;
    const hashtags = 'EduCertify,Aptos';
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${hashtags}`;
    window.open(twitterUrl, '_blank');
  };

  const handleShareToLinkedIn = () => {
    if (!walletAddress) return;
    const url = `https://explorer.aptoslabs.com/account/${walletAddress}?network=testnet`;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, '_blank');
  };


  return (
    <>
        <main>
            <section className="card" id="student-section">
                <h2>For Students - My Skills Passport</h2>
                {!walletAddress && <p className="notice">Please connect your wallet to manage your passport.</p>}
                <button onClick={handleInitializeStudentStore} disabled={!walletAddress || isLoading}>{isLoading ? 'Processing...' : 'Initialize Certificate Store'}</button>
                <hr />
                <button onClick={handleViewCertificates} disabled={!walletAddress || isLoading}>View My Certificates</button>
                {certificates.length > 0 && (
                  <>
                    <button onClick={handleShareToTwitter} className="twitter-btn">Share on Twitter</button>
                    <button onClick={handleShareToLinkedIn} className="linkedin-btn">Share on LinkedIn</button>
                  </>
                )}
                <div id="certificate-list">
                  {certificates.map((cert) => (
                    <div key={cert.id} className={`certificate ${cert.is_revoked ? 'revoked' : ''}`} onClick={() => setSelectedCert(cert)}>
                      <div className="qrcode"><QRCode value={`https://explorer.aptoslabs.com/account/${cert.student_address}?network=testnet`} size={128} /></div>
                      <p><strong>ID:</strong> {cert.id}</p>
                      <p><strong>Course:</strong> {cert.course_name}</p>
                      <p><strong>Issuer:</strong> {cert.issuer_name}</p>
                      <p><strong>Date:</strong> {new Date(parseInt(cert.issuance_date) * 1000).toLocaleDateString()}</p>
                      <p><a href={cert.certificate_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>View Image</a></p>
                    </div>
                  ))}
                </div>
              </section>
        </main>
        {selectedCert && <CertificateModal cert={selectedCert} onClose={() => setSelectedCert(null)} />}
    </>
  );
}