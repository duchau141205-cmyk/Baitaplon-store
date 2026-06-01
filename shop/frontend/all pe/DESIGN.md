# Mô Hình Store - Hệ Thống Thiết Kế (Design System)

Tài liệu này đóng vai trò làm quy chuẩn thiết kế (design system guidelines) cho toàn bộ giao diện của cửa hàng Mô Hình Store, được cấu hình để các AI coding assistant (như Cursor, Claude, Gemini) tuân thủ nhất quán.

---

## 1. Visual Theme & Atmosphere
- **Phong cách:** Sang trọng, tối giản, mang hơi hướng công nghệ cao (hi-tech) nhưng tinh tế, phù hợp với thế giới mô hình cao cấp (Gundam, Siêu xe, Superhero).
- **Chủ đề chủ đạo:** Obsidian Dark Theme (Chủ đề tối).
- **Nguyên tắc cốt lõi:**
  - Tránh các hiệu ứng lòe loẹt của AI (AI slop) như các đốm sáng bóng bẩy (glows) màu mè hoặc các dải gradient dày trên chữ.
  - Sử dụng khoảng trắng rộng rãi để giao diện "thở".
  - Sử dụng các nét viền mảnh và đổ bóng mịn để tạo chiều sâu thay vì các viền màu nổi bật.

---

## 2. Color Palette & Roles
Bảng màu sử dụng hệ màu cụ thể để tránh lỗi độ tương phản thấp (WCAG AA). Không sử dụng màu đen tuyệt đối (#000000) làm nền chính.

```yaml
tokens:
  colors:
    background:
      primary: "#090c10"      # Màu nền obsidian tối, sang trọng và không gây mỏi mắt
      secondary: "#151b23"    # Nền của thẻ (card), thanh điều hướng, form
      overlay: "rgba(9, 12, 16, 0.8)"
    brand:
      primary: "#00d4ff"      # Màu xanh neon làm điểm nhấn chính (các nút CTA, icon active)
      secondary: "#7928ca"    # Màu tím sâu hỗ trợ cho điểm nhấn phụ
      accent: "#ff0080"       # Màu hồng đậm cho nhãn giảm giá, phần thưởng (dùng hạn chế)
    text:
      primary: "#f0f3f6"      # Chữ trắng sáng cho nội dung chính (đảm bảo độ tương phản > 4.5:1)
      muted: "#8b949e"        # Chữ xám cho thông tin phụ, mô tả (đảm bảo tương phản > 3:1)
      link: "#00d4ff"
    status:
      success: "#2ea043"      # Màu xanh lá chuẩn cho thông báo thành công hoặc "Còn hàng"
      danger: "#f85149"       # Màu đỏ cho lỗi hoặc "Hết hàng"
      warning: "#d29922"      # Màu vàng cho cảnh báo hoặc chờ duyệt
```

---

## 3. Typography Rules
- **Display/Headings (Tiêu đề):** Sử dụng font **Outfit** (hoặc Sans-serif hệ thống làm fallback) để tạo nét sắc sảo, năng động của mô hình.
- **Body Text (Văn bản thường):** Sử dụng **Hệ thống font Sans-serif mặc định** (`system-ui, -apple-system, sans-serif`) thay vì ép buộc dùng Inter/Roboto để tăng tốc độ tải trang và tránh sự rập khuôn.
- **Tỉ lệ font chữ:**
  - `h1`: 2.5rem (40px) | Line-height: 1.2 | Font-weight: 800
  - `h2`: 1.8rem (28.8px) | Line-height: 1.3 | Font-weight: 700
  - `h3`: 1.4rem (22.4px) | Line-height: 1.4 | Font-weight: 600
  - `h4`/`body-large`: 1.1rem (17.6px) | Font-weight: 600
  - `body`: 1rem (16px) hoặc tối thiểu 0.875rem (14px) cho thông tin nhỏ | Line-height: 1.6
  - *Không bao giờ sử dụng kích thước chữ dưới 12px cho văn bản thường.*

---

## 4. Component Stylings
- **Buttons (Nút bấm):**
  - Nút Primary: Nền `brand.primary` (#00d4ff), chữ tối `#090c10`, bo góc 6px. Không có bóng sáng lòe loẹt.
  - Nút Outline: Viền mảnh `1px solid rgba(255,255,255,0.15)`, chữ trắng, nền trong suốt. Khi hover chuyển sang nền `rgba(255,255,255,0.05)`.
- **Cards (Thẻ sản phẩm/tin tức):**
  - Sử dụng nền `background.secondary` (#151b23) với viền mảnh 1px `rgba(255, 255, 255, 0.08)`.
  - Bo góc tối đa 8px.
  - *Quy tắc:* Tuyệt đối không kết hợp viền màu dày phía trên (border-top) với bo góc lớn (border-radius > 8px) vì sẽ gây xung đột thị giác.
- **Forms & Inputs (Biểu mẫu):**
  - Nền input tối màu `rgba(255, 255, 255, 0.03)`, viền `rgba(255, 255, 255, 0.1)`.
  - Khi focus: Viền đổi sang màu `brand.primary` và không có bóng mờ (box-shadow) lan tỏa rộng.

---

## 5. Layout & Spacing
- Sử dụng lưới 8px để căn lề và khoảng cách (padding, margin, gap: 8px, 16px, 24px, 32px, 48px).
- Bố cục trang phải nhất quán về độ rộng tối đa (`max-width: 1200px`) và căn lề 2 bên (`padding: 0 20px`).

---

## 6. Shapes & Radius
- Bo góc nhỏ cho nút bấm và trường nhập liệu: `4px` - `6px`.
- Bo góc trung bình cho thẻ sản phẩm, modal: `8px`.
- Không sử dụng bo góc quá lớn (> 12px) cho các khung vuông trừ khi đó là các vòng tròn hình đại diện hoặc thẻ dạng tag.

---

## 7. Do's and Don'ts (Quy tắc bắt buộc)
- **DO (Nên làm):**
  - Sử dụng các màu chữ có tương phản đạt chuẩn WCAG AA (> 4.5:1).
  - Sử dụng cấu trúc thẻ HTML chuẩn (Heading h1 -> h2 -> h3, không bỏ qua cấp bậc).
  - Giữ khoảng cách đều đặn và hợp lý giữa các nhóm thông tin.
- **DON'T (Tránh tuyệt đối):**
  - Không viết hoa toàn bộ khối văn bản dài (all-caps body text). Chỉ dùng chữ in hoa cho nhãn (labels) ngắn gọn dưới 5 từ.
  - Không sử dụng chữ gradient (gradient text) trên tiêu đề hoặc các chỉ số. Hãy sử dụng màu phẳng (solid colors).
  - Không tạo hiệu ứng đổ bóng phát sáng màu sắc quá nổi bật (colored glows) trên nền tối.
  - Không hiệu ứng chuyển động (transition) các thuộc tính hình học gây giật lag trang như `width`, `height`, `padding`, `margin`. Hãy dùng `transform` và `opacity`.
