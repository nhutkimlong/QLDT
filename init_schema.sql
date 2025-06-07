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
CREATE TYPE public.document_status AS ENUM ('Moi', 'DangXuLy', 'ChoPhanHoi', 'DaHoanThanh', 'LuuTru', 'Huy');
CREATE TYPE public.document_type AS ENUM (
  'CongVanDen', 'CongVanDi', 'KeHoach', 'BaoCao', 'ToTrinh', 'BienBan',
  'HopDong', 'TaiLieuThamKhao', 'QuyetDinhPheDuyet', 'CongVanChiDao',
  'ThuyetMinhDuAnDeAn', 'HoSoDiTich', 'QuyHoachPhatTrien',
  'DeAnDuLich', 'BaoCaoKhaoSat', 'TaiLieuNghienCuu',
  'HoSoDuAnQuyHoachKeHoach', 'BienBanKiemKeDiTich',
  'BaoCaoGiamSatHoatDongDuLich', 'Khac'
);
CREATE TYPE public.priority AS ENUM ('Cao', 'TrungBinh', 'Thap');
CREATE TYPE public.task_priority AS ENUM ('KhanCap', 'Cao', 'TrungBinh', 'Thap');
CREATE TYPE public.task_status AS ENUM ('MoiTao', 'DangThucHien', 'TamDung', 'HoanThanh', 'HuyBo');
CREATE TYPE public.task_category AS ENUM (
  'SoanThao', 'TrinhKy', 'TheoDoi', 'ThamMuu', 'PhoiHop', 'BaoCaoCV',
  'LuuTruCV', 'QuanLyDiTichChung', 'KiemKeDiTich', 'TuBoTonTaoDiTich',
  'GiamSatHoatDongDuLich', 'PhatTrienDuLich', 'TiepThiQuangBa',
  'HoTroKhachDuLich', 'NghienCuuKhoaHoc', 'XayDungSanPhamDuLich',
  'ThamGiaDuAnQuyHoachKeHoach', 'Khac'
);
CREATE TYPE public.event_type AS ENUM (
  'HoiNghi', 'HoiThao', 'TrienLam', 'ChuongTrinhXucTien', 'LeKyNiem',
  'LeHoiTruyenThong', 'SuKienVanHoaNgheThuat', 'HoiChoXucTienDuLich',
  'ChuongTrinhQuangBaDiSan', 'HoatDongTheThaoLeoNui',
  'HoiThaoKhoaHoc', 'ChuongTrinhKhaoSatThucDia', 'ToaDamGiaoLuu', 'Khac'
);
CREATE TYPE public.event_status AS ENUM (
  'DaLenKeHoach', 'DangChuanBi', 'DangDienRa', 'HoanThanh', 'HuyBo'
);
CREATE TYPE public.relic_type AS ENUM (
  'KienTrucNgheThuat', 'LichSu', 'KhaoCo', 'DanhLamThangCanh', 'LuuNiemSuKien', 'Khac'
);
CREATE TYPE public.relic_recognition_level AS ENUM (
  'QuocGiaDacBiet', 'QuocGia', 'CapTinh', 'ChuaXepHang', 'DeXuatXepHang'
);
CREATE TYPE public.relic_tourism_exploitation_status AS ENUM (
  'DangKhaiThacTot', 'KhaiThacHieuQuaThap', 'HanCheKhaiThac',
  'NgungKhaiThac', 'TiemNangChuaKhaiThac', 'DangNghienCuuXayDungSP'
);
CREATE TYPE public.conservation_status AS ENUM (
  'Tot', 'CanTuBo', 'DangTuBo', 'XuongCapNghiemTrong',
  'MoiPhatHienKhaoSat', 'Khac'
);
CREATE TYPE public.tourism_document_category AS ENUM (
  'ThongTu', 'QuyetDinh', 'NghiDinh', 'Luat', 'CongVanHuongDan',
  'ChiThi', 'KeHoachNganh', 'BaoCaoNganh',
  'TaiLieuHoiThaoTapHuanNganh', 'Khac'
);
CREATE TYPE public.tourism_sector AS ENUM (
  'LuHanh', 'LuuTru', 'XucTienQuangBa', 'VanChuyenDuLich',
  'KhuDiemDuLich', 'HuongDanVien', 'AnToanDuLich',
  'DaoTaoNhanLucDuLich', 'ChinhSachPhatTrienDuLich',
  'NghienCuuDuLich', 'LinhVucKhac'
);
CREATE TYPE public.tourism_document_relation_type AS ENUM (
  'LienQuanDen', 'ThayThe', 'BoSung', 'SuaDoi', 'HuyBo', 'Khac'
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
  summary text,
  tags text[],
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- FILE ATTACHMENTS
CREATE TABLE public.file_attachments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()),
  user_id uuid not null references public.users(id) on delete cascade
);

-- DOCUMENT RELATIONS
CREATE TABLE public.document_relations (
  id uuid primary key default gen_random_uuid(),
  source_document_id uuid not null references public.documents(id) on delete cascade,
  related_document_id uuid not null references public.documents(id) on delete cascade,
  relation_type text,
  description text,
  user_id uuid not null references public.users(id) on delete cascade,
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
  user_id uuid not null references public.users(id) on delete cascade,
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
  user_id uuid not null references public.users(id) on delete cascade,
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
  user_id uuid not null references public.users(id) on delete cascade,
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
  user_id uuid not null references public.users(id) on delete cascade,
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
  user_id uuid not null references public.users(id) on delete cascade
);

-- TOURISM DOCUMENT RELATIONS
CREATE TABLE public.tourism_document_relations (
  id uuid primary key default gen_random_uuid(),
  source_document_id uuid not null references public.tourism_documents(id) on delete cascade,
  related_document_id uuid not null references public.tourism_documents(id) on delete cascade,
  relation_type public.tourism_document_relation_type not null,
  description text,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- MỞ FULL QUYỀN CHO PUBLIC
GRANT ALL ON ALL TABLES IN SCHEMA public TO public;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO public;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO public; 