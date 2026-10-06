# Nguyen Vu Xuan Mai — UI/UX Designer Portfolio

> **Tài liệu dự án & Đặc tả kỹ thuật dành cho Nhà phát triển và AI Agent.**  
> Kiến trúc Portfolio chuẩn Quốc tế: Phong cách Minimalist cao cấp, Tương phản sắc nét, Dark/Light Mode, Hệ thống Bento Grid và Dữ liệu chi tiết từ CV.

---

## 📌 1. Tổng Quan Dự Án (Project Overview)

Website portfolio cá nhân của **Nguyen Vu Xuan Mai** — **UI/UX Designer**, sinh viên năm cuối ngành Mạng máy tính & Truyền thông dữ liệu tại Trường Đại học Công nghệ Thông tin (UIT - ĐHQG TP.HCM).

- **Phong cách Thiết kế:** **International High-End Minimalist** (Phong cách của các Senior Product Designer tại Apple, Linear, Vercel, Readcv).
  - Tối giản, thanh lịch, tinh tế, loại bỏ hoàn toàn các màu mè rườm rà hay nền xanh chói mắt.
  - Tương phản sắc nét, phân cấp thị giác mạnh mẽ, khoảng trắng chuẩn mực (editorial white-space).
  - Điểm xuyết tinh xảo bằng đèn tín hiệu xanh ngọc (`emerald-500`) báo hiệu trạng thái sẵn sàng nhận việc.
- **Tính năng cao cấp:** 
  - **Dark / Light Mode:** Nền Off-White (`#fafafa`) siêu sạch ở Light Mode & Onyx Obsidian (`#09090b`) sang trọng ở Dark Mode.
  - **Quick Copy Email:** Nút 1-click copy email trực tiếp kèm toast phản hồi.
  - **Interactive Filter Tabs:** Lọc dự án mượt mà (`All`, `UI/UX Design`, `Web Development`).
  - **Live Prototype Launchers:** Mở trực tiếp Figma Smart Animate & Framer Live Prototype.
- **Core Tech Stack:**
  - **Bundler:** Vite 6 (MPA Rollup input: `index.html` và `project.html`).
  - **Styling:** Custom CSS Variables.
  - **Typography:** Google Fonts (`Plus Jakarta Sans`, `Outfit`).
  - **Icons:** Lucide Icons.

---

## 🎨 2. Hệ Thống Màu Sắc & Design Tokens (Monochrome Minimalist)

| Mode | Background | Surface / Cards | Primary Text | Secondary Text | Subtle Accent |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Light Mode** | `#fafafa` (Sạch sẽ, không chói) | `#ffffff` (Viền `zinc-200/90`, shadow mịn) | `#09090b` (Zinc-900) | `#71717a` (Zinc-500) | `#10b981` (Emerald dot) |
| **Dark Mode** | `#09090b` (Obsidian Onyx) | `#121215` (Viền `zinc-800/90`, hover sáng) | `#f4f4f5` (Zinc-100) | `#a1a1aa` (Zinc-400) | `#34d399` (Emerald mint) |

---

## 📊 3. Danh Mục Dự Án (Projects Catalog)

1. **Smart Station — EV Smart Charging App** (Thực tập doanh nghiệp • UI/UX Mobile App • Thiết kế giao diện dọc tối ưu • Figma & Canva • Redesign & Core Flows).
2. **Soundly — Music Streaming Website** (UI Designer • Dark Mode Design System, Glassmorphism, Smart Animate, Figma Variants).
3. **Meowlish — English Learning Platform** (UI/UX Designer • Team of 5 • User Research, Component Library, Responsive Breakpoints, Framer Prototype).
4. **Watermelon Music Festival — Event Platform** (Web Developer & UI • One-page layout, Interactive ticket booking, Maps integration).
5. **Watermelon Shop — E-Commerce Platform** (Web Developer & UI • Catalog filtering, Cart drawer, Checkout flow).

---

## 🚀 4. Hướng Dẫn Vận Hành

```bash
# Cài đặt dependencies
npm install

# Chạy máy chủ dev (Port 3000)
npm run dev

# Kiểm tra TypeScript
npm run lint

# Đóng gói Production
npm run build
```
