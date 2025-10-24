import Mentor from '../models/Mentors.js'; // Adjust path, add .js

// @desc    Get all APPROVED mentors
// @route   GET /api/mentors/approved
// @access  Public
export const getApprovedMentors = async (req, res) => {
  try {
    // Find mentors who are 'approved'
    const mentors = await Mentor.find({ status: 'approved' }).select(
      // Select ONLY the fields you want to show publicly
      'fullName jobTitle company expertise profilePic'
    );
    
    res.status(200).json(mentors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};
export const getMentorProfile = async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id);

    // 1. Check if mentor exists and is approved
    if (!mentor || mentor.status !== 'approved') {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    // 2. Construct the public profile object
    //    Include the new 'availabilitySlots' and remove old fields
    const publicProfile = {
      _id: mentor._id,
      fullName: mentor.fullName,
      jobTitle: mentor.jobTitle,
      company: mentor.company,
      experience: mentor.experience,
      qualification: mentor.qualification,
      expertise: mentor.expertise,
      profilePic: mentor.profilePic,
      // --- ADD THIS FIELD ---
      availabilitySlots: mentor.availabilitySlots,
      // --- REMOVE THESE FIELDS ---
      // availability: mentor.availability, // Old field
      // hours: mentor.hours,             // Old field
    };
    
    // 3. Send the corrected object
    res.status(200).json(publicProfile);

  } catch (err) {
    console.error('Error fetching mentor profile:', err); // Log the specific error
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Mentor not found (Invalid ID format)' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyAvailability = async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.user.id); // 'req.user.id' from 'protect'
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    res.status(200).json(mentor.availabilitySlots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- ADD THIS FUNCTION ---
// @desc    Update the logged-in mentor's availability
// @route   PATCH /api/mentors/my-availability
// @access  Private (Mentor only)
export const updateMyAvailability = async (req, res) => {
  try {
    // req.body should be an array of slots, e.g.:
    // [ { day: "Monday", startTime: "10:00", endTime: "11:00" } ]
    const { availabilitySlots } = req.body;

    if (!Array.isArray(availabilitySlots)) {
      return res.status(400).json({ message: 'Invalid data format.' });
    }

    const mentor = await Mentor.findByIdAndUpdate(
      req.user.id,
      { availabilitySlots: availabilitySlots },
      { new: true, runValidators: true }
    );

    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    res.status(200).json(mentor.availabilitySlots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};