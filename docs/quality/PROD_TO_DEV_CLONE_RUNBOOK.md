# Production to Development Clone Runbook

## Mục tiêu và phạm vi

Runbook này quản lý snapshot dữ liệu Cloud Firestore từ Production sang Development để tái hiện bug và kiểm thử gần điều kiện vận hành thật.

```text
lakeducation (PROD) ── clone một chiều ──> lakeducation-dev (DEV)
                                                ↑
                         localhost / dev URL ───┘

DEV tuyệt đối không đồng bộ dữ liệu ngược về PROD.
```

| Môi trường | Firebase project | Firestore database | Mục đích |
| --- | --- | --- | --- |
| Production | `lakeducation` | `lakeducationdb` | Vận hành dữ liệu thật |
| Development | `lakeducation-dev` | `lakeducationdb` | Tái hiện lỗi, phát triển và kiểm thử |
| Local Emulator | `demo-lakeducation` | `lakeducationdb` | Kiểm thử phá huỷ, offline hoặc fixture nhỏ |

Production và DEV phải luôn dùng cùng source code, model, service, Firestore Rules và indexes. Chỉ khác Firebase project và dữ liệu tại thời điểm snapshot.

## Ba phương án clone dữ liệu tối ưu chi phí & thời gian

Tùy vào quy mô bài toán, Agent và Developer bắt buộc lựa chọn phương án tối ưu theo thứ tự ưu tiên sau:

| Phương án | Cơ chế thực hiện | Chi phí | Thời gian | Tình huống áp dụng |
| --- | --- | :---: | :---: | --- |
| **Phương án 1 (Ưu tiên số 1 - Targeted Scope)** | Chạy script Node.js `scripts/sync_target_doc.js` đọc trực tiếp PROD ghi sang DEV qua SDK | **0 VNĐ** (trong Free Tier) | **< 1 giây** | **Tái hiện bug thông thường**, debug 1 document hoặc 1 collection mục tiêu (ví dụ: lớp `LH002`, `courses`...). Không qua GCS bucket. |
| **Phương án 2 (Kiểm thử phá hủy - 0đ tuyệt đối)** | Chạy Firebase Local Emulator (`npm run dev:emulator`) | **0 VNĐ** (chạy trên RAM máy Mac) | **0 ms** | Kiểm thử phá hủy, test xóa sạch DB, test offline, unit test tự động mà không làm bẩn cả PROD lẫn DEV Cloud. |
| **Phương án 3 (Snapshot toàn bộ hệ thống)** | Export GCS Bucket `gs://lakeducation-firestore-clone-...` rồi Import vào DEV | **~600 VNĐ** (với 10.000 doc) | **1 – 3 phút** | Chuẩn bị trước đợt phát hành phiên bản lớn (Major Release), bàn giao toàn diện hệ thống. Không chạy thường quy hằng ngày. |

### Hướng dẫn sử dụng Phương án 1 (Targeted Scope Clone - 0đ)

```bash
# 1. Clone đúng 1 document bị lỗi về DEV để debug:
node scripts/sync_target_doc.js --doc=classes/LH002

# 2. Clone toàn bộ 1 collection cụ thể (ví dụ: courses hoặc classes):
node scripts/sync_target_doc.js --col=courses

# 3. Chạy thử nghiệm kiểm tra trước không ghi:
node scripts/sync_target_doc.js --doc=classes/LH002 --dry-run
```

---

## Điều kiện trước khi clone (Phương án 3 - Snapshot toàn bộ)

1. Người thực hiện đăng nhập Google Cloud bằng `vnthietbigarage@gmail.com` hoặc tài khoản được cấp quyền tương đương.
2. Billing phải đang bật ở cả hai Firebase project.
3. Kiểm tra rõ source là `lakeducation` và target là `lakeducation-dev`.
4. Xác nhận lý do clone: reproduce bug, feature lớn hoặc kiểm thử tích hợp. Không clone định kỳ hằng ngày nếu không cần.
5. Không chạy clone đồng thời với migration hoặc thao tác dữ liệu hàng loạt trên Production.

## Cấu hình đã thiết lập

| Hạng mục | Giá trị |
| --- | --- |
| Firestore location | `asia-southeast1` |
| Firestore edition | Standard |
| Bucket snapshot | `gs://lakeducation-firestore-clone-36575839783` |
| Prefix snapshot | `prod-to-dev/<YYYYMMDD-HHMMSS>` |
| Project owner | `vnthietbigarage@gmail.com` |

Bucket snapshot chỉ là đường trung chuyển. Firestore service agent của DEV chỉ được quyền đọc object trong bucket để import snapshot; không được cấp quyền ghi Production.

## Quy trình clone bắt buộc

### 1. Lập kế hoạch

Ghi vào báo cáo task:

- Mã task/bug và lý do clone.
- Thời gian snapshot dự kiến.
- Database source/target.
- Người thực hiện.
- Xác nhận: không clone Drive media, Firebase Auth hoặc dữ liệu DEV ngược về PROD trừ khi có yêu cầu riêng.

### 2. Xác minh hai database

```bash
firebase firestore:databases:get lakeducationdb --project lakeducation
firebase firestore:databases:get lakeducationdb --project lakeducation-dev
```

Phải cùng `asia-southeast1`, `STANDARD`, `FIRESTORE_NATIVE`. Nếu khác, dừng lại và báo cáo.

### 3. Export Production, chỉ đọc

