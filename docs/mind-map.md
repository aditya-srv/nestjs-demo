Yes. The biggest issue I see is that the designer has treated **every screen as a separate piece of data**, when the backend should think in terms of a few connected clinical objects.

The UI actually contains a fairly coherent system underneath it if we reorganize it around the patient's care journey.

For example, the screens show appointments, visits, diagnoses, prescriptions, reports, and doctor access, but they are currently presented as independent modules.  

# 1. The mental model I would use

Think of CareVault like this:

```text
                    ┌──────────────┐
                    │     USER     │
                    │   Patient    │
                    └──────┬───────┘
                           │
                 ┌─────────▼─────────┐
                 │ Patient Profile   │
                 │ DOB / Gender etc.│
                 └─────────┬─────────┘
                           │
              ┌────────────▼────────────┐
              │       APPOINTMENT       │
              │ "I plan to see a doctor"│
              └────────────┬────────────┘
                           │
                           │ appointment happens
                           ▼
              ┌─────────────────────────┐
              │          VISIT          │
              │ "What happened at visit"│
              └────────────┬────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
     Diagnoses        Prescriptions       Vitals
          │                │
          │                ▼
          │           Medications
          │
          └───────────────┐
                          │
                          ▼
                       Reports
                   Lab / Scan / Docs
                          │
                          ▼
                    Medical Record
                          │
                          │
                 ┌────────▼─────────┐
                 │  SHARING / ACCESS│
                 │ Doctor / Hospital│
                 └──────────────────┘
```

That is the system I would build.

Everything else in the Figma becomes either:

1. a view of these objects,
2. supporting medical-history data,
3. or a future feature.

---

# 2. First important decision: don't make `Onboarding` your patient

Your current:

```prisma
User
  └── Onboarding
```

is okay for the **onboarding process**, but I would not make `Onboarding` the permanent container for the patient's medical information.

Currently you have:

```prisma
model Onboarding {
  dateOfBirth
  gender
  profilePhotoUrl
  emergencyContact
  medicalHistory
  allergies
  completed
}
```

This creates a problem later.

Suppose the patient says during onboarding:

> "I am allergic to peanuts."

Six months later they add another allergy.

Where does it go?

If it remains:

```text
Onboarding.allergies
```

you're effectively treating onboarding as the patient's medical database.

Instead:

```text
USER
 │
 ├── PatientProfile
 │
 ├── Allergies
 │
 ├── MedicalHistory
 │
 ├── Appointments
 │
 ├── Visits
 │
 ├── Prescriptions
 │
 ├── Reports
 │
 └── SharingAccess
```

And onboarding is simply the process that populates the initial profile/data.

---

# 3. What onboarding actually means

Since you said the onboarding API already exists, I would conceptually treat it as:

```text
SIGN UP
   ↓
OTP verification
   ↓
User created
   ↓
Onboarding started
   ↓
Basic profile
   ↓
Medical information
   ↓
Emergency information
   ↓
Onboarding completed
   ↓
Dashboard
```

The important distinction:

```text
Onboarding = process
Patient data = permanent data
```

So your existing:

```prisma
Onboarding {
    completed
    completedAt
}
```

makes sense.

But things like:

```prisma
dateOfBirth
gender
profilePhotoUrl
```

would eventually belong in something like `PatientProfile`.

---

# 4. Your current User model

I'd keep `User` very boring.

Something like:

```text
User
────
id
email
countryCode
phoneNumber
name
role
preferredLanguage
createdAt
updatedAt
```

That's identity/authentication.

Don't turn `User` into the entire medical record.

---

# 5. Patient Profile

Create:

```text
PatientProfile
───────────────
id
userId
dateOfBirth
gender
profilePhotoUrl
bloodGroup
emergencyContact
createdAt
updatedAt
```

You could also keep emergency contact in a separate table if multiple contacts are eventually supported.

For now:

```text
User
  │
  └── PatientProfile
```

---

# 6. Now the most important object: Appointment

The UI explicitly has upcoming appointments and "Add New Appointment". 

An appointment means:

> **A planned interaction with a healthcare provider.**

It does **not** mean a visit.

For example:

