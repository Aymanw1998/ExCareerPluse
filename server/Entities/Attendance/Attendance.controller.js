//server
const { logWithSource } = require("../../middleware/logger");
const Attendance = require("./Attendance.model")
const mongoose = require("mongoose");

function toDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value);

    if (typeof value === 'string') {
        const s = value.trim();

        // dd-mm-yyyy או dd/mm/yyyy
        let m = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
        if (m) {
        const [, dd, mm, yyyy] = m.map(Number);
        return new Date(Date.UTC(yyyy, mm - 1, dd)); // UTC כדי להימנע מהפתעות שעון קיץ
        }

        // yyyy-mm-dd (ISO קצר)
        m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (m) {
        const [, yyyy, mm, dd] = m.map(Number);
        return new Date(Date.UTC(yyyy, mm - 1, dd));
        }

        const ts = Date.parse(s);
        if (!Number.isNaN(ts)) return new Date(ts);
    }
    return null; // לא תקין
}

const toInt = (value, defaultValue = 0) => Number.isFinite(Number(value)) ? Number(value) : defaultValue;
const clamp = (num, min, max) => Math.min(min, Math.min(num, max));
function overlap(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
}

const buildData = (body) => {
    return {
        id: `${body.day}/${body.month}/${body.year} ${body.lesson}/${body.student}`,    
        lesson: body.lesson || null,
        student: body.student || null,
        status: body.status,
        day: body.day, // 0=Sun..6=Sat
        month: body.month, // 0..1439
        year: body.year, // 0..1439
    };    
};