```bash
CLONE_TIMESTAMP=$(TZ=Asia/Ho_Chi_Minh date +%Y%m%d-%H%M%S)
CLONE_PREFIX="gs://lakeducation-firestore-clone-36575839783/prod-to-dev/$CLONE_TIMESTAMP"
gcloud firestore export "$CLONE_PREFIX" \
  --project=lakeducation \
  --database=lakeducationdb
```

Lệnh này chỉ đọc Production. Chờ operation `SUCCESSFUL`; không import file export chưa hoàn tất.

### 4. Ghi manifest và xác minh export

Manifest tối thiểu phải ghi:

```text
snapshotPrefix: gs://.../prod-to-dev/<timestamp>
sourceProject: lakeducation
sourceDatabase: lakeducationdb
targetProject: lakeducation-dev
targetDatabase: lakeducationdb
exportStatus: SUCCESSFUL
documentCount: <progressDocuments.completedWork>
byteCount: <progressBytes.completedWork>
reason: <bug/feature ID>
createdAt: <Asia/Ho_Chi_Minh timestamp>
```

Lưu manifest tại `docs/quality/clone-manifests/` hoặc thư mục task đang thực hiện; không lưu token, secret hay PII ngoài dữ liệu snapshot.

### 5. Reset DEV trước import

Firestore managed import **không xóa document DEV không có trong snapshot**. Vì vậy nếu cần bản DEV giống hệt snapshot, phải reset database DEV trước import.

- Đây là thao tác phá huỷ **chỉ trên `lakeducation-dev`**.
- Agent phải in rõ target project/database và chờ lệnh xác nhận riêng trước khi xóa/reset DEV.
- Không dùng `firestore:delete` hay bulk delete nếu biến project/database chưa được kiểm tra tường minh.
- Sau reset, kiểm tra collection DEV rỗng trước import.

Nếu không reset, báo cáo phải ghi rõ DEV là bản merge, không phải bản sao chính xác Production.

### 6. Import vào DEV

```bash
gcloud firestore import "$CLONE_PREFIX" \
  --project=lakeducation-dev \
  --database=lakeducationdb
```

Chờ operation `SUCCESSFUL`, rồi so sánh document count với export manifest. Import chỉ được chạy với target `lakeducation-dev`; không bao giờ thay target bằng `lakeducation`.

### 7. Đồng bộ cấu hình dữ liệu

Trước khi localhost dùng DEV, xác nhận:

- Firestore Rules DEV khớp release Production.
- Composite indexes DEV khớp Production; hiện Production không có composite index.
- `npm run dev` trên localhost kết nối `lakeducation-dev`.
- Thanh xanh hiển thị `MÔI TRƯỜNG PHÁT TRIỂN • DỮ LIỆU DEV`.
- Production URL không có thanh xanh và vẫn kết nối `lakeducation`.

### 8. Nghiệm thu clone

Kiểm tra tối thiểu bằng client SDK hoặc UI:

- `users`, `courses`, `classes` có dữ liệu và quan hệ ID hợp lệ.
- Case bug cần tái hiện có dữ liệu cần thiết.
- Ghi document thử trên DEV (có prefix `[TEST:...]`) không xuất hiện ở Production.
- Xóa document thử và xác nhận `0 test residue`.

## Firebase Authentication và Google Drive

Firestore clone không bao gồm hai phạm vi sau:

| Phạm vi | Quy tắc |
| --- | --- |
| Firebase Authentication | Không clone mặc định. Firebase Auth users/provider credentials cần export/import riêng và có phê duyệt riêng. Email/password DEV có thể được tạo khi profile Firestore DEV đăng nhập lần đầu. Google sign-in DEV cần provider/OAuth config của project DEV riêng. |
| Google Drive/media | Không clone mặc định. Firestore chỉ clone metadata/link; chỉ sao chép file khi bug liên quan trực tiếp file đính kèm và có yêu cầu rõ. |

## Dùng hằng ngày

```bash
# Phát triển/reproduce trên snapshot DEV cloud
npm run dev

# Kiểm thử cô lập phá huỷ bằng data giả lập
npm run emulators
npm run dev:emulator
```

Sau khi fix trên DEV:

1. Chạy regression test và build.
2. Chỉ deploy source code/rules/indexes được phê duyệt sang Production.
3. Không deploy Firestore documents từ DEV sang Production.
4. Smoke test Production ở mức tối thiểu.

## Chi phí và vòng đời snapshot

- Mỗi export tính một lượt đọc/document; mỗi import tính một lượt ghi/document.
- Với dữ liệu Firestore chủ yếu là text hiện tại, chi phí clone thủ công thấp.
- Chỉ clone khi cần reproduce bug phức tạp hoặc bắt đầu feature lớn.
- Giữ tối đa hai snapshot gần nhất; xóa snapshot cũ theo quyết định chủ động sau khi đã không còn cần cho điều tra/rollback.
- Không dựa vào billing alert để chặn clone; export/import có thể ghi nhận chi phí sau khi operation kết thúc.

## Cấm tuyệt đối

- Không đổi source/target để import vào `lakeducation` Production.
- Không đồng bộ DEV → PROD dưới bất kỳ hình thức tự động nào.
- Không chạy reset DEV khi chưa xác nhận rõ target là `lakeducation-dev`.
- Không clone Auth, Drive media hay backup Production ngầm khi không có yêu cầu.
- Không coi DEV là dữ liệu realtime; snapshot chỉ phản ánh thời điểm export.
