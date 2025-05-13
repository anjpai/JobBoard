const nodemailer = require('nodemailer');
const config = require('config');

// Create a transporter for sending emails
let transporter;

try {
  // Try to get email configuration from config file
  const emailConfig = config.get('email');
  
  transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.password
    }
  });
} catch (err) {
  console.log('Email configuration not found, using ethereal for testing');
  
  // If no email config, use ethereal for testing
  nodemailer.createTestAccount().then(testAccount => {
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }).catch(err => {
    console.error('Failed to create test email account:', err);
  });
}

/**
 * Send an email notification
 * @param {Object} mailOptions - Email options
 * @returns {Promise} - Promise resolving to mail info or error
 */
const sendEmail = async (mailOptions) => {
  try {
    if (!transporter) {
      console.log('Email transport not configured');
      return false;
    }
    
    const info = await transporter.sendMail(mailOptions);
    
    // Log Ethereal URL for testing
    if (info.messageId && info.testMessageUrl) {
      console.log('Preview URL: %s', info.testMessageUrl);
    }
    
    return info;
  } catch (err) {
    console.error('Error sending email:', err);
    return false;
  }
};

/**
 * Send welcome email to new users
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} role - User role (student, company, admin)
 */
exports.sendWelcomeEmail = async (to, name, role) => {
  const mailOptions = {
    from: '"Campus Placement Portal" <noreply@campusplacement.com>',
    to,
    subject: 'Welcome to Campus Placement Portal',
    html: `
      <h2>Welcome to Campus Placement Portal, ${name}!</h2>
      <p>Thank you for registering on our platform as a ${role}.</p>
      <p>Your account is currently under review. You'll receive a notification once it's approved.</p>
      <p>In the meantime, you can complete your profile information to speed up the process.</p>
      <br>
      <p>Best regards,</p>
      <p>The Campus Placement Team</p>
    `
  };
  
  return sendEmail(mailOptions);
};

/**
 * Send status update notification to users
 * @param {string} to - Recipient email
 * @param {string} status - New status (approved, blocked)
 * @param {string} role - User role
 */
exports.sendStatusUpdateNotification = async (to, status, role) => {
  let subject, message;
  
  if (status === 'approved') {
    subject = 'Your Account Has Been Approved';
    message = `
      <h2>Your account has been approved!</h2>
      <p>You can now access all the features of the Campus Placement Portal.</p>
      ${role === 'company' ? 
        '<p>You can now post job listings and start recruiting talent from our campus.</p>' : 
        '<p>You can now view and apply for job listings posted by companies.</p>'
      }
    `;
  } else if (status === 'blocked') {
    subject = 'Account Access Restricted';
    message = `
      <h2>Your account access has been restricted</h2>
      <p>Your account has been temporarily blocked by the administrator.</p>
      <p>Please contact the placement office for more information.</p>
    `;
  } else {
    subject = 'Account Status Update';
    message = `
      <h2>Your account status has been updated</h2>
      <p>Your account status has been changed to: ${status}</p>
    `;
  }
  
  const mailOptions = {
    from: '"Campus Placement Portal" <noreply@campusplacement.com>',
    to,
    subject,
    html: `
      ${message}
      <br>
      <p>Best regards,</p>
      <p>The Campus Placement Team</p>
    `
  };
  
  return sendEmail(mailOptions);
};

/**
 * Send job status update notification to company
 * @param {string} to - Company email
 * @param {string} jobTitle - Job title
 * @param {string} status - New status (approved, rejected)
 * @param {string} feedback - Admin feedback
 */
exports.sendJobStatusUpdateNotification = async (to, jobTitle, status, feedback) => {
  const statusText = status === 'approved' ? 'approved' : 'not approved';
  
  const mailOptions = {
    from: '"Campus Placement Portal" <noreply@campusplacement.com>',
    to,
    subject: `Job Listing ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}: ${jobTitle}`,
    html: `
      <h2>Your job listing status has been updated</h2>
      <p>Your job listing <strong>${jobTitle}</strong> has been ${statusText} by the administrator.</p>
      ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ''}
      <br>
      <p>Best regards,</p>
      <p>The Campus Placement Team</p>
    `
  };
  
  return sendEmail(mailOptions);
};

