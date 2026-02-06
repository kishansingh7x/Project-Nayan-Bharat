# Requirements Document: Nayan-Bharat

## Introduction

Nayan-Bharat is an AI-powered eye screening system designed to decentralize Diabetic Retinopathy (DR) and Cataract detection using ASHA workers in rural and underserved areas of India. The system combines smartphone technology with 20D lens attachments for fundus imaging, offline AI inference for immediate triage, and AWS cloud infrastructure for data management and tele-consultation integration.

## Glossary

- **ASHA_Worker**: Accredited Social Health Activist trained to operate the screening device
- **Nayan_System**: The complete AI-powered eye screening platform including mobile app, AI models, and cloud infrastructure
- **Fundus_Camera**: Smartphone with 20D lens attachment for retinal imaging
- **AI_Inference_Engine**: On-device machine learning model for DR and Cataract detection
- **Triage_Result**: AI-generated classification (Normal, Mild, Moderate, Severe, Refer)
- **eSanjeevani**: Government telemedicine platform for doctor consultations
- **ABHA_ID**: Ayushman Bharat Health Account unique identifier
- **ABDM_Gateway**: Ayushman Bharat Digital Mission health data exchange
- **AWS_HealthLake**: Amazon's FHIR-compliant health data lake service
- **Low_Connectivity_Mode**: Offline operation when internet connectivity is poor or unavailable

## Requirements

### Requirement 1: Image Capture and Quality Assurance

**User Story:** As an ASHA worker, I want to capture high-quality fundus images with real-time guidance, so that the AI can provide accurate screening results.

#### Acceptance Criteria

1. WHEN a capture is initiated, THE Nayan_System SHALL provide a real-time visual guide for pupil alignment.
2. WHEN the Fundus_Camera detects proper alignment, THE Nayan_System SHALL automatically trigger image capture.
3. IF the AI_Inference_Engine detects motion blur or poor illumination, THEN THE Nayan_System SHALL prompt the worker to retake the image with corrective guidance.
4. WHEN an image is captured, THE Nayan_System SHALL validate image quality parameters within 2 seconds.
5. THE Nayan_System SHALL store raw fundus images in DICOM-compliant format locally before processing.

### Requirement 2: AI-Powered Screening and Triage

**User Story:** As an ASHA worker, I want immediate AI-powered screening results, so that I can provide timely guidance to patients about their eye health.

#### Acceptance Criteria

1. WHEN a quality fundus image is captured, THE AI_Inference_Engine SHALL process it for DR and Cataract detection within 10 seconds
2. THE AI_Inference_Engine SHALL generate Triage_Results with confidence scores for both DR severity (None, Mild, Moderate, Severe) and Cataract presence
3. WHEN the AI detects Moderate or Severe DR, THE Nayan_System SHALL automatically flag the case for urgent referral
4. THE Nayan_System SHALL display results in local language with visual indicators for ASHA_Worker comprehension
5. WHEN processing is complete, THE Nayan_System SHALL generate a patient report with screening timestamp and recommendations

### Requirement 3: Offline Operation and Data Synchronization

**User Story:** As an ASHA worker in areas with poor connectivity, I want the system to work offline and sync data when connection is available, so that I can continue screening patients without interruption.

#### Acceptance Criteria

1. WHILE in Low_Connectivity_Mode, THE Nayan_System SHALL store all images and Triage_Results locally using encrypted storage
2. WHILE in Low_Connectivity_Mode, THE AI_Inference_Engine SHALL continue processing images using on-device models
3. WHEN internet connectivity is restored, THE Nayan_System SHALL automatically queue local data for AWS S3 synchronization
4. WHEN synchronizing, THE Nayan_System SHALL upload images and results in background without disrupting ongoing screenings
5. THE Nayan_System SHALL maintain data integrity during sync operations and retry failed uploads automatically

### Requirement 4: Data Security and Privacy

**User Story:** As a healthcare system administrator, I want all patient data to be securely encrypted and compliant with healthcare regulations, so that patient privacy is protected.

#### Acceptance Criteria

1. THE Nayan_System SHALL encrypt all retinal data at rest using AWS KMS-managed keys
2. THE Nayan_System SHALL encrypt all data in transit using TLS 1.3 or higher
3. WHEN storing patient data, THE Nayan_System SHALL implement role-based access controls for ASHA_Workers
4. THE Nayan_System SHALL maintain audit logs for all data access and modifications
5. WHEN data is deleted, THE Nayan_System SHALL perform secure deletion following healthcare data retention policies

