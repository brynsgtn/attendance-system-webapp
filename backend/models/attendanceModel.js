import mongoose from "mongoose";


const attendanceSchema = new mongoose.Schema({
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    time_in: {
      type: Date,
      default:null,
    },
    time_out: {
      type: Date,
      default:null,
    },
    total_hours: {
      type: Number, 
      default: 0,
    },
    pending_time_in:{
      type: Date,
      default: null,
    },
    pending_time_out:{
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['completed', 'incomplete', 'pending', 'approved', 'rejected'],
      default: 'incomplete',
    },
    requested_edit: {
      type: Boolean,
      default: false,
    },
    request_reason: {
      type: String,
      default: null,
    },
    rejection_reason: {
      type: String,
      default: null,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  }, { timestamps: true });

  export const Attendance = mongoose.model('Attendance', attendanceSchema);
  