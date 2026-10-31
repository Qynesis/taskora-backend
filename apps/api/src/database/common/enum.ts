export enum UserRole {
  SEEKER = 'seeker',
  PROVIDER = 'provider',
  ADMIN = 'admin',
}

export enum VerificationStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum JobType {
  BIDDING = 'bidding',
  DIRECT = 'direct',
}

export enum JobStatus {
  // BIDDING flow states
  POSTED = 'posted',
  BIDDING = 'bidding',
  SELECTED = 'selected',
  // DIRECT flow states
  PENDING = 'pending',
  REJECTED = 'rejected',
  // Shared states
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum BidStatus {
  SUBMITTED = 'submitted',
  DECLINED = 'declined',
  ACCEPTED = 'accepted',
}

export enum EngagementType {
  SINGLE = 'single',
  SHORT = 'short',
  LONG = 'long',
}

export enum BillingType {
  MONTHLY = 'monthly',
  UPFRONT = 'upfront',
}

export enum SubscriptionStatus {
  INCOMPLETE = 'incomplete',
  TRIALING = 'trialing',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
}

export enum ConnectFlow {
  DESTINATION = 'destination',
  SCT = 'sct',
}

export enum DocumentType {
  ID_CARD = 'id_card',
  DRIVER_LICENSE = 'driver_license',
  BUSINESS_LICENSE = 'business_license',
  INSURANCE = 'insurance',
  OTHER = 'other',
}

export enum StorageProvider {
  AZURE_BLOB = 'azure_blob',
  S3 = 's3',
  OTHER = 'other',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
  CANCELED = 'canceled',
}

export enum MessageSenderType {
  SEEKER = 'seeker',
  PROVIDER = 'provider',
  SYSTEM = 'system',
}

export enum ReportType {
  ABUSE = 'abuse',
  FRAUD = 'fraud',
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  OTHER = 'other',
}

export enum ReportTargetType {
  USER = 'user',
  JOB = 'job',
  BID = 'bid',
  CONVERSATION = 'conversation',
  MESSAGE = 'message',
  PAYMENT = 'payment',
}

export enum ReportStatus {
  PENDING = 'pending',
  WARNING_SENT = 'warning_sent',
  RESOLVED = 'resolved',
  SUSPENDED = 'suspended',
  DISMISSED = 'dismissed',
}

export enum VerificationStepType {
  BUSINESS = 'BUSINESS',           // Step 1: ABN + doc
  IDENTITY = 'IDENTITY',           // Step 2: Choose one (DL/Passport) + doc
  RIGHT_TO_WORK = 'RIGHT_TO_WORK', // Step 3: Citizen/PR vs Visa + VEVO doc
  POLICE_CHECK = 'POLICE_CHECK',   // Step 4: National Crime Check
  SELFIE = 'SELFIE',               // Step 5: Stripe Identity selfie verification
}

export enum IdentityType {
  DRIVING_LICENSE = 'DRIVING_LICENSE',
  PASSPORT = 'PASSPORT',
}

export enum RightToWorkStatus {
  CITIZEN_PR = 'CITIZEN_PR',
  VISA = 'VISA',
}

export enum CitizenDocumentType {
  AU_NZ_PASSPORT = 'AU_NZ_PASSPORT',           // Australian or New Zealand Passport
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',      // Australian Birth Certificate + valid photo ID
  CITIZENSHIP_CERTIFICATE = 'CITIZENSHIP_CERTIFICATE', // Australian Citizenship Certificate
}

export enum RejectionReason {
  INCOMPLETE_DOCUMENTS = 'INCOMPLETE_DOCUMENTS',
  DOCUMENT_NOT_VALID = 'DOCUMENT_NOT_VALID',
  SUSPECTED_FRAUD = 'SUSPECTED_FRAUD',
  OTHER = 'OTHER',
}

export enum CertificationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

// ── Scheduling ──────────────────────────────────────────────────────────────

/** Service duration selected at job creation */
export enum ServiceDuration {
  SINGLE_TASK = 'single_task',
  ONE_MONTH = '1_month',
  THREE_MONTHS = '3_months',
  SIX_MONTHS = '6_months',
}

export enum ServiceFrequency {
  DAILY = 'daily',
  CUSTOM = 'custom',
}

/** Budget / total-hours billing cadence (distinct from BillingType upfront vs monthly) */
export enum BillingPeriod {
  WEEKLY = 'weekly',
  FORTNIGHTLY = 'fortnightly',
  MONTHLY = 'monthly',
}

// ── Refund requests ──────────────────────────────────────────────────────────

export enum RefundRequestReason {
  POOR_SERVICE_QUALITY = 'poor_service_quality',
  SERVICE_NOT_COMPLETED = 'service_not_completed',
  PROVIDER_NO_SHOW = 'provider_no_show',
  WRONG_SERVICE_PROVIDED = 'wrong_service_provided',
  SAFETY_CONCERN = 'safety_concern',
  OTHER = 'other',
}

export enum RefundRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum RefundEvidenceSide {
  SEEKER = 'seeker',
  ADMIN = 'admin',
}

// ── Subscription cancellation ────────────────────────────────────────────────

export enum SubscriptionCancellationReason {
  SERVICE_QUALITY_NOT_MET = 'service_quality_not_met',
  TASKS_NOT_COMPLETED_PROPERLY = 'tasks_not_completed_properly',
  COMMUNICATION_ISSUES_WITH_PROVIDER = 'communication_issues_with_provider',
  PROVIDER_UNPROFESSIONAL_BEHAVIOR = 'provider_unprofessional_behavior',
  MOVING_TO_NEW_LOCATION = 'moving_to_new_location',
  OTHER = 'other',
}

export enum SubscriptionCancellationStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  WITHDRAWN = 'withdrawn',
}

