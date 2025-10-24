import Booking from '../models/Booking.js';
import Mentor from '../models/Mentors.js'; // Assuming this is your Mentor model path
import dayjs from 'dayjs'; // You'll need to install dayjs: npm install dayjs
import utc from 'dayjs/plugin/utc.js'; // For handling timezones reliably
import timezone from 'dayjs/plugin/timezone.js'; // For handling timezones reliably

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


// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (User only)
export const createBooking = async (req, res) => {
  try {
    const studentId = req.user.id; // From 'protect' middleware
    const { mentorId, startTime, endTime } = req.body;

    if (!mentorId || !startTime || !endTime) {
      return res.status(400).json({ message: 'Mentor ID, start time, and end time are required.' });
    }

    // Convert string times back to Date objects for validation/saving
    const start = dayjs(startTime).toDate();
    const end = dayjs(endTime).toDate();

    // Basic validation: Check if start time is in the past
     if (dayjs(start).isBefore(dayjs())) {
       return res.status(400).json({ message: 'Cannot book a time slot in the past.' });
     }

    // CRUCIAL: Check if the slot is still available (prevent double booking)
    const existingBooking = await Booking.findOne({
      mentor: mentorId,
      startTime: start,
      status: 'confirmed'
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'This time slot is no longer available.' });
    }

    // Optional: Verify the chosen slot matches the mentor's general availability template
    // (More complex logic needed here to check day of week and time range)

    const newBooking = await Booking.create({
      student: studentId,
      mentor: mentorId,
      startTime: start,
      endTime: end,
    });

    // Optional: Send confirmation emails/notifications here

    res.status(201).json({ message: 'Booking confirmed!', booking: newBooking });

  } catch (error) {
    console.error('Error creating booking:', error);
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