```text
Appointment #100

Patient: Abhimanyu
Doctor: Dr. Krishna Dave
Date: 08 Dec 2025
Time: 04:00 PM
Type: Follow-up
Status: Scheduled
```

DB:

```text
Appointment
────────────
id
patientId
doctorId
appointmentAt
type
status
reason
notes
createdAt
updatedAt
```

Statuses:

```text
SCHEDULED
CONFIRMED
CANCELLED
COMPLETED
NO_SHOW
```

Potentially:

```text
PENDING
```

if your appointment booking process requires confirmation.

---

# 7. Doctor should be its own concept

Your screens have things like:

> Dr. Anjali Rao, Internal Medicine

and:

> Dr. Ayush Mehta

and:

> Dr. Krishna Dave

So don't store:

```text
doctorName = "Dr. Anjali Rao"
```

inside every visit.

You need:

```text
User
 │
 └── DoctorProfile
       ├── specialization
       ├── registrationNumber
       ├── clinic
       └── ...
```

Conceptually:

```text
User
 ├── PatientProfile
 │
 └── DoctorProfile
```

depending on how your role architecture works.

If doctors aren't actually users in the first version, you can still have a `Doctor` entity.

But **don't duplicate doctor information inside appointments/visits**.

---

# 8. Appointment → Visit is the critical relationship

This is probably the most important mental model for your backend.

```text
Appointment
     │
     │ happens
     ▼
   Visit
```

An appointment is planned.

A visit is what actually happened.

Example:

```text
Appointment
────────────────────
15 Nov 2025
1:15 PM
Follow-up
Dr. Ayush Mehta
```

After the patient attends:

```text
Visit
────────────────────
15 Nov 2025
Reason: High blood sugar
Diagnosis: Type 2 Diabetes
Vitals: BP, HR, glucose
Doctor notes
Prescription
Reports
```

The Figma's Visit Timeline demonstrates exactly this kind of historical object. 

---

# 9. Visit should become your clinical hub

I would make `Visit` the central medical event.

```text
Visit
 │
 ├── Appointment
 │
 ├── Doctor
 │
 ├── Reason
 │
 ├── Vitals
 │
 ├── Diagnoses
 │
 ├── Prescriptions
 │
 ├── Reports
 │
 ├── Notes
 │
 └── Follow-up
```

Example:

```text
VISIT #500

Patient
  ↓
Dr. Anjali Rao
  ↓
12 Aug 2025
  ↓
Follow-up
  ↓
Reason:
High blood sugar + dizziness

Diagnoses:
  Type 2 Diabetes
  Hypertension

Vitals:
  BP 128/82
  HR 84
  Sugar 160
  Temp 98.6

Prescription:
  Metformin
  Vitamin D

Reports:
  Blood Sugar Report

Doctor Remark:
  Maintain hydration and rest
```

This corresponds very closely to the UI. 

---

# 10. Diagnosis should NOT be a field on Visit

Don't do:

```text
Visit
  diagnosis = "Diabetes, Hypertension"
```

Because the same diagnosis can appear in multiple visits.

Instead:

```text
Diagnosis
──────────
id
patientId
name
type
status
severity
diagnosedOn
```

Then:

```text
VisitDiagnosis
───────────────
visitId
diagnosisId
```

Now:

```text
Type 2 Diabetes
       │
       ├── Visit Aug 2025
       ├── Visit Sep 2025
       ├── Visit Dec 2025
       └── Visit Mar 2026
```

This makes the "Recent Diagnoses" and "Chronic Diseases" screens views over actual data rather than separate datasets. The UI explicitly shows both diagnosis lists and diagnosis detail pages with linked prescriptions and reports. 

---

# 11. Chronic disease is a state of a diagnosis

This is another place where the UI makes things look more complicated than they are.

You don't necessarily need:

```text
ChronicDisease
```

as a completely separate medical universe.

You can model:

```text
Diagnosis
    type = CHRONIC
    status = ACTIVE
```

For example:

```text
Diagnosis
────────────────
Type 2 Diabetes
type: CHRONIC
status: ACTIVE
severity: MODERATE
diagnosedOn: 2025-03-12
```

