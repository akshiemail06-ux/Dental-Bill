# Security Specification: Ortho & Clinic Management

## Data Invariants
1. **Clinic Integrity**: A clinic must have a verified owner. Only the owner or verified staff can update clinic details.
2. **Bill Relational Integrity**: Bills must belong to a valid clinic and be immutable regarding their `clinicId` and `ownerId` after creation.
3. **Ortho Patient Privacy**: Patient data is strictly restricted to the clinic owner and authorized clinic staff.
4. **Visit Ownership**: Ortho visits must belong to a parent Ortho Patient.
5. **No Anonymous Writing**: All write operations require a verified email (`request.auth.token.email_verified == true`).

## The "Dirty Dozen" Payloads (Targeted for Denial)

### 1. Identity Spoofing (Bill Creation)
Target: `/bills`
Payload: `{ "patientName": "Attacker", "total": 0, "clinicId": "victim-clinic-id", "ownerId": "attacker-uid" }`
Guard: `incoming().ownerId == request.auth.uid` and `belongsToClinic(incoming().clinicId)`.

### 2. State Shortcutting (Payment Status)
Target: `/bills/{id}`
Payload: `{ "paymentStatus": "paid" }` (on an unpaid bill without actually paying)
Guard: `isValidBill(incoming())` and `affectedKeys().hasOnly(...)`.

### 3. Resource Poisoning (Large IDs)
Target: `/clinics/very-long-id-that-exceeds-128-chars...`
Guard: `isValidId(clinicId)`.

### 4. PII Scraping (List Queries)
Target: `query(db, "orthoPatients")` (without filters)
Guard: `allow list: if resource.data.ownerId == request.auth.uid || belongsToClinic(resource.data.clinicId)`.

### 5. Shadow Update (Admin Escalation)
Target: `/users/{uid}`
Payload: `{ "role": "admin" }` (by a non-admin user)
Guard: `incoming().role == existing().role || request.auth.token.email == "akshiemail06@gmail.com"`.

### 6. Orphaned Writing (Visits without Patient)
Target: `/orthoPatients/non-existent-patient/visits`
Guard: `get(/orthoPatients/non-existent-patient).exists()`.

### 7. Unverified Write (Bypass Verification)
Target: Any update/create
Auth: `{ uid: "...", email_verified: false }`
Guard: `isVerified()`.

### 8. Immutable Field Mutation (ownerId)
Target: `/orthoPatients/{id}`
Payload: `{ "ownerId": "new-owner" }`
Guard: `incoming().ownerId == existing().ownerId`.

### 9. Denial of Wallet (Broad Group Query)
Target: `collectionGroup(db, "visits")` (by unauthenticated user)
Guard: `allow list: if isAuthenticated()`.

### 10. Temporal Fraud (Backdated Bills)
Target: `/bills`
Payload: `{ "createdAt": "2000-01-01" }`
Guard: `incoming().createdAt == request.time`.

### 11. Spoofing Clinic Association
Target: `/users/{uid}`
Payload: `{ "clinicId": "victim-clinic-id" }`
Guard: `isOwner(userId)`. (Wait, the user CAN set their own clinicId during setup, but the rule requires `isOwner`).

### 12. PII Leak (Public Bill Access)
Target: `/orthoPatients/{id}` (via `get`)
Guard: `resource.data.ownerId == request.auth.uid || belongsToClinic(resource.data.clinicId)`.

## Test Runner Logic (Conceptual)
The generated `firestore.rules` are checked against these invariants using `isValid[Entity]` helpers.
