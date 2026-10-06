# Feature: Appointment

## Purpose

An appointment represents a planned interaction between a patient and a doctor.

An appointment can be created by either:
- Patient
- Doctor

A doctor is optional when creating an appointment, so an appointment can initially be **Unassigned**.

## Core Data

An appointment should have:

- Patient
- Doctor (optional)
- Date and time
- Appointment type
- Status
- Reason (optional)
- Notes (optional)
- Created by (Patient or Doctor)

## Appointment Status

Initial statuses:

- SCHEDULED
- CONFIRMED
- CANCELLED
- COMPLETED
- NO_SHOW

## Basic Flow

### Create
Patient/Doctor → Create Appointment → Date & Time → Type → Optional Doctor → Reason/Notes → Appointment created

### Manage
View appointment → Update allowed details / Cancel appointment

### Complete
Appointment takes place → Mark Completed → Link to Visit if a clinical interaction occurred

## Appointment & Visit

Appointment = what was planned.

Visit = what actually happened.

A completed appointment may have one linked Visit.

A Visit may also exist without an Appointment for walk-ins or unscheduled interactions.

Clinical information such as diagnosis, vitals, prescriptions, and reports belongs to the Visit, not the Appointment.

## Essential Rules

- Every appointment must belong to a patient.
- Appointment can be created by either patient or doctor.
- Doctor assignment is optional.
- Cancelled/completed/no-show appointments remain in history.
- Do not delete appointments as part of normal cancellation.
- An appointment should not create duplicate records when it is updated.
- Upcoming appointments should exclude cancelled, completed, and no-show appointments.
- Appointment access must respect the user's role and relationship to the appointment.
