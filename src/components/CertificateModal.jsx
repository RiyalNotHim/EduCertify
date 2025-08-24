// CertificateModal.jsx
import React from "react";

export default function CertificateModal({ certificate, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Certificate Details</h2>
        <p><strong>Student:</strong> {certificate.student}</p>
        <p><strong>Course:</strong> {certificate.course}</p>

        <button onClick={onClose} className="close-btn">
          Close
        </button>
      </div>
    </div>
  );
}
