import nodemailer from 'nodemailer';
import dayjs from 'dayjs'; // Ensure dayjs is installed: npm install dayjs

// --- 1. CONFIGURE YOUR EMAIL TRANSPORT ---
// Choose ONE method below (Ethereal for testing or Gmail/Other for production)

// Method A: Ethereal (for testing - emails go to a test inbox)
// Go to https://ethereal.email/create to get free test credentials
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: process.env.EMAIL_PORT || 587,
  auth: {
    // ----> IMPORTANT: Replace with YOUR Ethereal credentials <----
    // ----> OR better, put them in your .env file           <----
    user: process.env.EMAIL_USER || 'YOUR_ETHEREAL_USER@ethereal.email',
    pass: process.env.EMAIL_PASS || 'YOUR_ETHEREAL_PASSWORD',
  },
});

/*
// Method B: Gmail (Requires "App Password" - DO NOT use your regular password)
//   1. Enable 2-Step Verification on your Google Account.
//   2. Go to https://myaccount.google.com/apppasswords
//   3. Select "Mail" and "Other (Custom name)" -> name it "PlaceMateApp" (or similar).
//   4. Google will generate a 16-character App Password. Use this password below.
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use 'gmail' service
  auth: {
    // ----> IMPORTANT: Replace with YOUR Gmail and App Password <----
    // ----> Put these in your .env file                      <----
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'YOUR_16_CHARACTER_APP_PASSWORD', // Use the generated App Password
  },
});
*/

/*
// Method C: Other Email Providers (SendGrid, Mailgun, etc.)
// Check their documentation for SMTP host, port, and authentication details.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT, // Usually 587 or 465
  secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Your username (often email or API key)
    pass: process.env.EMAIL_PASS, // Your password or API key
  },
});
*/

// --- 2. EMAIL SENDING FUNCTIONS ---

/**
 * Sends confirmation emails to student and mentor after booking is confirmed.
 * @param {object} bookingDetails - Populated booking object with student and mentor details.
 */
export const sendBookingConfirmationEmail = async (bookingDetails) => {
  if (!bookingDetails || !bookingDetails.student || !bookingDetails.mentor) {
     console.error("sendBookingConfirmationEmail: Invalid bookingDetails received.");
     return;
  }
  const { student, mentor, startTime, endTime, meetingLink } = bookingDetails; // Include meetingLink

  const formattedStartTime = dayjs(startTime).format('dddd, MMMM D, YYYY [at] h:mm A');
  const formattedEndTime = dayjs(endTime).format('h:mm A');

  // Email to Student
  const studentMailOptions = {
    from: `"PlaceMate" <${process.env.EMAIL_FROM || 'noreply@placemate.com'}>`,
    to: student.email,
    subject: 'Mentorship Session Confirmed!',
    text: `Hi ${student.name},\n\nYour mentorship session with ${mentor.fullName} is confirmed!\n\nDetails:\nDate & Time: ${formattedStartTime} - ${formattedEndTime}\nMentor: ${mentor.fullName}\nMeeting Link: ${meetingLink || 'Your mentor will provide this.'}\n\nBest regards,\nThe PlaceMate Team`,
    html: `<p>Hi ${student.name},</p><p>Your mentorship session with <strong>${mentor.fullName}</strong> is confirmed!</p><p><strong>Details:</strong><br>Date & Time: ${formattedStartTime} - ${formattedEndTime}<br>Mentor: ${mentor.fullName}<br>Meeting Link: ${meetingLink ? `<a href="${meetingLink}">${meetingLink}</a>` : 'Your mentor will provide this.'}</p><p>Best regards,<br>The PlaceMate Team</p>`,
  };

  // Email to Mentor (Confirming THEIR acceptance)
  const mentorMailOptions = {
    from: `"PlaceMate" <${process.env.EMAIL_FROM || 'noreply@placemate.com'}>`,
    to: mentor.email,
    subject: 'Mentorship Session Confirmed!', // Subject change
    text: `Hi ${mentor.fullName},\n\nYou have confirmed the mentorship session with ${student.name}.\n\nDetails:\nDate & Time: ${formattedStartTime} - ${formattedEndTime}\nStudent: ${student.name} (${student.email})\nMeeting Link Provided: ${meetingLink}\n\nBest regards,\nThe PlaceMate Team`,
    html: `<p>Hi ${mentor.fullName},</p><p>You have confirmed the mentorship session with <strong>${student.name}</strong>.</p><p><strong>Details:</strong><br>Date & Time: ${formattedStartTime} - ${formattedEndTime}<br>Student: ${student.name} (${student.email})<br>Meeting Link Provided: <a href="${meetingLink}">${meetingLink}</a></p><p>Best regards,<br>The PlaceMate Team</p>`,
  };

  try {
    console.log(`Sending confirmation email to student: ${student.email}`);
    let infoStudent = await transporter.sendMail(studentMailOptions);
    console.log(`Sending confirmation email to mentor: ${mentor.email}`);
    let infoMentor = await transporter.sendMail(mentorMailOptions);
    console.log('Booking confirmation emails sent successfully.');
    // For Ethereal: Log the preview URL
    if (process.env.EMAIL_HOST === 'smtp.ethereal.email') {
        console.log("Ethereal Student Email Preview URL: %s", nodemailer.getTestMessageUrl(infoStudent));
        console.log("Ethereal Mentor Email Preview URL: %s", nodemailer.getTestMessageUrl(infoMentor));
    }

  } catch (error) {
    console.error('Error sending booking confirmation emails:', error);
  }
};


