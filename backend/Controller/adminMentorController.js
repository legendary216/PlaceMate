import Mentor from '../models/Mentors.js'; // Adjust path, add .js extension

// @desc    Get all pending mentor applications
// @route   GET /api/admin/mentors/pending
// @access  Private (Admin only)
export const getPendingMentors = async (req, res) => {
  try {
    // Find mentors who are 'pending'
    const pendingMentors = await Mentor.find({ status: 'pending' });
    
    res.status(200).json(pendingMentors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Approve a mentor application
// @route   PATCH /api/admin/mentors/approve/:id
// @access  Private (Admin only)
export const approveMentor = async (req, res) => {
  try {
    const mentor = await Mentor.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' }, // Set status to 'approved'
      { new: true, runValidators: true }
    );

    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    
    res.status(200).json({ message: 'Mentor approved successfully', mentor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Reject a mentor application
// @route   PATCH /api/admin/mentors/reject/:id
// @access  Private (Admin only)
export const rejectMentor = async (req, res) => {
  try {
    const mentor = await Mentor.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' }, // Set status to 'rejected'
      { new: true, runValidators: true }
    );

    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    res.status(200).json({ message: 'Mentor rejected successfully', mentor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};