// ── Transactions (unified ledger) ────────────────────────────────────────────

export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
}

export enum NotificationType {
  WARNING = 'warning',
  BID_RECEIVED = 'bid_received',
  BID_ACCEPTED = 'bid_accepted',
  BID_DECLINED = 'bid_declined',
  JOB_STARTED = 'job_started',
  JOB_COMPLETED = 'job_completed',
  JOB_CANCELLED = 'job_cancelled',
  NEW_MESSAGE = 'new_message',
  WARNING_RECEIVED = 'warning_received',
  SUPPORT_REPLY = 'support_reply',
  CARD_ADDED = 'card_added',
  SUBSCRIPTION_ACTIVATED = 'subscription_activated',
  SUBSCRIPTION_INVOICE_PAID = 'subscription_invoice_paid',
  SUBSCRIPTION_PAYMENT_FAILED = 'subscription_payment_failed',
  SUBSCRIPTION_ENDED = 'subscription_ended',
  BOOKING_CONFIRMED = 'booking_confirmed',
  WARNING_THREAD_MESSAGE = 'warning_thread_message',
  REPORT_RESOLVED = 'report_resolved',
  REFUND_REQUESTED = 'refund_requested',
  REFUND_REJECTED = 'refund_rejected',
  PAYMENT_RECEIVED = 'payment_received',
  BOOKING_STATUS_CHANGED = 'booking_status_changed',
  VERIFICATION_REVIEWED = 'verification_reviewed',
  PAYOUT_ENABLED = 'payout_enabled',
  PAYOUT_ACTION_REQUIRED = 'payout_action_required',
  VERIFICATION_SUBMITTED = 'verification_submitted',
  CERTIFICATION_SUBMITTED = 'certification_submitted',
  CERTIFICATION_UPDATED = 'certification_updated',
  CERTIFICATION_REVIEWED = 'certification_reviewed',
}

export enum FcmPlatform {
  ANDROID = 'android',
  IOS = 'ios',
  WEB = 'web',
}

export enum WarningSenderType {
  ADMIN = 'admin',
  USER = 'user',
}

export enum SupportSenderType {
  ADMIN = 'admin',
  USER = 'user',
}

// ── Job contract ─────────────────────────────────────────────────────────────

/** How the provider will receive payments on a long-duration job contract */
export enum ContractPaymentFrequency {
  WEEKLY = 'weekly',
  BI_WEEKLY = 'bi_weekly',
  FORTNIGHTLY = 'fortnightly',
  MONTHLY = 'monthly',
}