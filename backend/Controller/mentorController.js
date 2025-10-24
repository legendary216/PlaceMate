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

    // 1. Check if mentor exists
    // 2. CRUCIAL: Check if mentor is 'approved'.
    if (!mentor || mentor.status !== 'approved') {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    // 3. Send ONLY public data.
    //    We explicitly build a new object to avoid leaking
    //    email, phone, idProof, or password.
    const publicProfile = {
      _id: mentor._id,
      fullName: mentor.fullName,
      jobTitle: mentor.jobTitle,
      company: mentor.company,
      experience: mentor.experience,
      qualification: mentor.qualification,
      expertise: mentor.expertise,
      availability: mentor.availability,
      hours: mentor.hours,
      profilePic: mentor.profilePic, // This is the full URL we built
    };
    
    res.status(200).json(publicProfile);
  } catch (err) {
    console.error(err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};