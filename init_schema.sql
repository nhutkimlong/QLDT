-- XÓA TOÀN BỘ BẢNG (nếu có)
DROP TABLE IF EXISTS public.tourism_document_relations CASCADE;
DROP TABLE IF EXISTS public.tourism_document_file_attachments CASCADE;
DROP TABLE IF EXISTS public.tourism_documents CASCADE;
DROP TABLE IF EXISTS public.document_relations CASCADE;
DROP TABLE IF EXISTS public.file_attachments CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.relics CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- XÓA TOÀN BỘ ENUM (nếu có)
DROP TYPE IF EXISTS public.document_status CASCADE;
DROP TYPE IF EXISTS public.document_type CASCADE;
DROP TYPE IF EXISTS public.priority CASCADE;
DROP TYPE IF EXISTS public.task_priority CASCADE;
DROP TYPE IF EXISTS public.task_status CASCADE;
DROP TYPE IF EXISTS public.task_category CASCADE;
DROP TYPE IF EXISTS public.event_type CASCADE;
DROP TYPE IF EXISTS public.event_status CASCADE;
DROP TYPE IF EXISTS public.relic_type CASCADE;
DROP TYPE IF EXISTS public.relic_recognition_level CASCADE;
DROP TYPE IF EXISTS public.relic_tourism_exploitation_status CASCADE;
DROP TYPE IF EXISTS public.conservation_status CASCADE;
DROP TYPE IF EXISTS public.tourism_document_category CASCADE;
DROP TYPE IF EXISTS public.tourism_sector CASCADE;
DROP TYPE IF EXISTS public.tourism_document_relation_type CASCADE;

-- TẠO LẠI ENUM
CREATE TYPE public.document_status AS ENUM ('Mới', 'Đang xử lý', 'Chờ phản hồi', 'Đã hoàn thành', 'Lưu trữ', 'Hủy');
CREATE TYPE public.document_type AS ENUM (
  'Công văn đến',
  'Công văn đi',
  'Kế hoạch',
  'Báo cáo',
  'Tờ trình',
  'Biên bản',
  'Hợp đồng',
  'Tài liệu tham khảo',
  'Quyết định Phê duyệt',
  'Công văn Chỉ đạo',
  'Thuyết minh Dự án/Đề án',
  'Hồ sơ di tích',
  'Quy hoạch phát triển',
  'Đề án du lịch',
  'Báo cáo khảo sát',
  'Tài liệu nghiên cứu',
  'Hồ sơ Dự án Quy hoạch/Kế hoạch',
  'Biên bản Kiểm kê Di tích',
  'Báo cáo Giám sát Hoạt động Du lịch',
  'Khác'
);
CREATE TYPE public.priority AS ENUM ('Cao', 'Trung bình', 'Thấp');
CREATE TYPE public.task_priority AS ENUM ('Khẩn cấp', 'Cao', 'Trung bình', 'Thấp');
CREATE TYPE public.task_status AS ENUM ('Mới tạo', 'Đang thực hiện', 'Tạm dừng', 'Hoàn thành', 'Hủy bỏ');
CREATE TYPE public.task_category AS ENUM (
  'Soạn thảo', 'Trình ký', 'Theo dõi', 'Tham mưu', 'Phối hợp', 'Báo cáo CV',
  'Lưu trữ CV', 'Quản lý di tích chung', 'Kiểm kê di tích', 'Tu bổ tôn tạo di tích',
  'Giám sát hoạt động du lịch', 'Phát triển du lịch', 'Tiếp thị quảng bá',
  'Hỗ trợ khách du lịch', 'Nghiên cứu khoa học', 'Xây dựng sản phẩm du lịch',
  'Tham gia dự án quy hoạch/kế hoạch', 'Khác'
);
CREATE TYPE public.event_type AS ENUM (
  'Hội nghị', 'Hội thảo', 'Triển lãm', 'Chương trình xúc tiến', 'Lễ kỷ niệm',
  'Lễ hội truyền thống', 'Sự kiện văn hóa nghệ thuật', 'Hội chợ xúc tiến du lịch',
  'Chương trình quảng bá di sản', 'Hoạt động thể thao leo núi',
  'Hội thảo khoa học', 'Chương trình khảo sát thực địa', 'Tọa đàm giao lưu', 'Khác'
);
CREATE TYPE public.event_status AS ENUM (
  'Đã lên kế hoạch', 'Đang chuẩn bị', 'Đang diễn ra', 'Hoàn thành', 'Hủy bỏ'
);
CREATE TYPE public.relic_type AS ENUM (
  'Kiến trúc nghệ thuật', 'Lịch sử', 'Khảo cổ', 'Danh lam thắng cảnh', 'Lưu niệm sự kiện', 'Khác'
);
CREATE TYPE public.relic_recognition_level AS ENUM (
  'Quốc gia đặc biệt', 'Quốc gia', 'Cấp tỉnh', 'Chưa xếp hạng', 'Đề xuất xếp hạng'
);
CREATE TYPE public.relic_tourism_exploitation_status AS ENUM (
  'Đang khai thác tốt', 'Khai thác hiệu quả thấp', 'Hạn chế khai thác',
  'Ngừng khai thác', 'Tiềm năng chưa khai thác', 'Đang nghiên cứu xây dựng sản phẩm'
);
CREATE TYPE public.conservation_status AS ENUM (
  'Tốt', 'Cần tu bổ', 'Đang tu bổ', 'Xuống cấp nghiêm trọng',
  'Mới phát hiện khảo sát', 'Khác'
);
CREATE TYPE public.tourism_document_category AS ENUM (
  'Thông tư', 'Quyết định', 'Nghị định', 'Luật', 'Công văn hướng dẫn',
  'Chỉ thị', 'Kế hoạch ngành', 'Báo cáo ngành',
  'Tài liệu hội thảo/tập huấn ngành', 'Khác'
);
CREATE TYPE public.tourism_sector AS ENUM (
  'Lữ hành', 'Lưu trú', 'Xúc tiến quảng bá', 'Vận chuyển du lịch',
  'Khu/điểm du lịch', 'Hướng dẫn viên', 'An toàn du lịch',
  'Đào tạo nhân lực du lịch', 'Chính sách phát triển du lịch',
  'Nghiên cứu du lịch', 'Lĩnh vực khác'
);
CREATE TYPE public.tourism_document_relation_type AS ENUM (
  'Liên quan đến', 'Thay thế', 'Bổ sung', 'Sửa đổi', 'Hủy bỏ', 'Khác'
);

