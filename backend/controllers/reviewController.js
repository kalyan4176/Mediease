import Review from '../models/Review.js';
import Doctor from '../models/Doctor.js';

// @desc    Add Doctor Review & Rating
// @route   POST /api/reviews/add
// @access  Private (Patient Only)
export const addReview = async (req, res) => {
  try {
    const { doctorId, rating, reviewText } = req.body;
    const patientId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5' });
    }

    // Verify doctor exists
    const doctorProfile = await Doctor.findOne({ userId: doctorId });
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor details not found' });
    }

    // Upsert review (update if exists, insert if new)
    const review = await Review.findOneAndUpdate(
      { patientId, doctorId },
      { rating, reviewText },
      { new: true, upsert: true }
    );

    // Calculate rating averages for doctor
    const reviews = await Review.find({ doctorId });
    const count = reviews.length;
    const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    const average = count > 0 ? Number((sum / count).toFixed(1)) : 0;

    // Save onto Doctor schema
    doctorProfile.ratings = { average, count };
    await doctorProfile.save();

    res.status(201).json({
      success: true,
      message: 'Review and rating submitted successfully',
      review,
      doctorRatings: doctorProfile.ratings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Doctor Reviews
// @route   GET /api/reviews/doctor/:id
// @access  Public
export const getDoctorReviews = async (req, res) => {
  try {
    const doctorId = req.params.id; // user ID of doctor

    const reviews = await Review.find({ doctorId })
      .populate('patientId', 'name profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
