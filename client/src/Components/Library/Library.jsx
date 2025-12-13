import React, {useState, useEffect} from "react";
import styles from "./Library.module.css";
import { toast as createToast, useToast as useSystemToast } from "../../ALERT/SystemToasts";

export function Library() {
  const [books, setBooks] = useState([]);
  const { push } = useSystemToast();

    useEffect(() => {
        // محاكاة جلب البيانات 
        const fetchBooks = async () => {
            try {
                // محاكاة تأخير
                await new Promise(res => setTimeout(res, 1000));
                const data = [  
                    { id: 1, title: "كتاب 1", author: "مؤلف 1" },
                    { id: 2, title: "كتاب 2", author: "مؤلف 2" },
                    { id: 3, title: "كتاب 3", author: "مؤلف 3" }
                ];
                setBooks(data);
                push({ message: "تم تحميل الكتب بنجاح", type: "success" });
            } catch (error) {
                console.error("خطأ في جلب الكتب:", error);
                push({ message: "فشل في تحميل الكتب", type: "error" });
            }
    };
    fetchBooks();
    }, [push]);
    return (
    <div className={styles.library}>
        <h1>مكتبة الكتب</h1>
        <ul>
        {books.map(book => (
            <li key={book.id}>
            <strong>{book.title}</strong> - {book.author}
            </li>
        ))}
        </ul>
    </div>
    );
};