Then:

```text
Medical History
    ↓
Chronic Diseases
    ↓
Diagnosis where type = CHRONIC
```

The Figma's chronic disease screen is essentially showing active conditions plus their prescriptions, reports, remarks and reminders. 

---

# 12. Prescription vs Medication

This distinction is **very important**.

The UI has:

```text
Active Prescriptions
Past Prescriptions
Routine Medicines
Condition-Based Prescriptions
```

But these are not necessarily the same thing.

Think:

```text
Medication
    ↓
the actual drug

Prescription
    ↓
doctor's instruction to take that drug
```

Example:

```text
Medication
────────────
Metformin 500 mg
```

Prescription:

```text
Prescription
────────────
Prescribed by Dr. Anjali
On 12 Aug 2025

Medication:
Metformin 500 mg

Dose:
500 mg

Schedule:
1-0-1

Instruction:
After meal

Start:
12 Aug 2025

End:
12 Nov 2025
```

---

# 13. Prescription should belong to a Visit

This is the natural relationship:

```text
Visit
  │
  └── Prescription
         │
         ├── PrescriptionItem
         │       ├── Medication
         │       ├── dose
         │       ├── frequency
         │       ├── instruction
         │       └── duration
         │
         └── ...
```

So:

```text
Visit
  ↓
Prescription
  ↓
PrescriptionItem
  ↓
Medication
```

This lets you answer:

> What medicines did the doctor prescribe during this visit?

and:

> What prescriptions are currently active?

without duplicating data.

---

# 14. Active prescriptions become a QUERY

This is a major mental shift.

Don't create:

```text
ActivePrescription
```

just because there is an "Active Prescriptions" screen.

Instead:

```text
PrescriptionItem
WHERE
    startDate <= NOW
AND
    endDate >= NOW
AND
    status = ACTIVE
```

Then your UI:

```text
Dashboard
   ↓
Active Prescriptions
```

is just querying the underlying medical data.

The designer's "Active Prescriptions" screen is showing exactly this kind of list. 

---

# 15. Reports need to be first-class objects

Because you specifically said:

> sharing the reports with other doctors

I would make reports a **first-class entity**, not merely attachments.

You have:

```text
Lab Reports & Scan Archive
```

with categories like:

```text
Blood Reports
Radiology
Urology
Pathology
```

and an Upload New Report action. 

So:

```text
MedicalReport
─────────────
id
patientId
type
title
reportDate
uploadedAt
fileId
source
description
```

For example:

```text
MedicalReport #900

Patient: Abhimanyu
Type: BLOOD_REPORT
Title: HbA1c
Date: 10 Sep 2025
File: hba1c.pdf
```

---

# 16. Report can optionally belong to a Visit

Don't force every report to belong to a visit.

Because a patient may upload:

> "My old MRI from 2022."

So:

```text
MedicalReport
    │
    ├── patientId       required
    └── visitId         optional
```

This is important.

You get:

```text
Patient
 ├── Report uploaded independently
 │
 └── Report generated during Visit
```

---

# 17. The actual document/file should be separate

I would also separate:

```text
MedicalReport
```

from:

```text
File
```

Because later you might have:

```text
File
 ├── PDF
 ├── JPG
 ├── PNG
 └── DICOM
```

and the medical entity gives it meaning.

Example:

```text
MedicalReport
    ↓
File
    ↓
S3 / Azure Blob / whatever storage
```

This becomes useful for sharing.

---

# 18. Sharing is NOT copying medical records

This is probably the second-most important architectural decision after Appointment → Visit.

Your UI has:

> Generate Access Code

> Temporary Access Code

> Live Access (To Doctor)

> End access session

This is actually describing an **authorization/session system**, not a document-sharing system. 

So don't do:

```text
SharedReports
```

only.

Think:

```text
Patient
   │
   ▼
AccessGrant
   │
   ├── Doctor
   ├── Scope
   ├── expiresAt
   ├── status
   └── createdAt
```

Example:

```text
AccessGrant

Patient:
Abhimanyu

Doctor:
Dr. Rohan Shah

Scope:
Reports
Visits
Prescriptions

Created:
13:00

Expires:
13:30

Status:
ACTIVE
```