### Requirement 5: ASHA Worker Authentication and Management

**User Story:** As a healthcare administrator, I want to authenticate and manage ASHA workers securely, so that only authorized personnel can access the screening system.

#### Acceptance Criteria

1. WHEN an ASHA_Worker attempts to log in, THE Nayan_System SHALL authenticate using Amazon Cognito with multi-factor authentication
2. THE Nayan_System SHALL maintain session management with automatic timeout after 30 minutes of inactivity
3. WHEN authentication fails three times, THE Nayan_System SHALL temporarily lock the account and notify administrators
4. THE Nayan_System SHALL track ASHA_Worker activities and screening statistics for performance monitoring
5. WHERE an ASHA_Worker changes location, THE Nayan_System SHALL update their assigned geographic area in the system

### Requirement 6: Integration with National Health Infrastructure

**User Story:** As a patient, I want my screening results integrated with national health systems, so that my healthcare providers can access my eye health history.

#### Acceptance Criteria

1. WHERE a patient provides an ABHA_ID, THE Nayan_System SHALL link the screening report to their national digital health locker via the ABDM_Gateway
2. WHEN generating reports, THE Nayan_System SHALL format data according to FHIR R4 standards for interoperability
3. THE Nayan_System SHALL integrate with eSanjeevani for tele-consultation booking when referrals are needed
4. WHEN a referral is generated, THE Nayan_System SHALL automatically create an appointment request in eSanjeevani
5. THE Nayan_System SHALL maintain patient consent records for data sharing with national health systems

### Requirement 7: Tele-consultation and Referral Management

**User Story:** As an ASHA worker, I want to easily book tele-consultations for patients who need specialist care, so that they can receive timely treatment.

#### Acceptance Criteria

1. WHEN the AI detects cases requiring specialist review, THE Nayan_System SHALL provide one-click referral to available ophthalmologists
2. THE Nayan_System SHALL integrate with eSanjeevani API to check doctor availability and book appointments
3. WHEN booking consultations, THE Nayan_System SHALL automatically share screening images and AI results with the consulting doctor
4. THE Nayan_System SHALL send appointment confirmations to patients via SMS in their preferred language
5. WHEN consultations are completed, THE Nayan_System SHALL receive and store doctor recommendations in the patient record

### Requirement 8: Population Health Analytics and Reporting

**User Story:** As a public health official, I want aggregated screening data and analytics, so that I can monitor eye health trends and plan interventions.

#### Acceptance Criteria

1. THE Nayan_System SHALL aggregate anonymized screening data in AWS HealthLake for population health analysis
2. WHEN generating reports, THE Nayan_System SHALL provide district-wise and state-wise DR and Cataract prevalence statistics
3. THE Nayan_System SHALL identify high-risk geographic areas based on screening results and demographic data
4. THE Nayan_System SHALL generate automated alerts when disease prevalence exceeds threshold levels in specific regions
5. WHERE requested by health authorities, THE Nayan_System SHALL provide real-time dashboards for monitoring screening program effectiveness

### Requirement 9: System Performance and Scalability

**User Story:** As a system administrator, I want the platform to handle thousands of concurrent screenings efficiently, so that the program can scale across India.

#### Acceptance Criteria

1. THE Nayan_System SHALL support concurrent usage by up to 10,000 ASHA_Workers simultaneously
2. WHEN processing images, THE AWS Lambda functions SHALL complete API orchestration within 5 seconds
3. THE Nayan_System SHALL automatically scale compute resources based on demand using AWS Auto Scaling
4. WHEN storing data, THE Amazon S3 infrastructure SHALL provide 99.9% availability for image storage and retrieval
5. THE Nayan_System SHALL maintain response times under 3 seconds for all user interactions during peak usage

### Requirement 10: Model Training and Continuous Improvement

**User Story:** As an AI researcher, I want to continuously improve the screening models using real-world data, so that detection accuracy increases over time.

#### Acceptance Criteria

1. WHEN new validated screening data is available, THE Nayan_System SHALL use Amazon SageMaker for model retraining.
2. THE Nayan_System SHALL implement A/B testing framework to evaluate new model versions against current production models
3. WHEN model performance improves, THE Nayan_System SHALL deploy updated models to edge devices through over-the-air updates
4. THE Nayan_System SHALL maintain model versioning and rollback capabilities for quality assurance
5. WHERE ground truth data is available from specialist reviews, THE Nayan_System SHALL incorporate it into the training pipeline for model improvement