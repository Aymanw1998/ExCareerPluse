import { ask } from "../../../Components/Provides/confirmBus";
import api,{setAuthToken } from "../api";

export const getAll = async() => {
    try{
        const {data, status} = await api.get('/attendance');
        if(![200,201].includes(status) || !data.ok) throw new Error ('לא קיים שיעורים במערכת');
        return {ok: true, attendances: data.lessons || data.schema || []};
    } catch(err) {    
        return {ok: false, message: err.response.data.message || err.message || 'נוצר שגיאה בתהליך'};
    }
}

export const getOne = async(_id) => {
    try{
        const {data, status} = await api.get('/attendance/' + _id);
        if(![200,201].includes(status) || !data.ok) throw new Error ('השיעור לא קיים');
        return {ok: true, attendance: data.lesson || data.schema};
    } catch(err) {    
        return {ok: false, message: err.response.data.message || err.message || 'נוצר שגיאה בתהליך'};
    }
}

export const getAllByLessonDayMonthYear = async(lessonId, day, month, year) => {
    try{
        const {data, status} = await api.get(`/attendance/${lessonId}/${day}/${month}/${year}`);
        if(![200,201].includes(status) || !data.ok) throw new Error ('לא נמצאו נוכחות לשיעור זה בתאריך זה');
        return {ok: true, attendances: data.attendances || data.schema || []};
    } catch(err) {
        return {ok: false, message: err.response.data.message || err.message || 'נוצר שגיאה בתהליך'};
    }
}

/**
 * 
 * @param {*} lessonId 
 * @param {*} day 
 * @param {*} month 
 * @param {*} year 
 * @param {*} payload [{student: studentId, status: boolean}, ...];
 * @param {*} param5 
 * @returns 
 */
export const createAttendanceByList = async(lessonId, day, month, year, payload, {confirm = true} = {}) => {
    try{
        if(confirm) {
            const ok = await ask("create");
            if(!ok) {
                    return null;
            }
        }
        console.log("create attendance", payload);
        const res = await api.post(`/attendance/ByList/${lessonId}/${day}/${month}/${year}`, payload);
        console.log(res);
        if(![200,201].includes(res.status) || !res.data.ok) throw new Error (data?.message || 'הנוכחות לא נוצרה');
        return {ok: true, attendance: res.data.lesson || res.data.schema};
    } catch(err) {
        console.error(err);
        return {ok: false, message: err.response.data.message || 'נוצר שגיאה בתהליך'};
    }
}
export const updateLesson = async(_id, payload, {confirm = true} = {}) => {
    try{
        if(confirm) {
            const ok = await ask('change');
            if(!ok) {
                    return null;
            }
        }
        const {data, status} = await api.put(`/attendance/${encodeURIComponent(_id)}`, payload);
        console.log("update attendance", status, data);
        if(![200,201].includes(status) || !data.ok) throw new Error (data?.message || 'השיעור לא עודכן');
        return {ok: true, attendance: data.lesson || data.schema};
    } catch(err) {
        return {ok: false, message: err.response.data.message || err.message || 'נוצר שגיאה בתהליך'};
    }
}

export const deleteLesson = async(_id, {confirm = true} = {}) => {
    try{
        if(confirm) {
            const ok = await ask("delete");
            if(!ok) {
                    return null;
            }
        }
        const {data, status} = await api.delete(`/attendance/${encodeURIComponent(_id)}`);
        console.log("delete attendance", status, data);
        if(![200,201].includes(status) || !data.ok) throw new Error (data?.message || 'השיעור לא נמחק');
        return {ok: true, attendance: null};
    } catch(err) {
        return {ok: false, message: err.response.data.message || err.message || 'נוצר שגיאה בתהליך'};
    }
}

// ניהול רשימות משתתפים (כפי שהיה)
export async function addToList(lessonId, traineeIds = []) {
    try{
        const { data, status } = await api.post(`/attendance/addToList/${encodeURIComponent(lessonId)}`, {
        list_trainees: traineeIds,
        });
        if (![200,201].includes(status)) throw new Error(data?.message || 'הוסף מתאמן לשיעור נכשלה');
        return {ok: true, attendances: data.lessons || data.schema};
    } catch(err) {
        return {ok: false, message: err.response.data.message || err.message || 'נוצר שגיאה בתהליך'};
    }
}

export async function removeFromList(lessonId, traineeIds = []) {
    try{
        const { data, status } = await api.post('/attendance/removeFromList', {
            id: attendanceId,
            list_trainees: traineeIds,
        });
        if (![200,201].includes(status)) throw new Error(data?.message || 'הסרת מתאמן משיעור נכשלה');
        return {ok: true, attendances: data.lessons || data.schema};
    } catch(err) {
        return {ok: false, message: err.response.data.message || err.message || 'נוצר שגיאה בתהליך'};
    }
}

export async function copyLessonsMonth(params = {}) {
    try {
        const res = await api.post(`/attendance/copy-month`);
        console.log("copyLessonsMonth", res);
        const {data} = await res;
        return { status: res.status, ok: true, ...data };
    } catch (err) {
        return { status: err.status, ok:false, message: err.message || 'bad response' };
    }
}
export async function deleteLessonsPerMonth(month, year) {
    try {
        const res = await api.delete(`/attendance/delete-perMonth/${month}/${year}`);
        console.log("deleteLessonsPerMonth", res);
        const {data} = await res;
        return { status: res.status, ok: true, ...data };
    } catch (err) {
        return { status: err.status, ok:false, message: err.message || 'bad response' };
    }
}
