import Connection from '../models/Connection.js';

// @desc    Student creates a new connection request
// @route   POST /api/connections/request
// @access  Private (User only)
export const createConnectionRequest = async (req, res) => {
  try {
    const studentId = req.user.id; // From 'protect' middleware
    const { mentorId } = req.body;

    if (!mentorId) {
      return res.status(400).json({ message: 'Mentor ID is required.' });
    }

    // Check if a request already exists
    const existingConnection = await Connection.findOne({
      student: studentId,
      mentor: mentorId,
    });

    if (existingConnection) {
      // You can decide if you want to return an error or just success
      // return res.status(400).json({ message: 'Connection request already sent.' });
      return res.status(200).json({ message: 'Connection request already exists or was sent.' });
    }

    await Connection.create({
      student: studentId,
      mentor: mentorId,
      // status defaults to 'pending'
    });

    res.status(201).json({ message: 'Connection request sent successfully.' });
  } catch (error) {
    console.error('Error creating connection request:', error);
    // Handle potential duplicate key error more gracefully if index is hit
    if (error.code === 11000) {
         return res.status(200).json({ message: 'Connection request already exists or was sent.' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Mentor gets their list of pending requests
// @route   GET /api/connections/my-requests
// @access  Private (Mentor only)
export const getMentorRequests = async (req, res) => {
  try {
    const mentorId = req.user.id; // From 'protect' middleware

    const requests = await Connection.find({
      mentor: mentorId,
      status: 'pending',
    }).populate('student', 'name email'); // Get student's name and email

    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching mentor requests:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Mentor accepts or rejects a request
// @route   PATCH /api/connections/respond/:id
// @access  Private (Mentor only)
export const respondToRequest = async (req, res) => {
  try {
    const mentorId = req.user.id; // From 'protect' middleware
    const { status } = req.body; // 'accepted' or 'rejected'
    const connectionId = req.params.id;

    if (!status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided.' });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    // Security check: Make sure this mentor owns this request
    if (connection.mentor.toString() !== mentorId) {
      return res.status(403).json({ message: 'Not authorized to update this request.' });
    }

    // Prevent updating already actioned requests if desired
    if (connection.status !== 'pending') {
       return res.status(400).json({ message: `Request has already been ${connection.status}.` });
    }


    connection.status = status;
    await connection.save();

    res.status(200).json({ message: `Request ${status}.` });
  } catch (error) {
     console.error('Error responding to request:', error);
     if (error.kind === 'ObjectId') {
         return res.status(404).json({ message: 'Request not found.' });
     }
    res.status(500).json({ message: 'Server Error' });
  }
};

// ... (existing functions: createConnectionRequest, getMentorRequests, respondToRequest)

// @desc    Student checks connection status with a specific mentor
// @route   GET /api/connections/status/:mentorId
// @access  Private (User only)
export const checkConnectionStatus = async (req, res) => {
  try {
    const studentId = req.user.id; // From 'protect' middleware
    const mentorId = req.params.mentorId;

    const connection = await Connection.findOne({
      student: studentId,
      mentor: mentorId,
    });

    if (!connection) {
      // No connection exists yet
      return res.status(200).json({ status: 'none' }); 
    }

    // Return the existing status ('pending', 'accepted', 'rejected')
    res.status(200).json({ status: connection.status });

  } catch (error) {
    console.error('Error checking connection status:', error);
    if (error.kind === 'ObjectId') {
         return res.status(404).json({ message: 'Mentor not found or invalid ID.' });
     }
    res.status(500).json({ message: 'Server Error' });
  }
};