-- USERS
CREATE TABLE public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- DOCUMENTS
CREATE TABLE public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  document_number text,
  document_type public.document_type,
  status public.document_status,
  priority public.priority,
  due_date date,
  issued_date date,
  received_date date,
  issuing_organization text,
  recipient_organization text,
  summary text,
  tags text[],
  user_id uuid,
  handler_user_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- FILE ATTACHMENTS
CREATE TABLE public.file_attachments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  google_drive_file_id text,
  google_drive_download_link text,
  google_drive_webview_link text,
  mime_type text,
  size_bytes bigint,
  version integer default 1,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()),
  user_id uuid
);

-- DOCUMENT RELATIONS
CREATE TABLE public.document_relations (
  id uuid primary key default gen_random_uuid(),
  source_document_id uuid not null references public.documents(id) on delete cascade,
  related_document_id uuid not null references public.documents(id) on delete cascade,
  relation_type text,
  description text,
  user_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- EVENTS
CREATE TABLE public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_type public.event_type,
  status public.event_status,
  start_datetime timestamp with time zone,
  end_datetime timestamp with time zone,
  location text,
  organizer text,
  description text,
  user_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- TASKS
CREATE TABLE public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status public.task_status,
  priority public.task_priority,
  due_date date,
  task_category public.task_category,
  related_document_id uuid references public.documents(id) on delete set null,
  related_event_id uuid references public.events(id) on delete set null,
  user_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- RELICS
CREATE TABLE public.relics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  relic_type public.relic_type,
  recognition_level public.relic_recognition_level,
  tourism_exploitation_status public.relic_tourism_exploitation_status,
  conservation_status public.conservation_status,
  location_description text,
  short_description text,
  user_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- TOURISM DOCUMENTS
CREATE TABLE public.tourism_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  document_number text not null,
  document_category public.tourism_document_category not null,
  issuing_organization text not null,
  issued_date date not null,
  effective_date date,
  expiry_date date,
  tourism_sector public.tourism_sector,
  legal_basis text,
  summary text,
  applicable_entities text,
  tags text[],
  user_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- TOURISM DOCUMENT FILE ATTACHMENTS
CREATE TABLE public.tourism_document_file_attachments (
  id uuid primary key default gen_random_uuid(),
  tourism_document_id uuid not null references public.tourism_documents(id) on delete cascade,
  google_drive_file_id text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  google_drive_webview_link text not null,
  google_drive_download_link text,
  version integer default 1,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()),
  user_id uuid
);

-- TOURISM DOCUMENT RELATIONS
CREATE TABLE public.tourism_document_relations (
  id uuid primary key default gen_random_uuid(),
  source_document_id uuid not null references public.tourism_documents(id) on delete cascade,
  related_document_id uuid not null references public.tourism_documents(id) on delete cascade,
  relation_type public.tourism_document_relation_type not null,
  description text,
  user_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- MỞ FULL QUYỀN CHO PUBLIC
GRANT ALL ON ALL TABLES IN SCHEMA public TO public;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO public;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO public; 