/**
 * Sends notification email to mentor when a student requests a booking.
 * @param {object} requestDetails - Populated booking object (status pending) with student and mentor details.
 */
export const sendBookingRequestEmail = async (requestDetails) => {
   if (!requestDetails || !requestDetails.student || !requestDetails.mentor) {
     console.error("sendBookingRequestEmail: Invalid requestDetails received.");
     return;
   }
  const { student, mentor, startTime, endTime } = requestDetails;

  const formattedStartTime = dayjs(startTime).format('dddd, MMMM D, YYYY [at] h:mm A');
  const formattedEndTime = dayjs(endTime).format('h:mm A');

  // Link to the mentor dashboard
  const dashboardLink = `${process.env.FRONTEND_URL || 'http://localhost:8081'}/mentor`; // Update port if needed

  const mailOptions = {
    from: `"PlaceMate" <${process.env.EMAIL_FROM || 'noreply@placemate.com'}>`,
    to: mentor.email,
    subject: 'New Mentorship Session Request!',
    text: `Hi ${mentor.fullName},\n\n${student.name} (${student.email}) has requested a mentorship session with you.\n\nRequested Time:\n${formattedStartTime} - ${formattedEndTime}\n\nPlease visit your Mentor Dashboard to accept or reject this request:\n${dashboardLink}\n\nBest regards,\nThe PlaceMate Team`,
    html: `<p>Hi ${mentor.fullName},</p>
           <p><strong>${student.name}</strong> (${student.email}) has requested a mentorship session with you.</p>
           <p><strong>Requested Time:</strong><br>${formattedStartTime} - ${formattedEndTime}</p>
           <p>Please visit your <a href="${dashboardLink}">Mentor Dashboard</a> to accept or reject this request.</p>
           <p>Best regards,<br>The PlaceMate Team</p>`,
  };

  try {
    console.log(`Sending booking request notification to mentor: ${mentor.email}`);
    let info = await transporter.sendMail(mailOptions);
    console.log('Booking request email sent successfully.');
     // For Ethereal: Log the preview URL
    if (process.env.EMAIL_HOST === 'smtp.ethereal.email') {
        console.log("Ethereal Request Email Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error sending booking request email:', error);
  }
};


/**
 * Sends notification email when a booking is cancelled.
 * @param {object} bookingDetails - Populated booking object with student and mentor details.
 * @param {string} cancelledBy - Indicates who cancelled ('student' or 'mentor').
 */
export const sendCancellationEmail = async (bookingDetails, cancelledBy) => {
  if (!bookingDetails || !bookingDetails.student || !bookingDetails.mentor) {
    console.error("sendCancellationEmail: Invalid bookingDetails received.");
    return;
  }
  const { student, mentor, startTime, endTime } = bookingDetails;

  const formattedStartTime = dayjs(startTime).format('dddd, MMMM D, YYYY [at] h:mm A');
  const formattedEndTime = dayjs(endTime).format('h:mm A');

  let recipientEmail;
  let recipientName;
  let subject;
  let textBody;
  let htmlBody;

  // Determine recipient and tailor the message
  if (cancelledBy === 'student') {
    recipientEmail = mentor.email;
    recipientName = mentor.fullName;
    subject = 'Mentorship Session Cancelled by Student';
    textBody = `Hi ${recipientName},\n\n${student.name} (${student.email}) has cancelled the mentorship session scheduled for:\n${formattedStartTime} - ${formattedEndTime}\n\nThis time slot may now be available for other bookings.\n\nBest regards,\nThe PlaceMate Team`;
    htmlBody = `<p>Hi ${recipientName},</p><p><strong>${student.name}</strong> (${student.email}) has cancelled the mentorship session scheduled for:</p><p>${formattedStartTime} - ${formattedEndTime}</p><p>This time slot may now be available for other bookings.</p><p>Best regards,<br>The PlaceMate Team</p>`;
  } else if (cancelledBy === 'mentor') {
    recipientEmail = student.email;
    recipientName = student.name;
    subject = 'Mentorship Session Cancelled by Mentor';
    textBody = `Hi ${recipientName},\n\n${mentor.fullName} has cancelled the mentorship session scheduled for:\n${formattedStartTime} - ${formattedEndTime}\n\nWe apologize for any inconvenience. Please feel free to browse and book with other mentors.\n\nBest regards,\nThe PlaceMate Team`;
    htmlBody = `<p>Hi ${recipientName},</p><p><strong>${mentor.fullName}</strong> has cancelled the mentorship session scheduled for:</p><p>${formattedStartTime} - ${formattedEndTime}</p><p>We apologize for any inconvenience. Please feel free to browse and book with other mentors.</p><p>Best regards,<br>The PlaceMate Team</p>`;
  } else {
    console.error("sendCancellationEmail: Invalid 'cancelledBy' value.");
    return; // Don't send if role is unclear
  }

  // Construct the email options
  const mailOptions = {
    from: `"PlaceMate" <${process.env.EMAIL_FROM || 'noreply@placemate.com'}>`,
    to: recipientEmail,
    subject: subject,
    text: textBody,
    html: htmlBody,
  };

  try {
    console.log(`Sending cancellation notification to: ${recipientEmail}`);
    let info = await transporter.sendMail(mailOptions);
    console.log('Cancellation email sent successfully.');
    if (process.env.EMAIL_HOST === 'smtp.ethereal.email') {
      console.log("Ethereal Cancellation Email Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error sending cancellation email:', error);
  }
};