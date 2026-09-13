# 🧮 RGB → YUV → DCT 8×8 → Quantization

> Công cụ học tập mô phỏng chuỗi xử lý ảnh/video theo tài liệu môn học.

## ✨ Pipeline hiện tại

```text
RGB 8×8
  ↓
YUV 8×8
  ↓
DCT 2D cho từng thành phần Y, U, V
  ↓
Quantization
  ↓
Ma trận hệ số DCT đã lượng tử hóa
```

## 1. RGB → YUV

Sử dụng các phương trình trong tài liệu môn học:

```text
Y = 0.299R + 0.587G + 0.114B
U = (B - Y) / 2.03
V = (R - Y) / 1.14
```

Mỗi khối đầu vào gồm 8×8 pixel RGB, với R, G, B trong khoảng 0–255.

## 2. DCT 8×8

DCT 2D được tính riêng trên ba ma trận Y, U và V. DCT được thực hiện theo tính chất tách được: biến đổi theo hàng rồi theo cột.

Ứng dụng giữ độ chính xác số thực trong quá trình tính toán và chỉ định dạng kết quả DCT ở 2 chữ số thập phân khi hiển thị.

## 3. Quantization

Tài liệu môn học trình bày lượng tử hóa DCT theo bước lượng tử `Q` và ma trận trọng số `W(i,j)`:

```text
Ĉ(i,j) = round(C(i,j) / (Q × W(i,j)))
```

Ma trận trọng số đang dùng là ma trận 8×8 trong Figure 4.20 của tài liệu:

```text
 8 16 19 22 26 27 29 34
16 16 22 24 27 29 34 37
19 22 26 27 29 34 34 38
22 22 26 27 29 34 37 40
22 26 27 29 32 35 40 48
26 27 29 32 35 40 48 58
26 27 29 34 38 46 56 69
27 29 35 38 46 56 69 83
```

Giá trị mặc định của bước lượng tử là `Q = 8`, phù hợp với ví dụ lượng tử hóa trong tài liệu. Có thể thay đổi Q trên giao diện.

## 4. Chức năng giao diện

- Nhập 3 khối R, G, B kích thước 8×8.
- Tính và hiển thị Y, U, V.
- Tính và hiển thị DCT(Y), DCT(U), DCT(V).
- Tính và hiển thị Quantized Y, U, V.
- Hiển thị ma trận trọng số đang sử dụng.
- Giữ lại máy tính DCT 1D/2D tổng quát của phiên bản trước.

## 📁 Cấu trúc

```text
dct-calculator/
├── app.py          # Python / backend hiện có
├── index.html      # Giao diện RGB → YUV → DCT → Quantization
├── script.js       # Logic tính toán
├── style.css       # Giao diện
└── README.md
```

## 📚 Cơ sở tài liệu

Phần RGB→YUV, DCT 8×8 và ma trận trọng số được bám theo tài liệu môn học đã cung cấp. Tài liệu môn học mô tả DCT theo các khối 8×8 và lượng tử hóa các hệ số DCT bằng bước lượng tử kết hợp với weighting matrix.

Đối chiếu chuẩn kỹ thuật: ITU-T T.81 (JPEG-1) là Recommendation về nén và mã hóa ảnh liên tục; ITU-T J.81 cũng mô tả DCT trên các khối 8×8 trong truyền hình số. citeturn0search0turn0search3

## ⚠️ Phạm vi hiện tại

Repo mới dừng ở:

**RGB → YUV → DCT 8×8 → Quantization**

Chưa triển khai các bước tiếp theo như zig-zag scan, run-level/Huffman hoặc đóng gói bitstream. Những phần này chỉ nên thêm khi cần theo đúng phạm vi môn học.
