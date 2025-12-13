const mongoose = require('mongoose');
const Lesson = require('../Lesson/Lesson.model');

// Define the Meeting Schema
const schema = new mongoose.Schema({
    id: { type: String, required: true },    
    lesson: {
        type: mongoose.Schema.Types.ObjectId, // lesson
        ref: 'Lessons',
    },
    student: {
        type: mongoose.Schema.Types.ObjectId, //students
        ref: 'Students',
    },
    status: { type: Boolean, default: false, required: true },
    day: { type: Number, required: true, min: 1, max: 31 }, // 0=Sun..6=Sat
    month: { type: Number, required: true, min: 1, max: 12 }, // 0..23
    year: {type: Number, required: true},

},{timeseries: true});

// Create the Meeting model
const Attendance = mongoose.model('Attendances', schema);

module.exports = Attendance;