---

# 19. Access code is a credential, not the permission itself

Your flow should be:

```text
Patient
  │
  │ Generate access
  ▼
AccessSession
  │
  ├── temporary code
  ├── expiresAt
  └── requested scope
          │
          ▼
Doctor enters/scans code
          │
          ▼
Doctor authenticated
          │
          ▼
Access granted
          │
          ▼
Doctor can view permitted records
```

Do **not** make the 4-digit code itself the authorization record.

Store a hash of the code, similar to OTP:

```text
accessCodeHash
```

rather than:

```text
accessCode = "0331"
```

---

# 20. Sharing should have scopes

For your priority, I'd start with:

```text
REPORTS
VISITS
PRESCRIPTIONS
MEDICATIONS
DIAGNOSES
```

Potentially:

```text
FULL_MEDICAL_RECORD
```

later.

So the patient could say:

> "I'm visiting a new doctor. Give them access to my reports and prescriptions for 30 minutes."

That's much cleaner than copying PDFs around.

---

# 21. Your entire core database becomes surprisingly small

The core could look like:

```text
                         USER
                          │
             ┌────────────┴────────────┐
             │                         │
      PatientProfile              DoctorProfile
             │
             │
             ├─────────────┐
             │             │
             ▼             ▼
        APPOINTMENT       REPORT
             │
             ▼
           VISIT
             │
       ┌─────┼──────────┬─────────────┐
       │     │          │             │
       ▼     ▼          ▼             ▼
   DIAGNOSIS VITALS  PRESCRIPTION   REPORT
                       │
                       ▼
                 PRESCRIPTION ITEM
                       │
                       ▼
                   MEDICATION


USER
 │
 └── ACCESS SESSION
         │
         ▼
     ACCESS GRANT
         │
         ├── VISITS
         ├── REPORTS
         ├── PRESCRIPTIONS
         └── MEDICATIONS
```

That's the mental model I'd want you to keep in your head while implementing.

---

# 22. Then your Medical History screen becomes easy

The designer created 10 categories:

* Recent Diagnoses
* Visit Timeline
* Chronic Diseases
* Past Prescriptions
* Hospitalisations & Surgeries
* Lab Reports & Scan Archive
* All Allergies
* Vaccination History
* Lifestyle & Risk Factors
* Notes & Attachments

These are **not 10 independent systems**.

They are mostly views over underlying entities. 

I'd classify them:

### Core clinical system

```text
Appointments
Visits
Diagnoses
Prescriptions
Medications
Reports
Sharing
```

### Medical history

```text
Allergies
Vaccinations
Hospitalisations
Surgeries
Lifestyle
Notes
```

### Supporting

```text
Files
Notifications
Reminders
Emergency information
```

---

# 23. Hospitalisation should probably be a specialized clinical event

Don't make hospitalisation completely independent from visits.

Think:

```text
Encounter
```

as a generalized concept eventually.

For now:

```text
Visit
Hospitalisation
```

can be separate if requirements aren't mature enough.

Hospitalisation has additional things:

```text
Hospital
Admission
Discharge
Procedures
Medicines during stay
Discharge summary
Follow-up
```

The Figma clearly shows that hospitalization has considerably more information than a normal visit. 

So I wouldn't try to force all of that into the normal `Visit` table yet.

---

# 24. Allergies should definitely not be JSON

Your current:

```prisma
allergies Json?
```

is one thing I'd change early.

The UI expects:

```text
Food
Drug / Medicine
Environmental
Skin Contact
Seasonal
Insect Bite
Other
```

and then individual allergy details such as trigger, severity, reaction, emergency action and medication. 

That's clearly structured data.

Use:

```text
Allergy
───────
id
patientId
category
allergen
severity
reaction
notes
isActive
createdAt
updatedAt
```

Potentially later:

```text
AllergyReaction
AllergyMedication
```

if required.

---

# 25. Vaccination should also be structured

Instead of:

```text
medicalHistory Json
```

use:

```text
Vaccination
───────────
id
patientId
vaccineName
dose
date
administeredBy
location
status
notes
```

