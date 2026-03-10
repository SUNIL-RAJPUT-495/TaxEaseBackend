import Inquiry from '../modules/inquiryModel.js';

// 1. Nayi inquiry create karna (Contact Us form se)
export const createInquiry = async (req, res) => {
  try {
    const { name, email, numbers, message } = req.body;

    const newInquiry = new Inquiry({
      name,
      email,
      numbers,
      message
    });

    await newInquiry.save();

    res.status(201).json({
      success: true,
      message: 'Your inquiry has been submitted successfully!',
      data: newInquiry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting inquiry',
      error: error.message
    });
  }
};

export const getAllInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: inquiries.length,
      data: inquiries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inquiries',
      error: error.message
    });
  }
};

export const deleteInquiry = async (req, res) => {
  try {
    const inquiryId = req.params.id;
    const deletedInquiry = await Inquiry.findByIdAndDelete(inquiryId);

    if (!deletedInquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Inquiry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting inquiry',
      error: error.message
    });
  }
};