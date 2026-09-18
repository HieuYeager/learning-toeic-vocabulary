# TOEIC Vocabulary Learning

Web nhỏ học từ vựng TOEIC: flashcard, quiz trắc nghiệm và theo dõi tiến trình học.

**Version:** beta 1.0

## Giới thiệu

Ứng dụng web thuần HTML/CSS/JS giúp luyện từ vựng TOEIC hiệu quả, với các chế độ học:

- **Flashcard**: lật thẻ để xem nghĩa, tự đánh giá Đã nhớ / Chưa nhớ, xem lại từ đã nhớ
- **Quiz**: trắc nghiệm 2 chiều (Anh ↔ Việt), chọn nghĩa đúng, tổng kết từ sai cuối bài
- **Theo dõi tiến trình**: mỗi từ có 3 trạng thái (mới / đang học / đã nhớ), hiển thị thanh tiến độ theo bộ từ vựng

## Nguồn từ vựng

- [Study4](https://study4.com) — bộ từ vựng TOEIC (22+ bộ, ~1.257 từ kèm phiên âm, nghĩa Tiếng Việt và câu ví dụ)

## Tính năng chính

| Tính năng | Mô tả |
|---|---|
| Đăng ký / Đăng nhập | Email + mật khẩu (Supabase Auth), xác nhận email |
| Flashcard | Lật thẻ, badge trạng thái từ (🆕 Từ mới / 🔁 Đang học), chế độ xem lại từ đã nhớ |
| Quiz | Trắc nghiệm 2 chiều EN↔VI, tối thiểu 10 từ đã học, hiển thị đáp án + tổng kết từ sai |
| Tiến trình | 3 trạng thái mới/đang học/đã nhớ, 2 thanh tiến độ (mastered + learning) mỗi bộ |

## Công nghệ

- HTML / CSS / JavaScript thuần (không framework)
- [Supabase](https://supabase.com) — Auth (email + password) và cơ sở dữ liệu Postgres

## Cấu trúc thư mục

```
css/
  style.css         -- Styles chung
js/
  supabase.js       -- Config Supabase + API + đăng ký/login/logout
  auth.js           -- Xử lý form đăng nhập / đăng ký
  app.js            -- Logic chính, routing
  flashcard.js      -- Chế độ flashcard
  quiz.js           -- Chế độ quiz
  progress.js       -- Quản lý tiến trình học
index.html          -- Trang chủ (danh sách bộ từ vựng)
login.html          -- Trang đăng nhập
signup.html         -- Trang đăng ký
```

## Version

- **beta 1.0** — bản đầu tiên