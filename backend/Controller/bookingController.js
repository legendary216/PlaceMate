import Booking from '../models/Booking.js';
import Mentor from '../models/Mentors.js'; // Assuming this is your Mentor model path
import dayjs from 'dayjs'; // You'll need to install dayjs: npm install dayjs
import utc from 'dayjs/plugin/utc.js'; // For handling timezones reliably
import timezone from 'dayjs/plugin/timezone.js'; // For handling timezones reliably
import { sendBookingConfirmationEmail, sendBookingRequestEmail } from '../utils/emails.js'; // Assuming you have/will create sendBookingRequestEmail

dayjs.extend(utc);
dayjs.extend(timezone);

// Helper function to generate potential slots based on mentor's template
const generatePotentialSlots = (availabilitySlots, startDate, numDays) => {
  const potentialSlots = [];
  const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  for (let i = 0; i < numDays; i++) {
    const currentDay = dayjs(startDate).add(i, 'day');
    const dayOfWeek = dayMap[currentDay.day()]; // e.g., "Monday"

    const matchingTemplates = availabilitySlots.filter(slot => slot.day === dayOfWeek);

    matchingTemplates.forEach(template => {
      const [startHour, startMinute] = template.startTime.split(':').map(Number);
      const [endHour, endMinute] = template.endTime.split(':').map(Number);

      let slotTime = currentDay.hour(startHour).minute(startMinute).second(0).millisecond(0);
      const endTime = currentDay.hour(endHour).minute(endMinute).second(0).millisecond(0);

      // Generate 30-minute slots within the template range
      while (slotTime.add(30, 'minute').isBefore(endTime) || slotTime.add(30, 'minute').isSame(endTime)) {
        potentialSlots.push({
          startTime: slotTime.toDate(), // Store as Date object
          endTime: slotTime.add(30, 'minute').toDate()
        });
        slotTime = slotTime.add(30, 'minute');
      }
    });
  }
  return potentialSlots;
};


