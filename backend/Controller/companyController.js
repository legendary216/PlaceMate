import Company from '../models/Company.js';
import Placement from '../models/Placement.js';
import mongoose from 'mongoose'; // Needed for aggregation pipeline ObjectId conversion
import User from '../models/User.js';
// @desc    Get placement statistics for a specific year (Company Name + Count)
// @route   GET /api/placements/stats/:year
// @access  Public
export const getPlacementStatsByYear = async (req, res) => {
    try {
        const { year } = req.params;

        if (!year) {
            return res.status(400).json({ message: 'Year parameter is required.' });
        }

        // Use MongoDB Aggregation Pipeline
        const stats = await Placement.aggregate([
            // 1. Match placements for the given year
            { $match: { year: year } },
            // 2. Group by company ID and count the placements
            {
                $group: {
                    _id: '$company', // Group by the company ObjectId
                    count: { $sum: 1 } // Count documents in each group
                }
            },
            // 3. Lookup the company details using the grouped _id
            {
                $lookup: {
                    from: 'companies', // Collection name
                    localField: '_id',
                    foreignField: '_id',
                    as: 'companyDetails'
                }
            },
            // 4. Deconstruct the companyDetails array
            {
                $unwind: '$companyDetails'
            },
            // 5. Project the desired final format
            {
                $project: {
                    _id: 0,
                    companyId: '$_id',
                    companyName: '$companyDetails.name',
                    count: '$count'
                }
            },
            // 6. Sort by count descending (optional)
            { $sort: { count: -1 } }
        ]);

        res.status(200).json(stats);

    } catch (error) {
        console.error('Error fetching placement stats:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Get list of companies that visited (had placements) in a specific year
// @route   GET /api/companies/visited/:year
// @access  Public
export const getCompaniesByYear = async (req, res) => {
    try {
        const { year } = req.params;

        if (!year) {
            return res.status(400).json({ message: 'Year parameter is required.' });
        }

        // 1. Find distinct company IDs from placements in the given year
        const distinctCompanyIds = await Placement.distinct('company', { year: year });

        // 2. Find company details, including new fields
        const companies = await Company.find({
            '_id': { $in: distinctCompanyIds }
        }).select('name description website logoUrl rolesOffered location'); // Select fields including new ones

        res.status(200).json(companies);

    } catch (error) {
        console.error('Error fetching companies by year:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- Admin CRUD functions will be added here later ---

export const addCompany = async (req, res) => {
    try {
        const { name, description, website, logoUrl, rolesOffered, location } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Company name is required.' });
        }

        const companyExists = await Company.findOne({ name });
        if (companyExists) {
            return res.status(400).json({ message: 'Company with this name already exists.' });
        }

        const newCompany = await Company.create({
            name,
            description,
            website,
            logoUrl,
            rolesOffered: rolesOffered || [], // Ensure it's an array
            location,
            createdBy: req.user.id // Logged-in admin ID
        });

        res.status(201).json({ message: 'Company added successfully', company: newCompany });

    } catch (error) {
        console.error('Error adding company:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Admin updates a company
// @route   PUT /api/companies/:id
// @access  Private (Admin only)
export const updateCompany = async (req, res) => {
    try {
        const { name, description, website, logoUrl, rolesOffered, location } = req.body;
        const companyId = req.params.id;

        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ message: 'Company not found.' });
        }

        // Update fields if provided
        if (name) company.name = name;
        if (description) company.description = description;
        if (website) company.website = website;
        if (logoUrl) company.logoUrl = logoUrl;
        if (rolesOffered) company.rolesOffered = rolesOffered;
        if (location) company.location = location;

        const updatedCompany = await company.save();
        res.status(200).json({ message: 'Company updated successfully', company: updatedCompany });

    } catch (error) {
        console.error('Error updating company:', error);
         if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
         if (error.kind === 'ObjectId') { return res.status(404).json({ message: 'Company not found.' });}
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Admin deletes a company (and associated placements)
// @route   DELETE /api/companies/:id
// @access  Private (Admin only)
export const deleteCompany = async (req, res) => {
    try {
        const companyId = req.params.id;
        const company = await Company.findById(companyId);

        if (!company) {
            return res.status(404).json({ message: 'Company not found.' });
        }

        // IMPORTANT: Also delete all placement records associated with this company
        await Placement.deleteMany({ company: companyId });

        await company.deleteOne(); // Mongoose 6+ uses deleteOne()

        res.status(200).json({ message: 'Company and associated placements deleted successfully.' });

    } catch (error) {
        console.error('Error deleting company:', error);
         if (error.kind === 'ObjectId') { return res.status(404).json({ message: 'Company not found.' });}
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Admin adds a new placement record
// @route   POST /api/placements
// @access  Private (Admin only)
export const addPlacement = async (req, res) => {
    try {
        // Assuming student is identified by email for simplicity here
        const { studentEmail, companyName, year, packageLPA } = req.body;

        if (!studentEmail || !companyName || !year) {
            return res.status(400).json({ message: 'Student email, company name, and year are required.' });
        }

        // Find student and company by their identifiers
        const student = await User.findOne({ email: studentEmail });
        const company = await Company.findOne({ name: companyName });

        if (!student) {
            return res.status(404).json({ message: `Student with email ${studentEmail} not found.` });
        }
        if (!company) {
             return res.status(404).json({ message: `Company named '${companyName}' not found. Please add the company first.` });
        }

        const newPlacement = await Placement.create({
            studentId: student._id, // Use the found student's ID
            company: company._id,   // Use the found company's ID
            year,
            packageLPA: packageLPA ? Number(packageLPA) : undefined,
            createdBy: req.user.id
        });

        res.status(201).json({ message: 'Placement record added successfully', placement: newPlacement });

    } catch (error) {
        console.error('Error adding placement:', error);
         if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Admin deletes a placement record
// @route   DELETE /api/placements/:id
// @access  Private (Admin only)
export const deletePlacement = async (req, res) => {
     try {
        const placementId = req.params.id;
        const placement = await Placement.findById(placementId);

        if (!placement) {
            return res.status(404).json({ message: 'Placement record not found.' });
        }

        await placement.deleteOne();
        res.status(200).json({ message: 'Placement record deleted successfully.' });

    } catch (error) {
        console.error('Error deleting placement:', error);
        if (error.kind === 'ObjectId') { return res.status(404).json({ message: 'Placement record not found.' });}
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Admin gets all placements for a year (potentially with student names)
// @route   GET /api/placements/admin/:year
// @access  Private (Admin only)
export const getPlacementsAdmin = async (req, res) => {
    try {
        const { year } = req.params;
        const placements = await Placement.find({ year })
            .populate('company', 'name')
            .populate('studentId', 'name email'); // Populate student details

        res.status(200).json(placements);
    } catch (error) {
         console.error('Error fetching admin placements:', error);
        res.status(500).json({ message: 'Server Error' });
    }
}

// @desc    Admin updates a placement record
// @route   PUT /api/placements/:id
// @access  Private (Admin only)
export const updatePlacement = async (req, res) => {
     try {
        const placementId = req.params.id;
        const { studentEmail, companyName, year, packageLPA } = req.body; // Allow updating fields

        const placement = await Placement.findById(placementId);
        if (!placement) {
            return res.status(404).json({ message: 'Placement record not found.' });
        }

        // Find updated student/company if provided
        if (studentEmail) {
            const student = await User.findOne({ email: studentEmail });
            if (!student) return res.status(404).json({ message: `Student with email ${studentEmail} not found.` });
            placement.studentId = student._id;
        }
         if (companyName) {
            const company = await Company.findOne({ name: companyName });
            if (!company) return res.status(404).json({ message: `Company named '${companyName}' not found.` });
            placement.company = company._id;
        }

        // Update other fields
        if (year) placement.year = year;
        if (packageLPA !== undefined) placement.packageLPA = Number(packageLPA); // Allow setting package to 0

        const updatedPlacement = await placement.save();
        res.status(200).json({ message: 'Placement record updated', placement: updatedPlacement });

    } catch (error) {
        console.error('Error updating placement:', error);
         if (error.name === 'ValidationError') { /* ... validation error handling ... */ }
         if (error.kind === 'ObjectId') { return res.status(404).json({ message: 'Placement record not found.' });}
        res.status(500).json({ message: 'Server Error' });
    }
};