const getAll = async(req, res) => {
    try {
        // תמיכה פילטרים אופציונליים: ?year=2025&month=8 (1..12)
        const { year, month } = req.params;
        let filter = {};
        if (year && month) {
            const y = Number(year), m = Number(month);
            if (!Number.isNaN(y) && !Number.isNaN(m)) {
                const start = new Date(y, m - 1, 1);
                const end   = new Date(y, m, 1);
                filter.created = { $gte: start, $lt: end };
            }
        }
        const attendances = await Attendance.find(filter).lean();
        return res.status(200).json({ ok: true, attendances });
    } catch (err) {
        logWithSource("err", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
}

const getOne = async (req, res) => {
    try {
        const { id } = req.params;

        const attendance = await Attendance.find({id:id}).lean();
        if (!attendance) return res.status(404).json({ ok: false, message: 'לא נמצא' });

        return res.status(200).json({ ok: true, attendance });
    } catch (err) {
        logWithSource("err", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
}

const getAllByLessonDayMonthYear = async (req, res) => {
    try {
        const { lesson_id, day, month, year } = req.params;
        const filter = {
            lesson: lesson_id,
            day:   Number(day),
            month: Number(month),
            year:  Number(year),
        };
        console.log("getAllByLessonDayMonthYear filter", filter);
        const attendances = await Attendance.find(filter).lean();
        return res.status(200).json({ ok: true, attendances });
    } catch (err) {
        logWithSource("err", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
}
const postOne = async(req, res) => {
    try {
        console.log("body".yellow, req.body);
        const model = buildData(req.body);
        console.log("model".green, model);
        if (!model?.name || !model?.lesson) {
            return res.status(400).json({ ok: false, message: 'missing required fields' });
        }

        // חיפוש חפיפה באותו יום/חודש/שנה ולאותו מאמן
        const sameDay = await Attendance.find({
        'day':   model.date.day,
        'month': model.date.month,
        'year':  model.date.year,
        lesson: model.lesson,
        }).lean();

        const conflict = sameDay.some(l => overlap(model.startMin, model.endMin, l.startMin, l.endMin));
        if (conflict) {
            return res.status(409).json({ ok:false, message:'יש חפיפה בשעות האלה' });
        }
        const doc = await Attendance.create({ ...model });
        return res.status(201).json({ ok:true, attendance: doc });
    } catch (err) {
        logWithSource("err", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
}

const postByLessonDayMonthYear = async (req, res) => {
    try {        
        console.log("postByLessonDayMonthYear body".yellow, req.body);
        const { lesson_id, day, month, year } = req.params;
        const list_attendance = req.body; // ציפייה למערך של אובייקטים עם student ו-status
        if (!Array.isArray(list_attendance) || list_attendance.length === 0) {
            return res.status(400).json({ ok: false, message: 'missing required fields' });
        }
        const createdAttendances = [];

        for (const item of list_attendance) {
            console.log("item".yellow, item);
            const model = buildData({
                lesson: lesson_id,
                student: item.student,
                status: item.status,
                day: Number(day),
                month: Number(month),
                year: Number(year),
            });
            console.log("model".green, model);
            const existing = await Attendance.findOne({
                lesson: model.lesson,
                student: model.student,
                day: model.day,
                month: model.month,
                year: model.year,
            });
            if (existing) {
                // עדכון קיים
                existing.status = model.status;
                existing.updatedAt = new Date();
                await existing.save();
                createdAttendances.push(existing);
                continue;
            }
            else {
                // יצירת חדש
                const doc = await Attendance.create({ ...model });
                createdAttendances.push(doc);
            }
        }
        return res.status(201).json({ ok:true, attendances: createdAttendances });
    } catch (err) {
        logWithSource("err", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
};
const putOne = async(req, res) => {
    try {
        const { id } = req.params;
        const current = await Attendance.find({id:id});
        if (!current) return res.status(404).json({ ok:false, message:'לא נמצא' });

        const next = buildData({ ...current.toObject(), ...req.body });

        const changedSlot =
            next.day      !== current.day      ||
            next.month    !== current.month    ||
            next.year     !== current.year     ||
            next.startMin !== current.startMin ||
            next.endMin   !== current.endMin   ||
            String(next.teacher) !== String(current.teacher) ||
            String(next.student) !== String(current.student) ||
            String(next.lesson) !== String(current.lesson)            

        if (changedSlot) {
            const sameDay = await Attendance.find({
                _id: { $ne: current._id },
                id: { $ne: current.id },
                'day':   next.day,
                'month': next.month,
                'year':  next.year,
                teacher: next.teacher,
                student: next.student,
                lesson:  next.lesson,
            }).lean();

            const conflict = sameDay.some(l =>
                overlap(next.date.startMin, next.date.endMin, l.date.startMin, l.date.endMin)
            );
            if (conflict) {
                return res.status(409).json({ ok:false, message:'יש חפיפה בשעות האלה' });
            }
        }
        current.status      = next.status;
        current.updatedAt   = new Date();

        if (current.list_trainees.length > current.max_trainees) {
            return res.status(400).json({ ok:false, code:'OVER_CAPACITY', message:'לא ניתן להוסיף עוד משתתפים' });
        }

        await current.save();
        return res.status(200).json({ ok:true, attendance: current });
    } catch (err) {
        return res.status(500).json({ ok:false, message: err.message });
    }
};
const deleteOne= async(req, res) => {
    try {
        console.log("params", req.params)
        const { id } = req.params;

        const deleted = await Attendance.findOneAndDelete({ id: id });
        console.log("deleted", deleted);
        if (!deleted) return res.status(404).json({ ok: false, message: 'לא נמצא' });

        return res.status(200).json({ ok: true, removed: true });
    } catch (err) {
        logWithSource("err", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
}

// העתקת שיעורים מחודש אחד לאחר
function isInt(n){ return Number.isInteger(Number(n)); }

// שדות זהים נחשבים "כפילות" בחודש היעד
// אפשר לשנות את הקריטריון אם תרצה (למשל גם name)
function sameSlot(a, b){
    return (
        Number(a?.date?.day) === Number(b?.date?.day) &&
        Number(a?.date?.startMin ?? a?.date?.hh*60) === Number(b?.date?.startMin ?? b?.date?.hh*60) &&
        String(a?.trainer||'') === String(b?.trainer||'')
    );
    }


const deletePerMonth = async(req, res) => {
    try {
        const { month, year } = req.params;
        console.log("deletePerMonth", month, year);
        if (!isInt(month) || !isInt(year)) {
            return res.status(400).json({ ok:false, message:'invalid month/year' });
        }
        const result = await Attendance.deleteMany({ 'month': month, 'year': year });
        return res.status(200).json({ ok:true, deletedCount: result.deletedCount });
    } catch (err) {
        return res.status(500).json({ ok:false, message: err.message });
    }
};

module.exports = {getAll, getOne, getAllByLessonDayMonthYear, postOne, postByLessonDayMonthYear, putOne, deleteOne, deletePerMonth}