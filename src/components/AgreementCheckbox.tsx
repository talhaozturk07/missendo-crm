import { useState, useRef, useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const privacySections = [
  {
    title: "1. Introduction",
    content: `At Miss Endo CRM ("we", "our", or "platform"), we take the protection of your personal data very seriously. This Privacy Policy explains in detail the information we collect, use, store, and protect when you use our CRM services designed for clinics operating in the health tourism sector.\n\nThis policy has been prepared in accordance with all applicable data protection regulations, primarily the European Union General Data Protection Regulation (GDPR) and the Turkish Personal Data Protection Law (KVKK - Law No. 6698).`
  },
  {
    title: "2. Data Controller",
    content: `Miss Endo acts as the data controller for personal data processed on this platform.\n\nContact: info@missendo.com`
  },
  {
    title: "3. Data We Collect",
    content: `We collect the following categories of personal data as part of our services:\n\na) User (Clinic Staff) Data:\n• First and Last Name\n• Email address\n• Phone number\n• Profile photo (optional)\n• Organization/clinic information\n• User role and access permissions\n\nb) Lead (Potential Patient) Data:\n• First and Last Name\n• Phone number\n• Email address\n• Country information\n• Treatment interest information\n• Lead source (Facebook Lead Ads, manual entry, etc.)\n• Communication history and notes\n\nc) Patient Data:\n• First and Last Name\n• Phone number and email address\n• Date of birth and gender\n• Country and address information\n• Medical condition and allergy information\n• Treatment plans and history\n• Appointment and financial records\n• Companion information\n• Patient photos and documents\n\nd) Data Collected via Facebook Lead Ads:\n• Facebook username or full name\n• Phone number\n• Email address\n• Custom fields filled in the Facebook lead form (treatment preferences, country information, etc.)`
  },
  {
    title: "4. Facebook Integration and Permissions",
    content: `Our platform integrates with the Meta (Facebook) platform to enable clinics to automatically import potential patients from their Facebook Lead Ads campaigns into the CRM.\n\nAs part of this integration, the following Facebook permissions are requested from clinic administrators:\n\na) pages_show_list (List Pages):\n• Purpose: To display the list of Facebook Pages managed by the user\n• Usage: To allow clinic administrators to select which Facebook Page they want to connect to the CRM\n• Data access: Page names and IDs only\n\nb) pages_read_engagement (Read Page Engagement):\n• Purpose: To obtain a valid Page Access Token for the connected Facebook Page\n• Usage: The Page Access Token is required for secure access to lead data and creating webhook subscriptions\n• Data access: Page Access Token and page metadata\n\nc) leads_retrieval (Lead Data Retrieval):\n• Purpose: To retrieve lead data submitted through Facebook Lead Ads forms\n• Usage: To automatically import potential patient information into the CRM system\n• Data access: Fields filled by users in lead forms (name, phone, email, custom questions)\n\nd) pages_manage_metadata (Manage Page Metadata):\n• Purpose: To create a webhook subscription on the Facebook Page\n• Usage: To configure the page webhook for receiving real-time notifications when new leads arrive\n• Data access: Page webhook configuration\n\ne) ads_read (Read Advertising Data):\n• Purpose: To access Facebook ad account and campaign information\n• Usage: To list Pages managed through Business Manager and display ad performance metrics\n• Data access: Ad account IDs, campaign names, ad set information, and performance metrics (impressions, clicks, cost, etc.)\n\nImportant Notes:\n• Facebook permissions are only obtained with the explicit consent of the clinic administrator (OAuth 2.0 authorization flow).\n• Access tokens obtained are stored securely in encrypted form.\n• Facebook data is used solely within the scope of the CRM platform for clinic operations.\n• Users can disconnect their Facebook connection at any time, in which case the associated access tokens are deleted from the system.\n• No data obtained from Facebook is shared with third parties or used for advertising purposes.`
  },
  {
    title: "5. Data Collection Methods",
    content: `Personal data is collected through the following methods:\n\n• Direct Entry: Data manually entered into the platform by clinic staff\n• Facebook Lead Ads: Lead data automatically transferred through Facebook ad forms (with the user's consent on Facebook)\n• Account Creation: Information obtained during the registration of clinic staff\n• Platform Usage: User interactions on the platform (creating appointments, adding notes, etc.)`
  },
  {
    title: "6. Purpose of Data Use",
    content: `The personal data we collect is processed for the following legitimate purposes:\n\n• Lead Management: Tracking potential patients, establishing communication, and managing the patient conversion process\n• Patient Relationship Management: Recording patient information, planning and tracking treatment processes\n• Appointment Management: Creating, editing appointments, and sending automated reminders\n• Transfer & Accommodation: Coordinating airport transfers and hotel accommodations for international patients\n• Financial Management: Treatment cost, payment, and income-expense tracking\n• Communication: Email campaigns, reminders, and notifications (managed by the clinic)\n• Reporting & Analytics: Measuring clinic performance and improving service quality\n• Legal Obligations: Mandatory record-keeping and reporting under applicable legislation`
  },
  {
    title: "7. Legal Basis for Data Processing",
    content: `Your personal data is processed within the following legal frameworks:\n\n• Explicit Consent: Consent of users filling out Facebook Lead Ads forms\n• Performance of Contract: Data processing under the service agreement with clinics\n• Legitimate Interest: Improving service quality and ensuring security\n• Legal Obligation: Mandatory record-keeping under health legislation and tax legislation\n\nPersonal data is processed within the legal bases specified in KVKK Article 5 and GDPR Article 6.`
  },
  {
    title: "8. Data Sharing and Transfer",
    content: `Your personal data will not be shared with third parties for marketing or advertising purposes without your explicit consent. However, data transfer may occur in the following cases:\n\n• Service Providers: Data is shared with technical infrastructure providers (Supabase - database and authentication services) with data security ensured\n• Partner Clinics: Information is shared with the relevant clinic only for treatment purposes and with the patient's knowledge\n• Meta (Facebook): API communication is carried out only within the scope of OAuth authorization to receive Facebook Lead Ads data. No patient data is sent to Facebook\n• Legal Requirements: Sharing with authorized institutions and organizations may occur pursuant to court orders, prosecution requests, or applicable legislation\n\nInternational Data Transfer:\nAs our platform uses cloud-based infrastructure, data may be hosted on servers outside the EU/EEA. In such cases, appropriate safeguards (Standard Contractual Clauses) under GDPR Article 46 are applied.`
  },
  {
    title: "9. Data Security",
    content: `We implement the following security measures to protect your data:\n\n• Encryption: All data is encrypted both in transit (TLS/SSL) and at rest (AES-256)\n• Authentication: Strong password policies and secure session management\n• Access Control: Role-based access system (Super Admin, Clinic Admin, Clinic User) ensures each user can only access data they are authorized for\n• Organization Isolation: Each clinic/organization can only access their own data, cross-access is blocked\n• Audit Logging: Critical data operations (create, update, delete) are recorded in audit logs\n• Secure Token Management: Facebook access tokens are stored encrypted and transmitted through secure channels\n• Regular Security Updates: Platform infrastructure is continuously updated and security vulnerabilities are proactively addressed`
  },
  {
    title: "10. Data Retention Periods",
    content: `Your personal data is retained for the duration required by the processing purpose:\n\n• Lead Data: As long as the lead status is active or until a data deletion request\n• Patient Data: For the period prescribed by relevant health legislation from the completion of the treatment process\n• Financial Records: 10 years under tax legislation\n• Audit Logs: 2 years\n• Facebook Access Tokens: Immediately deleted when the connection is disconnected\n\nData that has exceeded its retention period is permanently deleted or anonymized using secure methods.`
  },
  {
    title: "11. User Rights (KVKK/GDPR)",
    content: `You have the following rights under applicable data protection legislation:\n\n• Right to Information: To learn whether your personal data is being processed\n• Right of Access: To request access to your processed personal data\n• Right to Rectification: To request correction of incomplete or inaccurate personal data\n• Right to Erasure (Right to be Forgotten): To request deletion of your personal data\n• Right to Restriction: To request restriction of data processing under certain conditions\n• Right to Object: To object to the processing of your personal data\n• Data Portability: To receive your data in a structured, commonly used, and machine-readable format\n• Right to Object to Automated Decision-Making: To object to decisions based solely on automated processing, including automated profiling\n• Right to Complain: To file a complaint with the relevant data protection authority (Turkey: KVKK Board, EU: local data protection authority)\n\nTo exercise these rights, you can send an email to info@missendo.com. Your request will be evaluated and responded to within 30 days.`
  },
  {
    title: "12. Cookies and Tracking Technologies",
    content: `Our platform uses essential session cookies to provide core functionality. These cookies:\n\n• Are required for authentication and session management\n• Store user preferences (language, theme, etc.)\n• Are not used for third-party tracking or advertising purposes\n\nThe platform does not use third-party tracking tools that monitor user behavior or create profiles.`
  },
  {
    title: "13. Policy Changes",
    content: `This privacy policy may be updated from time to time. When significant changes are made, notifications will be provided through the platform or via email. The current policy will always be published on this page.\n\nYour continued use of the platform means you accept the current privacy policy.`
  },
  {
    title: "14. Contact",
    content: `For questions about our privacy policy, your personal data, or your rights:\n\nEmail: info@missendo.com\n\nFor detailed instructions on data deletion requests, please visit the /legal/data-deletion page.`
  }
];

const termsSections = [
  {
    title: "1. Service Description",
    content: `Miss Endo CRM ("platform") is a comprehensive customer relationship management system developed for clinics operating in the health tourism sector. The platform offers lead management, patient tracking, appointment scheduling, transfer and accommodation coordination, financial management, email campaigns, Facebook Lead Ads integration, and reporting tools.\n\nThe platform can only be used by organizations (clinics) that have signed a contract with Miss Endo. Individual user accounts are created by organization administrators.`
  },
  {
    title: "2. Account Creation and Access",
    content: `• Organizations are created exclusively by Miss Endo, and accounts are opened only for companies that have completed the contract process.\n• Each organization manages its own users (clinic staff).\n• User accounts are managed with a role-based access system: Super Admin, Clinic Admin, and Clinic User.\n• Each user can only access data belonging to their own organization.\n• You are responsible for the security and confidentiality of your account credentials.`
  },
  {
    title: "3. User Responsibilities",
    content: `By using the platform, you agree to the following responsibilities:\n\n• Ensure that all information you enter into the platform is accurate, current, and complete\n• Keep your account credentials (email and password) confidential and not share them with anyone\n• Immediately report any unauthorized access to info@missendo.com\n• Use the platform only for legitimate clinic operations\n• Protect the confidentiality of patient and lead data and act in accordance with KVKK/GDPR legislation\n• Respect third-party rights (intellectual property, privacy, etc.)\n• Not share data obtained through the platform with unauthorized persons or organizations`
  },
  {
    title: "4. Prohibited Use",
    content: `The platform may not be used for the following purposes:\n\n• Illegal activities or fraud\n• Spam, unsolicited emails, or mass messaging (misuse of platform email tools)\n• Actions that threaten platform security (hacking, DDoS, data leak attempts, etc.)\n• Unauthorized access attempts to other organizations' or users' data\n• Reverse engineering, decompiling, or copying of the platform\n• Entering false or misleading information\n• Licensing, renting, or selling the platform to third parties`
  },
  {
    title: "5. Facebook Integration",
    content: `The platform integrates with Facebook Lead Ads. By using this integration:\n\n• You agree to connect your clinic's Facebook Page through Facebook OAuth authorization\n• You confirm that you understand and consent to the purpose of the requested Facebook permissions (pages_show_list, pages_read_engagement, leads_retrieval, pages_manage_metadata, ads_read)\n• You accept that data obtained from Facebook will only be used within the scope of clinic CRM operations\n• You commit to acting in accordance with Meta Platform Policies and Developer Terms\n• You understand that you can disconnect the Facebook connection at any time and that the associated data will be deleted`
  },
  {
    title: "6. Intellectual Property",
    content: `• All intellectual property rights on the Miss Endo CRM platform, its design, source code, logo, and all content belong to Miss Endo.\n• Copying, reproducing, distributing, modifying, or creating derivative works of any part of the platform without written permission is prohibited.\n• Data entered by users on the platform (patient information, lead data, etc.) belongs to the respective organization.\n• Miss Endo reserves the right to use user data for anonymous and aggregate statistical analyses.`
  },
  {
    title: "7. Privacy and Data Protection",
    content: `Detailed information regarding the protection of personal data processed on the platform can be found in our Privacy Policy (/legal/privacy-policy).\n\nAs platform users, you are also obligated to protect the confidentiality of data within your access scope and comply with relevant data protection legislation (KVKK, GDPR).`
  },
  {
    title: "8. Service Level and Availability",
    content: `• Miss Endo makes reasonable efforts to ensure continuous and uninterrupted platform operation but does not guarantee 100% availability.\n• Planned maintenance will be communicated in advance whenever possible.\n• Miss Endo cannot be held responsible for interruptions caused by technical issues, natural disasters, internet infrastructure problems, or third-party services (Facebook, Supabase, etc.).`
  },
  {
    title: "9. Limitation of Liability",
    content: `• Miss Endo is not responsible for direct or indirect damages arising from the use or inability to use the platform.\n• The accuracy, completeness, and legality of data entered into the platform is the user's responsibility.\n• Miss Endo does not guarantee the performance or availability of third-party services (Facebook, email providers, etc.).\n• Miss Endo does not accept any responsibility for medical decisions or treatment planning carried out through the platform. The platform is not a medical device or medical decision support system.`
  },
  {
    title: "10. Account Suspension and Termination",
    content: `Miss Endo may suspend or terminate a user account or organization in the following cases:\n\n• Violation of these terms of service\n• Suspicion of illegal activity\n• Behavior constituting a security threat\n• Expiration or termination of the contract\n• Failure to fulfill payment obligations\n\nIn case of account termination, organizational data will be retained or deleted in accordance with the periods prescribed by applicable legislation.`
  },
  {
    title: "11. Service Changes",
    content: `Miss Endo reserves the right to modify platform features, add new features, remove existing features, or completely terminate the service at any time. Significant changes will be communicated with reasonable advance notice.`
  },
  {
    title: "12. Modification of Terms",
    content: `These terms of service may be updated from time to time. Changes take effect when published and are communicated through the platform or via email. Your continued use of the platform means you accept the current terms.\n\nAdditional consent may be requested for significant changes.`
  },
  {
    title: "13. Applicable Law and Dispute Resolution",
    content: `These terms of service are subject to the laws of the Republic of Turkey. All disputes arising from or related to these terms shall be resolved under the exclusive jurisdiction of the Istanbul (Anatolian) Courts and Execution Offices.`
  },
  {
    title: "14. Contact",
    content: `For questions about terms of service:\n\nEmail: info@missendo.com`
  }
];

interface AgreementCheckboxProps {
  agreed: boolean;
  onAgreedChange: (agreed: boolean) => void;
}

export function AgreementCheckbox({ agreed, onAgreedChange }: AgreementCheckboxProps) {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [privacyRead, setPrivacyRead] = useState(false);
  const [termsRead, setTermsRead] = useState(false);
  const [pendingFromCheckbox, setPendingFromCheckbox] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const termsScrollRef = useRef<HTMLDivElement>(null);

  const handleCheckboxClick = () => {
    if (agreed) {
      onAgreedChange(false);
      setPrivacyRead(false);
      setTermsRead(false);
      return;
    }
    if (privacyRead && termsRead) {
      onAgreedChange(true);
      return;
    }
    setPendingFromCheckbox(true);
    if (!privacyRead) {
      setShowPrivacy(true);
    } else {
      setShowTerms(true);
    }
  };

  const handlePrivacyAgree = () => {
    setPrivacyRead(true);
    setShowPrivacy(false);
    if (!termsRead) {
      if (pendingFromCheckbox) {
        setShowTerms(true);
      }
    } else {
      onAgreedChange(true);
      setPendingFromCheckbox(false);
    }
  };

  const handleTermsAgree = () => {
    setTermsRead(true);
    setShowTerms(false);
    if (!privacyRead) {
      if (pendingFromCheckbox) {
        setShowPrivacy(true);
      }
    } else {
      onAgreedChange(true);
      setPendingFromCheckbox(false);
    }
  };

  const handlePrivacyClose = (open: boolean) => {
    if (!open) {
      setShowPrivacy(false);
      setPendingFromCheckbox(false);
    }
  };

  const handleTermsClose = (open: boolean) => {
    if (!open) {
      setShowTerms(false);
      setPendingFromCheckbox(false);
    }
  };

  const handlePrivacyLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setPendingFromCheckbox(false);
    setShowPrivacy(true);
  };

  const handleTermsLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setPendingFromCheckbox(false);
    setShowTerms(true);
  };

  const [privacyScrolledToBottom, setPrivacyScrolledToBottom] = useState(false);
  const [termsScrolledToBottom, setTermsScrolledToBottom] = useState(false);

  const handlePrivacyScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
      setPrivacyScrolledToBottom(true);
    }
  }, []);

  const handleTermsScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
      setTermsScrolledToBottom(true);
    }
  }, []);

  return (
    <>
      <div className="flex items-start gap-2">
        <Checkbox
          id="agreement"
          checked={agreed}
          onCheckedChange={handleCheckboxClick}
        />
        <label htmlFor="agreement" className="text-sm text-muted-foreground leading-snug cursor-pointer select-none">
          I have read and agree to the{' '}
          <button
            type="button"
            onClick={handlePrivacyLinkClick}
            className="text-primary underline hover:text-primary/80 font-medium"
          >
            Privacy Policy
          </button>{' '}
          and{' '}
          <button
            type="button"
            onClick={handleTermsLinkClick}
            className="text-primary underline hover:text-primary/80 font-medium"
          >
            Terms of Use
          </button>
          .
        </label>
      </div>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacy} onOpenChange={handlePrivacyClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
          </DialogHeader>
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto pr-2 space-y-4"
            style={{ maxHeight: '60vh' }}
            onScroll={handlePrivacyScroll}
          >
            {privacySections.map((section, i) => (
              <div key={i} className="space-y-1">
                <h3 className="font-semibold">{section.title}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
          <DialogFooter className="mt-4">
            <Button
              onClick={handlePrivacyAgree}
              disabled={!privacyScrolledToBottom}
              className="w-full"
            >
              {privacyScrolledToBottom ? 'I Agree' : 'Please scroll to the bottom to continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terms of Use Dialog */}
      <Dialog open={showTerms} onOpenChange={handleTermsClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Terms of Use</DialogTitle>
          </DialogHeader>
          <div
            ref={termsScrollRef}
            className="flex-1 overflow-y-auto pr-2 space-y-4"
            style={{ maxHeight: '60vh' }}
            onScroll={handleTermsScroll}
          >
            {termsSections.map((section, i) => (
              <div key={i} className="space-y-1">
                <h3 className="font-semibold">{section.title}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
          <DialogFooter className="mt-4">
            <Button
              onClick={handleTermsAgree}
              disabled={!termsScrolledToBottom}
              className="w-full"
            >
              {termsScrolledToBottom ? 'I Agree' : 'Please scroll to the bottom to continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
