import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true
  },
  numbers: {
    type: String,
    required: false
  },
  message: {
    type: String,
    required: [true, 'Message is required']
  }
}, { timestamps: true }); 

export default mongoose.model('Inquiry', inquirySchema);