/**
 * Send new application notification to company
 * @param {string} to - Company email
 * @param {string} jobTitle - Job title
 * @param {string} studentName - Student name
 */
exports.sendNewApplicationNotification = async (to, jobTitle, studentName) => {
  const mailOptions = {
    from: '"Campus Placement Portal" <noreply@campusplacement.com>',
    to,
    subject: `New Application Received: ${jobTitle}`,
    html: `
      <h2>New Job Application</h2>
      <p>A new application has been submitted for your job listing <strong>${jobTitle}</strong>.</p>
      <p>Applicant: ${studentName}</p>
      <p>Please log in to your account to review the application.</p>
      <br>
      <p>Best regards,</p>
      <p>The Campus Placement Team</p>
    `
  };
  
  return sendEmail(mailOptions);
};

/**
 * Send application status update notification to student
 * @param {string} to - Student email
 * @param {string} jobTitle - Job title
 * @param {string} status - New status
 * @param {string} feedback - Company feedback
 */
exports.sendApplicationStatusUpdateNotification = async (to, jobTitle, status, feedback) => {
  let statusMessage;
  
  switch (status) {
    case 'reviewing':
      statusMessage = 'Your application is now being reviewed.';
      break;
    case 'shortlisted':
      statusMessage = 'Congratulations! You have been shortlisted for the next round.';
      break;
    case 'rejected':
      statusMessage = 'We regret to inform you that your application was not selected to move forward.';
      break;
    case 'hired':
      statusMessage = 'Congratulations! You have been selected for the position.';
      break;
    default:
      statusMessage = `Your application status has been updated to: ${status}`;
  }
  
  const mailOptions = {
    from: '"Campus Placement Portal" <noreply@campusplacement.com>',
    to,
    subject: `Application Update: ${jobTitle}`,
    html: `
      <h2>Your Job Application Status</h2>
      <p>Your application for <strong>${jobTitle}</strong> has been updated.</p>
      <p><strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
      <p>${statusMessage}</p>
      ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ''}
      <br>
      <p>Best regards,</p>
      <p>The Campus Placement Team</p>
    `
  };
  
  return sendEmail(mailOptions);
};

/**
 * Send interview invitation to student
 * @param {string} to - Student email
 * @param {string} jobTitle - Job title
 * @param {string} companyName - Company name
 * @param {Object} interviewDetails - Interview details
 */
exports.sendInterviewInvitation = async (to, jobTitle, companyName, interviewDetails) => {
  const mailOptions = {
    from: '"Campus Placement Portal" <noreply@campusplacement.com>',
    to,
    subject: `Interview Invitation: ${companyName}`,
    html: `
      <h2>Interview Invitation</h2>
      <p>You have been invited for an interview for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
      <h3>Interview Details:</h3>
      <p><strong>Date:</strong> ${new Date(interviewDetails.date).toLocaleDateString()}</p>
      <p><strong>Time:</strong> ${new Date(interviewDetails.date).toLocaleTimeString()}</p>
      <p><strong>Round:</strong> ${interviewDetails.round}</p>
      <p><strong>Mode:</strong> ${interviewDetails.mode}</p>
      ${interviewDetails.location ? `<p><strong>Location:</strong> ${interviewDetails.location}</p>` : ''}
      ${interviewDetails.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${interviewDetails.meetingLink}">${interviewDetails.meetingLink}</a></p>` : ''}
      ${interviewDetails.additionalInfo ? `<p><strong>Additional Information:</strong> ${interviewDetails.additionalInfo}</p>` : ''}
      <br>
      <p>Best regards,</p>
      <p>The Campus Placement Team</p>
    `
  };
  
  return sendEmail(mailOptions);
};

/**
 * Send announcement notification
 * @param {string} to - Recipient email
 * @param {string} title - Announcement title
 */
exports.sendAnnouncementNotification = async (to, title) => {
  const mailOptions = {
    from: '"Campus Placement Portal" <noreply@campusplacement.com>',
    to,
    subject: `New Announcement: ${title}`,
    html: `
      <h2>New Announcement</h2>
      <p>A new announcement titled <strong>${title}</strong> has been posted on the Campus Placement Portal.</p>
      <p>Please log in to your account to view the complete announcement.</p>
      <br>
      <p>Best regards,</p>
      <p>The Campus Placement Team</p>
    `
  };
  
  return sendEmail(mailOptions);
};