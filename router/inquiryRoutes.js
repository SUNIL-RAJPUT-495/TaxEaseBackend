import express from 'express';
import {
  createInquiry,
  getAllInquiries,
  deleteInquiry
} from '../controller/inquiryController.js';

const inquiryrouter = express.Router();

inquiryrouter.post('/create', createInquiry);
inquiryrouter.get('/all', getAllInquiries);
inquiryrouter.delete('/delete/:id', deleteInquiry);

export default inquiryrouter;