The UI already expects vaccine name, provider, date and completion status. 

---

# 26. Medical history JSON is a trap

I'd be particularly careful with this:

```prisma
medicalHistory Json?
```

It feels convenient now.

But imagine six months from now:

```text
"Show all diagnoses from 2024"
```

or:

```text
"Show reports related to diabetes"
```

or:

```text
"Share only reports from the last 12 months"
```

JSON becomes painful.

Use JSON only for genuinely flexible data where you don't need querying.

---

# 27. What I would change in your current schema

Your current:

```text
User
  └── Onboarding
```

I'd evolve toward:

```text
User
 │
 ├── PatientProfile
 │
 ├── Onboarding
 │
 ├── Appointments
 │
 ├── Visits
 │
 ├── Diagnoses
 │
 ├── Prescriptions
 │
 ├── Reports
 │
 ├── Allergies
 │
 ├── Vaccinations
 │
 └── AccessSessions
```

And remove medical data from `Onboarding` over time.

---

# 28. A first-pass Prisma schema

I would start roughly like this:

```prisma
model User {
  id                Int       @id @default(autoincrement())
  email             String?   @unique
  countryCode       String?
  phoneNumber       String?
  name              String?
  role              Role?
  preferredLanguage String    @default("en")

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  onboarding        Onboarding?
  patientProfile    PatientProfile?

  appointments      Appointment[]
  visits            Visit[]
  diagnoses         Diagnosis[]
  prescriptions     Prescription[]
  reports           MedicalReport[]
  allergies         Allergy[]
  vaccinations      Vaccination[]
  accessSessions    AccessSession[]

  @@unique([countryCode, phoneNumber])
}


model PatientProfile {
  id               Int      @id @default(autoincrement())
  userId           Int      @unique

  dateOfBirth      DateTime? @db.Date
  gender           Gender?
  profilePhotoUrl  String?
  bloodGroup       String?

  emergencyContact Json?

  user             User      @relation(
    fields: [userId],
    references: [id],
    onDelete: Cascade
  )

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}


model Onboarding {
  id          Int      @id @default(autoincrement())
  userId      Int      @unique

  completed   Boolean  @default(false)
  completedAt DateTime?

  user        User     @relation(
    fields: [userId],
    references: [id],
    onDelete: Cascade
  )

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Then:

```prisma
model Appointment {
  id            Int      @id @default(autoincrement())
  patientId     Int
  doctorId      Int?

  appointmentAt DateTime
  type          AppointmentType
  status        AppointmentStatus

  reason        String?
  notes         String?

  patient       User     @relation(fields: [patientId], references: [id])
  doctor        User?    @relation(fields: [doctorId], references: [id])

  visit         Visit?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}


