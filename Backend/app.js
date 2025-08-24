// --- 1. Constants and Setup ---
const MODULE_ADDRESS = "0x929f4f9a78a2c787fb206567c9dcb01dad770f0f4cdc2f599b71a85547427c52"; // Ensure this is your latest contract address
const NODE_URL = "https://fullnode.testnet.aptoslabs.com/v1";
let walletAddress = null;

// --- 2. Wallet Connection ---
const connectBtn = document.getElementById("connectBtn");
const walletAddressElem = document.getElementById("walletAddress");

connectBtn.addEventListener("click", async () => {
    const client = window.aptos;
    if (!client) {
        updateStatus("Petra Wallet not found. Please install it and refresh.");
        return;
    }
    try {
        const response = await client.connect();
        walletAddress = response.address;
        walletAddressElem.innerText = `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
        updateStatus("Wallet connected successfully!");
    } catch (error) {
        console.error(error);
        updateStatus(`Failed to connect wallet. Error: ${error.message}`);
    }
});

// --- 3. Smart Contract Interaction ---
const initIssuerBtn = document.getElementById("initIssuerBtn");
const initStudentBtn = document.getElementById("initStudentBtn");
const issueCertBtn = document.getElementById("issueCertBtn");
const viewCertsBtn = document.getElementById("viewCertsBtn");
const revokeCertBtn = document.getElementById("revokeCertBtn"); // NEW: Get revoke button

// Initialize Issuer Account
initIssuerBtn.addEventListener("click", async () => {
    const client = window.aptos;
    if (!client || !walletAddress) {
        updateStatus("Please connect your wallet first.");
        return;
    }
    const payload = {
        function: `${MODULE_ADDRESS}::educertify::initialize_issuer`,
        type_arguments: [],
        arguments: [],
    };
    try {
        updateStatus("Sending transaction to initialize issuer...");
        await client.signAndSubmitTransaction(payload);
        updateStatus("Issuer account initialized successfully!");
    } catch (error) {
        console.error(error);
        updateStatus(`Error: ${error.message}`);
    }
});

// Initialize Student Certificate Store
initStudentBtn.addEventListener("click", async () => {
    const client = window.aptos;
    if (!client || !walletAddress) {
        updateStatus("Please connect your wallet first.");
        return;
    }
    const payload = {
        function: `${MODULE_ADDRESS}::educertify::initialize_certificate_store`,
        type_arguments: [],
        arguments: [],
    };
    try {
        updateStatus("Sending transaction to initialize store...");
        await client.signAndSubmitTransaction(payload);
        updateStatus("Certificate store initialized successfully!");
    } catch (error) {
        console.error(error);
        updateStatus(`Error: ${error.message}`);
    }
});

// Issue a new certificate
issueCertBtn.addEventListener("click", async () => {
    const client = window.aptos;
    if (!client || !walletAddress) {
        updateStatus("Please connect your wallet first.");
        return;
    }
    const studentAddress = document.getElementById("studentAddress").value;
    const courseName = document.getElementById("courseName").value;
    const issuerName = document.getElementById("issuerName").value;
    const certUrl = document.getElementById("certUrl").value;
    const issuanceDate = Math.floor(Date.now() / 1000);
    if (!studentAddress || !courseName || !issuerName || !certUrl) {
        updateStatus("Please fill in all certificate fields.");
        return;
    }
    const payload = {
        function: `${MODULE_ADDRESS}::educertify::issue_certificate`,
        type_arguments: [],
        arguments: [studentAddress, courseName, issuerName, issuanceDate.toString(), certUrl],
    };
    try {
        updateStatus("Issuing certificate...");
        await client.signAndSubmitTransaction(payload);
        updateStatus("Certificate issued successfully!");
    } catch (error) {
        console.error(error);
        updateStatus(`Error: ${error.message}`);
    }
});

// NEW: Event listener for the Revoke Certificate button
revokeCertBtn.addEventListener("click", async () => {
    const client = window.aptos;
    if (!client || !walletAddress) {
        updateStatus("Please connect your wallet first.");
        return;
    }

    const studentAddress = document.getElementById("revokeStudentAddress").value;
    const certId = document.getElementById("revokeCertId").value;

    if (!studentAddress || !certId) {
        updateStatus("Please fill in both student address and certificate ID to revoke.");
        return;
    }

    const payload = {
        function: `${MODULE_ADDRESS}::educertify::revoke_certificate`,
        type_arguments: [],
        arguments: [studentAddress, certId],
    };

    try {
        updateStatus("Revoking certificate...");
        await client.signAndSubmitTransaction(payload);
        updateStatus("Certificate revoked successfully!");
    } catch (error) {
        console.error(error);
        updateStatus(`Error: ${error.message}`);
    }
});


// View Certificates
viewCertsBtn.addEventListener("click", async () => {
    if (!walletAddress) {
        updateStatus("Please connect your wallet first.");
        return;
    }
    const payload = {
        function: `${MODULE_ADDRESS}::educertify::get_certificates`,
        type_arguments: [],
        arguments: [walletAddress],
    };
    try {
        updateStatus("Fetching certificates...");
        const response = await fetch(`${NODE_URL}/view`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const certificates = await response.json();
        displayCertificates(certificates[0]);
        updateStatus("Certificates loaded.");
    } catch (error) {
        console.error(error);
        updateStatus(`Error fetching certificates: ${error.message}`);
    }
});


// --- 4. UI Helper Functions ---
const statusElem = document.getElementById("status");
const certificateListElem = document.getElementById("certificate-list");

function updateStatus(message) {
    statusElem.innerText = message;
    setTimeout(() => {
        if(statusElem.innerText === message) {
            statusElem.innerText = "";
        }
    }, 5000);
}

// UPDATED: This function now handles the 'revoked' state
function displayCertificates(certs) {
    certificateListElem.innerHTML = "";
    if (!certs || certs.length === 0) {
        certificateListElem.innerHTML = "<p>No certificates found.</p>";
        return;
    }
    certs.forEach((cert, index) => {
        const certElem = document.createElement("div");
        certElem.className = "certificate";

        // NEW: Add a 'revoked' class if the certificate is revoked
        if (cert.is_revoked) {
            certElem.classList.add("revoked");
        }

        const date = new Date(parseInt(cert.issuance_date) * 1000);
        const dateString = date.toLocaleDateString();
        const qrCodeId = `qrcode-${index}`;

        certElem.innerHTML = `
            <div id="${qrCodeId}" class="qrcode"></div>
            <p><strong>ID:</strong> ${cert.id}</p> <p><strong>Course:</strong> ${cert.course_name}</p>
            <p><strong>Issuer:</strong> ${cert.issuer_name}</p>
            <p><strong>Date:</strong> ${dateString}</p>
            <p><a href="${cert.certificate_url}" target="_blank">View Certificate Image</a></p>
        `;
        certificateListElem.appendChild(certElem);

        const verificationUrl = `https://explorer.aptoslabs.com/account/${cert.student_address}?network=testnet`;
        
        new QRCode(document.getElementById(qrCodeId), {
            text: verificationUrl,
            width: 128,
            height: 128,
            correctLevel: QRCode.CorrectLevel.H
        });
    });
}