// @desc    Get available booking slots for a specific mentor for the next week
// @route   GET /api/bookings/available/:mentorId
// @access  Private (User only - to book)
export const getAvailableSlots = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const mentor = await Mentor.findById(mentorId);

    if (!mentor || mentor.status !== 'approved') {
      return res.status(404).json({ message: 'Mentor not found or not available.' });
    }

    // Define the time range (e.g., next 7 days starting from tomorrow)
    const startDate = dayjs().add(1, 'day').startOf('day'); // Start from tomorrow
    const endDate = startDate.add(7, 'day').endOf('day'); // Look 7 days ahead

    // 1. Generate all potential slots based on the mentor's template
    const potentialSlots = generatePotentialSlots(mentor.availabilitySlots, startDate, 7);

    // 2. Find existing bookings for this mentor within the date range
    const existingBookings = await Booking.find({
      mentor: mentorId,
      startTime: { $gte: startDate.toDate(), $lte: endDate.toDate() },
      status: 'confirmed' // Only consider confirmed bookings
    });

    // 3. Filter out slots that overlap with existing bookings
    const availableSlots = potentialSlots.filter(potential => {
      return !existingBookings.some(existing => {
        // Check if potential slot start time falls within an existing booking
        return dayjs(potential.startTime).isSame(existing.startTime);
      });
    });

    res.status(200).json(availableSlots);

  } catch (error) {
    console.error('Error getting available slots:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const createBooking = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { mentorId, startTime, endTime } = req.body;

    if (!mentorId || !startTime || !endTime) {
      return res.status(400).json({ message: 'Mentor ID, start time, and end time are required.' });
    }

    const start = dayjs(startTime).toDate();
    const end = dayjs(endTime).toDate();

    if (dayjs(start).isBefore(dayjs())) {
      return res.status(400).json({ message: 'Cannot book a time slot in the past.' });
    }

    // Check for existing PENDING or CONFIRMED booking for this slot
    const existingBooking = await Booking.findOne({
      mentor: mentorId,
      startTime: start,
      status: { $in: ['pending_mentor_approval', 'confirmed'] } // Check both pending and confirmed
    });

    if (existingBooking) {
      // If already confirmed, it's unavailable. If pending, let the mentor decide.
       if (existingBooking.status === 'confirmed') {
           return res.status(400).json({ message: 'This time slot has already been booked.' });
       } else {
            // Allow multiple pending requests or return specific message
            // For simplicity, we'll allow it for now, mentor decides.
            // You could also return a message like "Request for this slot already pending."
       }
    }

    // Create booking with PENDING status
    const newBookingRequest = await Booking.create({
      student: studentId,
      mentor: mentorId,
      startTime: start,
      endTime: end,
      status: 'pending_mentor_approval', // Set initial status
    });

    // --- Send NOTIFICATION TO MENTOR about the request ---
    const requestDetails = await Booking.findById(newBookingRequest._id)
                                        .populate('student', 'name email')
                                        .populate('mentor', 'fullName email');
    if (requestDetails) {
        // Create a new email function in utils/email.js for requests
        sendBookingRequestEmail(requestDetails);
    }
    // --- End Notification ---

    res.status(201).json({ message: 'Booking request sent! Waiting for mentor approval.', booking: newBookingRequest });

  } catch (error) {
    console.error('Error creating booking request:', error);
     // Handle potential duplicate key error (if using the unique index on pending requests)
    if (error.code === 11000) {
         return res.status(400).json({ message: 'You already have a pending request for this slot.' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- NEW FUNCTION: Get Pending Booking Requests for Mentor ---
// @desc    Get the logged-in mentor's pending booking requests
// @route   GET /api/bookings/my-pending-requests
// @access  Private (Mentor only)
export const getPendingBookingRequests = async (req, res) => {
  try {
    const mentorId = req.user.id;

    const pendingBookings = await Booking.find({
      mentor: mentorId,
      status: 'pending_mentor_approval' // Only get pending requests
    })
    .populate('student', 'name email') // Get student details
    .sort({ createdAt: 1 }); // Order by oldest request first

    res.status(200).json(pendingBookings);

  } catch (error) {
    console.error('Error fetching pending booking requests:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- NEW FUNCTION: Mentor Confirms Booking Request ---
// @desc    Mentor confirms a booking request and adds meeting link
// @route   PATCH /api/bookings/confirm/:bookingId
// @access  Private (Mentor only)
export const confirmBookingRequest = async (req, res) => {
  try {
    const mentorId = req.user.id;
    const { bookingId } = req.params;
    const { meetingLink } = req.body; // Mentor provides this

    if (!meetingLink) {
        return res.status(400).json({ message: 'Meeting link is required to confirm.' });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking request not found.' });
    }

    // Security check: Mentor owns this booking
    if (booking.mentor.toString() !== mentorId) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    // Check if it's still pending
    if (booking.status !== 'pending_mentor_approval') {
        return res.status(400).json({ message: `This request is already ${booking.status}.` });
    }

    // CRUCIAL: Final double-booking check at the moment of confirmation
    const conflictingBooking = await Booking.findOne({
      _id: { $ne: bookingId }, // Exclude the current booking request
      mentor: mentorId,
      startTime: booking.startTime,
      status: 'confirmed' // Check against already confirmed bookings
    });

    if (conflictingBooking) {
        return res.status(400).json({ message: 'You already have a confirmed booking for this time slot.' });
    }

    // Update booking
    booking.status = 'confirmed';
    booking.meetingLink = meetingLink;
    await booking.save();

    // --- Send CONFIRMATION EMAIL TO STUDENT (with link) ---
     const bookingDetails = await Booking.findById(booking._id)
                                        .populate('student', 'name email')
                                        .populate('mentor', 'fullName email'); // Include mentor details too
    if (bookingDetails) {
        // Use the existing confirmation email function, it should now include the link
        sendBookingConfirmationEmail(bookingDetails);
    }
    // --- End Notification ---

    res.status(200).json({ message: 'Booking confirmed!', booking });

  } catch (error) {
    console.error('Error confirming booking:', error);
     if (error.kind === 'ObjectId') {
         return res.status(404).json({ message: 'Booking request not found.' });
     }
    res.status(500).json({ message: 'Server Error' });
  }
};

export const rejectBookingRequest = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { bookingId } = req.params;

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: 'Booking request not found.' });
        }

        // Security check
        if (booking.mentor.toString() !== mentorId) {
            return res.status(403).json({ message: 'Not authorized.' });
        }

        if (booking.status !== 'pending_mentor_approval') {
             return res.status(400).json({ message: `This request is already ${booking.status}.` });
        }

        booking.status = 'rejected_by_mentor';
        await booking.save();

        // Optional: Notify student of rejection
        // const bookingDetails = await Booking.findById(...).populate(...);
        // sendBookingRejectionEmail(bookingDetails); // Need to create this function

        res.status(200).json({ message: 'Booking request rejected.' });

    } catch (error) {
        console.error('Error rejecting booking:', error);
        if (error.kind === 'ObjectId') {
             return res.status(404).json({ message: 'Booking request not found.' });
         }
        res.status(500).json({ message: 'Server Error' });
    }
};
// ... (imports and other functions)

// @desc    Get the logged-in mentor's upcoming schedule
// @route   GET /api/bookings/my-schedule
// @access  Private (Mentor only)
export const getMySchedule = async (req, res) => {
  try {
    const mentorId = req.user.id; // From 'protect' middleware
    const now = new Date();

    const upcomingBookings = await Booking.find({
      mentor: mentorId,
      startTime: { $gte: now }, // Only get future or current bookings
      status: 'confirmed'
    })
    .populate('student', 'name email') // Get student details
    .sort({ startTime: 1 }); // Order by soonest first

    res.status(200).json(upcomingBookings);

  } catch (error) {
    console.error('Error fetching mentor schedule:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getMyStudentSchedule = async (req, res) => {
  try {
    const studentId = req.user.id; // From 'protect' middleware
    const now = new Date();

    const upcomingBookings = await Booking.find({
      student: studentId, // Query by student ID
      startTime: { $gte: now },
      status: 'confirmed'
    })
    .populate('mentor', 'fullName jobTitle company profilePic') // Get mentor details
    .sort({ startTime: 1 }); // Order by soonest first

    res.status(200).json(upcomingBookings);

  } catch (error) {
    console.error('Error fetching student schedule:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};