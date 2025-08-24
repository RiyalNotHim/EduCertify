module 0x929f4f9a78a2c787fb206567c9dcb01dad770f0f4cdc2f599b71a85547427c52::educertify {

    // Imports
    use std::signer;
    use std::string::{String};
    use std::vector;
    use std::error;

    // --- Structs ---

    struct Certificate has store, copy, drop {
        id: u64,
        student_address: address,
        course_name: String,
        issuer_name: String,
        issuance_date: u64,
        certificate_url: String,
        issuer_address: address, // NEW: Securely tracks the issuer's address
        is_revoked: bool,      // NEW: Flag to track revocation status
    }

    struct IssuerCapability has key {}

    struct CertificateStore has key {
        certificates: vector<Certificate>,
    }

    // --- Error Codes ---
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_CERTIFICATE_NOT_FOUND: u64 = 2;
    const E_STORE_ALREADY_EXISTS: u64 = 3;
    const E_ISSUER_CAP_ALREADY_EXISTS: u64 = 4;

    // --- Functions ---

    public entry fun initialize_issuer(deployer: &signer) {
        let addr = signer::address_of(deployer);
        assert!(!exists<IssuerCapability>(addr), error::already_exists(E_ISSUER_CAP_ALREADY_EXISTS));
        move_to(deployer, IssuerCapability {});
    }

    public entry fun initialize_certificate_store(student: &signer) {
        let addr = signer::address_of(student);
        assert!(!exists<CertificateStore>(addr), error::already_exists(E_STORE_ALREADY_EXISTS));
        move_to(student, CertificateStore {
            certificates: vector::empty<Certificate>(),
        });
    }

    public entry fun issue_certificate(
        issuer: &signer,
        student_address: address,
        course_name: String,
        issuer_name: String, // Still used for display purposes
        issuance_date: u64,
        certificate_url: String,
    ) acquires CertificateStore {
        let issuer_addr = signer::address_of(issuer);
        assert!(exists<IssuerCapability>(issuer_addr), error::permission_denied(E_NOT_AUTHORIZED));
        assert!(exists<CertificateStore>(student_address), error::not_found(E_CERTIFICATE_NOT_FOUND));

        let student_store = borrow_global_mut<CertificateStore>(student_address);
        let new_id = vector::length(&student_store.certificates);

        let new_cert = Certificate {
            id: new_id,
            student_address,
            course_name,
            issuer_name,
            issuance_date,
            certificate_url,
            issuer_address: issuer_addr, // NEW: Store the issuer's address
            is_revoked: false,         // NEW: Set to false by default
        };
        vector::push_back(&mut student_store.certificates, new_cert);
    }

    // NEW: Function to revoke a certificate
    public entry fun revoke_certificate(
        issuer: &signer,
        student_address: address,
        certificate_id: u64
    ) acquires CertificateStore {
        let issuer_addr = signer::address_of(issuer);
        // Security: Ensure the caller is an authorized issuer
        assert!(exists<IssuerCapability>(issuer_addr), error::permission_denied(E_NOT_AUTHORIZED));
        assert!(exists<CertificateStore>(student_address), error::not_found(E_CERTIFICATE_NOT_FOUND));
        
        let student_store = borrow_global_mut<CertificateStore>(student_address);
        
        // Find the certificate by its ID
        let i = 0;
        let found = false;
        let len = vector::length(&student_store.certificates);
        while (i < len) {
            let cert = vector::borrow_mut(&mut student_store.certificates, i);
            if (cert.id == certificate_id) {
                // Security: Ensure the caller is the original issuer of THIS certificate
                assert!(cert.issuer_address == issuer_addr, error::permission_denied(E_NOT_AUTHORIZED));
                cert.is_revoked = true;
                found = true;
                break
            };
            i = i + 1;
        };
        
        assert!(found, error::not_found(E_CERTIFICATE_NOT_FOUND));
    }

    #[view]
    public fun get_certificates(owner: address): vector<Certificate> acquires CertificateStore {
        if (exists<CertificateStore>(owner)) {
            *&borrow_global<CertificateStore>(owner).certificates
        } else {
            vector::empty<Certificate>()
        }
    }
}