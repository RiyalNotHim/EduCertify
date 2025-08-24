import { useState } from 'react';
import toast from 'react-hot-toast';

// This component represents the dashboard for the certificate issuer (teacher).
export default function TeacherDashboard({ walletAddress, runTransaction, executeAction, MODULE_ADDRESS, setShowConfetti }) {
  const [isLoading, setIsLoading] = useState(false);
  const [issueFormData, setIssueFormData] = useState({ studentAddress: '', courseName: '', issuerName: '', certUrl: '' });
  const [revokeFormData, setRevokeFormData] = useState({ studentAddress: '', certId: '' });

  // State to control form visibility
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showRevokeForm, setShowRevokeForm] = useState(false);

  const handleInitializeIssuer = async () => {
    setIsLoading(true);
    const promise = runTransaction({ function: `${MODULE_ADDRESS}::educertify::initialize_issuer`, type_arguments: [], arguments: [] });
    await executeAction(promise, { loading: "Initializing issuer...", success: "Issuer account initialized!", error: "Failed to initialize." });
    setIsLoading(false);
  };

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    const { studentAddress, courseName, issuerName, certUrl } = issueFormData;
    if (!studentAddress || !courseName || !issuerName || !certUrl) return toast.error("Please fill in all fields.");
    setIsLoading(true);
    const promise = runTransaction({
      function: `${MODULE_ADDRESS}::educertify::issue_certificate`,
      type_arguments: [],
      arguments: [studentAddress, courseName, issuerName, Math.floor(Date.now() / 1000).toString(), certUrl],
    });
    const txHash = await executeAction(promise, { loading: "Issuing certificate...", success: "Certificate issued!", error: "Failed to issue certificate." });
    if (txHash) {
        setShowConfetti(true);
        setShowIssueForm(false); // Hide form on success
    }
    setIssueFormData({ studentAddress: '', courseName: '', issuerName: '', certUrl: '' });
    setIsLoading(false);
  };

  const handleRevokeCertificate = async (e) => {
    e.preventDefault();
    const { studentAddress, certId } = revokeFormData;
    if (!studentAddress || !certId) return toast.error("Please fill in all fields.");
    setIsLoading(true);
    const promise = runTransaction({
      function: `${MODULE_ADDRESS}::educertify::revoke_certificate`,
      type_arguments: [], arguments: [studentAddress, certId],
    });
    await executeAction(promise, { loading: "Revoking certificate...", success: "Certificate revoked!", error: "Failed to revoke certificate." });
    setRevokeFormData({ studentAddress: '', certId: '' });
    setShowRevokeForm(false); // Hide form on success
    setIsLoading(false);
  };

  return (
    <main>
      <section className="card" id="issuer-section">
        <h2>For Issuers (Teachers)</h2>
        {!walletAddress && <p className="notice">Please connect your wallet to manage certificates.</p>}
        <button onClick={handleInitializeIssuer} disabled={!walletAddress || isLoading}>{isLoading ? 'Processing...' : 'Initialize Issuer Account'}</button>
        <hr />

        {/* --- Issue Certificate Section --- */}
        {!showIssueForm ? (
          <button onClick={() => setShowIssueForm(true)} disabled={!walletAddress || isLoading}>Issue a New Certificate</button>
        ) : (
          <>
            <h3>Issue a New Certificate</h3>
            <form onSubmit={handleIssueCertificate}>
              <label htmlFor="studentAddress">Student's Wallet Address</label>
              <input id="studentAddress" name="studentAddress" type="text" value={issueFormData.studentAddress} onChange={(e) => setIssueFormData({...issueFormData, studentAddress: e.target.value})} placeholder="0x..."/>
              <label htmlFor="courseName">Course Name</label>
              <input id="courseName" name="courseName" type="text" value={issueFormData.courseName} onChange={(e) => setIssueFormData({...issueFormData, courseName: e.target.value})} placeholder="e.g., Intro to Move"/>
              <label htmlFor="issuerName">Issuer Name</label>
              <input id="issuerName" name="issuerName" type="text" value={issueFormData.issuerName} onChange={(e) => setIssueFormData({...issueFormData, issuerName: e.target.value})} placeholder="e.g., Prof. Smith"/>
              <label htmlFor="certUrl">Certificate Image URL</label>
              <input id="certUrl" name="certUrl" type="text" value={issueFormData.certUrl} onChange={(e) => setIssueFormData({...issueFormData, certUrl: e.target.value})} placeholder="https://..."/>
              <div className="form-actions">
                <button type="button" onClick={() => setShowIssueForm(false)} className="secondary">Cancel</button>
                <button type="submit" disabled={!walletAddress || isLoading}>{isLoading ? 'Issuing...' : 'Issue Certificate'}</button>
              </div>
            </form>
          </>
        )}

        <hr />

        {/* --- Revoke Certificate Section --- */}
        {!showRevokeForm ? (
            <button onClick={() => setShowRevokeForm(true)} className="danger" disabled={!walletAddress || isLoading}>Revoke a Certificate</button>
        ) : (
            <>
                <h3>Revoke a Certificate</h3>
                <form onSubmit={handleRevokeCertificate}>
                  <label htmlFor="revokeStudentAddress">Student's Wallet Address</label>
                  <input id="revokeStudentAddress" name="revokeStudentAddress" type="text" value={revokeFormData.studentAddress} onChange={(e) => setRevokeFormData({...revokeFormData, studentAddress: e.target.value})} placeholder="0x..."/>
                  <label htmlFor="revokeCertId">Certificate ID</label>
                  <input id="revokeCertId" name="revokeCertId" type="text" value={revokeFormData.certId} onChange={(e) => setRevokeFormData({...revokeFormData, certId: e.target.value})} placeholder="e.g., 0, 1, 2..."/>
                  <div className="form-actions">
                    <button type="button" onClick={() => setShowRevokeForm(false)} className="secondary">Cancel</button>
                    <button type="submit" className="danger" disabled={!walletAddress || isLoading}>{isLoading ? 'Revoking...' : 'Revoke Certificate'}</button>
                  </div>
                </form>
            </>
        )}
      </section>
    </main>
  );
}