model Visit {
  id             Int      @id @default(autoincrement())

  patientId      Int
  doctorId       Int?
  appointmentId  Int?     @unique

  visitAt        DateTime
  type           VisitType
  reason         String?
  doctorNotes    String?

  patient        User     @relation(fields: [patientId], references: [id])
  appointment    Appointment? @relation(
    fields: [appointmentId],
    references: [id]
  )

  diagnoses      VisitDiagnosis[]
  vitals         Vital[]
  prescriptions  Prescription[]
  reports        MedicalReport[]

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

Then prescriptions:

```prisma
model Prescription {
  id          Int      @id @default(autoincrement())
  patientId   Int
  visitId     Int

  prescribedAt DateTime
  status       PrescriptionStatus

  patient     User    @relation(fields: [patientId], references: [id])
  visit       Visit   @relation(fields: [visitId], references: [id])

  items       PrescriptionItem[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}


model PrescriptionItem {
  id             Int      @id @default(autoincrement())
  prescriptionId Int
  medicationId   Int

  dose           String?
  schedule       String?
  instruction    String?

  startDate      DateTime?
  endDate        DateTime?

  prescription   Prescription @relation(
    fields: [prescriptionId],
    references: [id]
  )

  medication     Medication @relation(
    fields: [medicationId],
    references: [id]
  )
}


model Medication {
  id          Int    @id @default(autoincrement())
  name        String
  strength    String?

  prescriptionItems PrescriptionItem[]
}
```

---

# 29. Reports

```prisma
model MedicalReport {
  id          Int      @id @default(autoincrement())

  patientId   Int
  visitId     Int?

  title       String
  type        ReportType
  reportDate  DateTime?

  fileUrl     String
  source      ReportSource

  patient     User     @relation(
    fields: [patientId],
    references: [id]
  )

  visit       Visit?   @relation(
    fields: [visitId],
    references: [id]
  )

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Later I'd replace `fileUrl` with a proper `File` entity.

---

# 30. Sharing

Something along these lines:

```prisma
model AccessSession {
  id            Int      @id @default(autoincrement())

  patientId     Int

  codeHash      String
  expiresAt     DateTime

  status        AccessSessionStatus

  patient       User     @relation(
    fields: [patientId],
    references: [id]
  )

  grants        AccessGrant[]

  createdAt     DateTime @default(now())
}


model AccessGrant {
  id             Int      @id @default(autoincrement())

  accessSessionId Int
  doctorId        Int

  accessSession  AccessSession @relation(
    fields: [accessSessionId],
    references: [id]
  )

  doctor         User @relation(
    fields: [doctorId],
    references: [id]
  )

  permissions    Json

  createdAt      DateTime @default(now())
}
```

Eventually I'd make `permissions` relational/enum based rather than JSON if the sharing system becomes important.

Given that **sharing medical reports with other doctors is one of your stated priorities**, I would design this properly rather than treating it as a UI-only QR/code feature.

---

# 31. The actual user journey

Now let's forget the database for a moment and look at what the patient experiences.

## First time

```text
Install
 ↓
Login / Signup
 ↓
OTP
 ↓
Onboarding
 ↓
Basic profile
 ↓
Medical information
 ↓
Emergency information
 ↓
Complete
 ↓
HOME
```

Home then shows:

```text
┌───────────────────────────────┐
│ Welcome                       │
│                               │
│ Recent Visits       05        │
│ Active Medicines    02        │
│ Upcoming Appointments 02      │
│ Medical History               │
│                               │
│ Quick Actions                 │
│ Reports                       │
│ Share Records                 │
└───────────────────────────────┘
```

This matches the dashboard structure in the supplied designs. 

---

# 32. Appointment journey

```text
HOME
 ↓
Upcoming Appointments
 ↓
Appointment
 ↓
Doctor
 ↓
Date/time
 ↓
Reason
 ↓
Appointment happens
 ↓
VISIT CREATED
```

Then:

```text
Visit
 ├── Diagnosis
 ├── Vitals
 ├── Prescription
 ├── Reports
 ├── Doctor note
 └── Follow-up appointment
```

That means your backend has a clean lifecycle.

---

# 33. Medication journey

```text
Doctor Visit
      ↓
Prescription
      ↓
Prescription Item
      ↓
Medication
      ↓
ACTIVE
      ↓
Medication ends
      ↓
HISTORICAL
```

So:

```text
Active Prescriptions
```

and

```text
Past Prescriptions
```

are simply different queries over prescription data.

The Figma has separate past-prescription screens, but that doesn't mean you need a separate database entity. 

---

# 34. Report journey

There are actually **two ways a report enters the system**.

### Doctor/clinic generated

```text
Visit
 ↓
Test
 ↓
Report
 ↓
Patient record
```

### Patient uploaded

```text
Patient
 ↓
Upload Report
 ↓
MedicalReport
 ↓
Patient record
```

This distinction is important.

---

# 35. Sharing journey

This should be one of your primary flows:

```text
PATIENT
   │
   ▼
Quick Share
   │
   ▼
Choose duration
   │
   ▼
Generate access code / QR
   │
   ▼
Doctor scans
   │
   ▼
Doctor authenticated
   │
   ▼
Access session created
   │
   ▼
Doctor sees allowed records
   │
   ├── Reports
   ├── Visits
   ├── Diagnoses
   └── Prescriptions
   │
   ▼
Expiry
   │
   ▼
Access revoked
```

This is much more coherent than thinking:

> "We have a Generate QR screen and a Temporary Access Code screen."

Those are merely **two UI states of the same AccessSession**.

---

# 36. One particularly important backend principle

Don't design APIs around screens.

Bad:

```text
GET /active-prescriptions
GET /past-prescriptions
GET /chronic-disease-screen
GET /recent-diagnosis-screen
```

Instead design APIs around domain objects:

```text
GET /appointments
GET /appointments/:id

GET /visits
GET /visits/:id

GET /prescriptions
GET /prescriptions/:id

GET /medications

GET /diagnoses
GET /diagnoses/:id

GET /reports
GET /reports/:id

POST /access-sessions
POST /access-sessions/:id/redeem
DELETE /access-sessions/:id
```

The frontend can compose those into screens.

---

# 37. What I'd consider the MVP

Given what you told me:

> priority is appointment, visits, medication and sharing the reports with other doctors

I would **not** try to fully implement all 10 Medical History categories first.

I'd build this vertical slice:

```text
                    ┌─────────────┐
                    │   USER      │
                    └──────┬──────┘
                           │
                           ▼
                    PATIENT PROFILE
                           │
                           ▼
                    APPOINTMENT
                           │
                           ▼
                       VISIT
                    ┌──────┼──────┐
                    ▼      ▼      ▼
                DIAGNOSIS VITALS REPORT
                           │
                           ▼
                      PRESCRIPTION
                           │
                           ▼
                       MEDICATION


REPORT
  │
  ▼
ACCESS SESSION
  │
  ▼
DOCTOR
```

Once this works, a huge portion of the Figma falls into place naturally.

---

# 38. The screens then map cleanly to the backend

| Figma screen          | Backend concept                                       |
| --------------------- | ----------------------------------------------------- |
| Home                  | Aggregated queries                                    |
| Upcoming Appointments | `Appointment`                                         |
| Recent Visit          | `Visit`                                               |
| Visit Timeline        | `Visit[]`                                             |
| Visit Detail          | `Visit + Diagnoses + Vitals + Prescription + Reports` |
| Active Prescriptions  | Active `PrescriptionItem[]`                           |
| Past Prescriptions    | Historical `Prescription[]`                           |
| Recent Diagnoses      | `Diagnosis[]`                                         |
| Chronic Diseases      | `Diagnosis WHERE type=CHRONIC`                        |
| Diagnosis Detail      | `Diagnosis + Visits + Prescriptions + Reports`        |
| Lab Reports           | `MedicalReport[]`                                     |
| Upload Report         | `MedicalReport + File`                                |
| Quick Share           | `AccessSession`                                       |
| Temporary Access Code | `AccessSession` state                                 |
| Allergies             | `Allergy[]`                                           |
| Vaccinations          | `Vaccination[]`                                       |
| Hospitalisations      | `Hospitalisation[]`                                   |
| Surgeries             | `Surgery[]`                                           |
| Lifestyle             | `LifestyleFactor[]`                                   |
| Notes                 | `Note[]`                                              |

This is the key thing I'd give yourself as the backend engineer: **the screen isn't the entity.**

---

## 39. And one thing I'd explicitly tell the designer/product person

The Figma currently contains some UI concepts that need product clarification before you turn them into hard database rules.

For example:

* What exactly constitutes a "visit"?
* Can a visit exist without an appointment?
* Can a doctor create a visit for a patient who has no appointment?
* Who can create/edit a prescription?
* Can patients manually add medications?
* Are reports uploaded by patients considered verified?
* Can a patient revoke a doctor's access immediately?
* Does a doctor see the whole medical record or selected categories?
* Can one access code be used by multiple doctors?
* Does an access session represent a doctor, clinic, or both?
* What happens when a prescription is modified?
* Is "diagnosis status = improving" doctor-entered or system-derived?
* Are allergies patient-entered, doctor-verified, or both?

Those aren't backend implementation details. **They are domain rules.**

---

# 40. My recommended mental model in one sentence

If you remember only one thing while building this:

> **A patient has a medical record; appointments represent planned care; visits represent actual care; visits produce diagnoses, vitals, prescriptions and reports; prescriptions contain medications; and sharing creates temporary permission to access selected parts of that record.**
