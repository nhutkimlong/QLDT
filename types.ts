// Shared
export type UUID = string;

export enum Priority {
  Cao = 'Cao',
  TrungBinh = 'Trung bình',
  Thap = 'Thấp',
}

export enum TaskPriority {
  KhanCap = 'Khẩn cấp',
  Cao = 'Cao',
  TrungBinh = 'Trung bình',
  Thap = 'Thấp',
}

// --- Enums for Relic Management ---
export enum RelicType {
  DiTichKienTrucNgheThuat = 'Di tích kiến trúc nghệ thuật',
  DiTichLichSu = 'Di tích lịch sử',
  DiTichKhaoCo = 'Di tích khảo cổ',
  DanhLamThangCanh = 'Danh lam thắng cảnh',
  DiTichLuuNiemSuKien = 'Di tích lưu niệm sự kiện',
  Khac = 'Loại hình khác',
}

export enum RelicRecognitionLevel {
  QuocGiaDacBiet = 'Quốc gia đặc biệt',
  QuocGia = 'Quốc gia',
  CapTinh = 'Cấp tỉnh',
  ChuaXepHang = 'Chưa xếp hạng',
  DeXuatXepHang = 'Đề xuất xếp hạng',
}

export enum RelicTourismExploitationStatus {
  DangKhaiThacTot = 'Đang khai thác tốt',
  KhaiThacHieuQuaThap = 'Khai thác hiệu quả thấp',
  HanCheKhaiThac = 'Hạn chế khai thác',
  NgungKhaiThac = 'Ngừng khai thác',
  TiemNang = 'Tiềm năng, chưa khai thác',
  DangNghienCuu = 'Đang nghiên cứu, xây dựng SP',
}

// Re-using ConservationStatus for Relics as well
export enum ConservationStatus {
  Tot = 'Tốt',
  CanTuBo = 'Cần tu bổ',
  DangTuBo = 'Đang tu bổ',
  XuongCapNghiemTrong = 'Xuống cấp nghiêm trọng',
  MoiPhatHien = 'Mới phát hiện/khảo sát',
  Khac = 'Khác',
}

// Document & Artefact Management (DAM)
export enum DocumentType {
  CongVanDen = 'Công văn đến',
  CongVanDi = 'Công văn đi',
  KeHoach = 'Kế hoạch',
  BaoCao = 'Báo cáo',
  ToTrinh = 'Tờ trình',
  BienBan = 'Biên bản',
  HopDong = 'Hợp đồng',
  TaiLieuThamKhao = 'Tài liệu tham khảo',
  QuyetDinhPheDuyet = 'Quyết định Phê duyệt',
  CongVanChiDao = 'Công văn Chỉ đạo',
  ThuyetMinhDuAnDeAn = 'Thuyết minh Dự án/Đề án',
  HoSoDiTich = 'Hồ sơ di tích', 
  QuyHoachPhatTrien = 'Quy hoạch phát triển',
  DeAnDuLich = 'Đề án du lịch',
  BaoCaoKhaoSat = 'Báo cáo khảo sát',
  TaiLieuNghienCuu = 'Tài liệu nghiên cứu',
  HoSoDuAnQuyHoachKeHoach = 'Hồ sơ Dự án Quy hoạch/Kế hoạch', 
  BienBanKiemKeDiTich = 'Biên bản Kiểm kê Di tích', 
  BaoCaoGiamSatHoatDongDuLich = 'Báo cáo Giám sát Hoạt động Du lịch', 
  Khac = 'Khác',
}

export enum DocumentStatus {
  Moi = 'Mới',
  DangXuLy = 'Đang xử lý',
  ChoPhanHoi = 'Chờ phản hồi',
  DaHoanThanh = 'Đã hoàn thành',
  LuuTru = 'Lưu trữ',
  Huy = 'Hủy',
}

export interface Document {
  id: UUID;
  title: string;
  document_number: string;
  document_type: DocumentType;
  issued_date: string; 
  received_date?: string | null; 
  issuing_organization: string;
  status: DocumentStatus;
  due_date?: string | null; 
  summary?: string | null;
  tags?: string[] | null;
  created_at?: string; 
  updated_at?: string; 
  user_id: UUID; 
  file_attachments?: FileAttachment[];
  related_documents?: DocumentRelationInfo[];
  
  physical_storage_location?: string | null;
  project_code?: string | null; 
  creator_user_email?: string | null; 
  handler_user_email?: string | null; 
}

export interface DocumentFormData {
  title: string;
  document_number: string;
  document_type: DocumentType;
  issued_date: string;
  issuing_organization: string;
  status: DocumentStatus;
  received_date?: string | null;
  due_date?: string | null;
  summary?: string | null;
  tags?: string[] | null; 
  tagsString?: string; 
}


export interface FileAttachment {
  id: UUID;
  document_id: UUID; 
  google_drive_file_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  google_drive_webview_link: string;
  google_drive_download_link?: string | null;
  version: number;
  uploaded_at?: string; 
  user_id: UUID;
}

export interface FileAttachmentUploadData { 
  document_id: UUID; 
  file: File; 
}
export interface FileAttachmentLinkData { 
  document_id: UUID; 
  google_drive_file_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  google_drive_webview_link: string;
  google_drive_download_link?: string | null;
}


export enum DocumentRelationType {
  LienQuanDen = 'Liên quan đến',
  PhuThuocVao = 'Phụ thuộc vào',
  LaBaoCaoCho = 'Là báo cáo cho',
  LaKeHoachCua = 'Là kế hoạch của',
  DuocTrienKhaiBoi = 'Được triển khai bởi',
  TaiLieuThamKhaoCho = 'Tài liệu tham khảo cho',
}

export interface DocumentRelation {
  id: UUID;
  source_document_id: UUID;
  related_document_id: UUID;
  relation_type: DocumentRelationType;
  description?: string | null;
  user_id: UUID;
  created_at?: string;
}

export interface DocumentRelationFormData {
  source_document_id: UUID;
  related_document_id: UUID;
  relation_type: DocumentRelationType;
  description?: string | null;
}

export interface DocumentRelationInfo extends DocumentRelation {
  related_document_title?: string; 
  source_document_title?: string; 
}


// Task Management (TM)
export enum TaskStatus {
  MoiTao = 'Mới tạo',
  DangThucHien = 'Đang thực hiện',
  TamDung = 'Tạm dừng',
  HoanThanh = 'Hoàn thành',
  HuyBo = 'Hủy bỏ',
}

export enum TaskCategory { // This enum might be simplified or removed based on further feedback
  SoanThao = 'Soạn thảo',
  TrinhKy = 'Trình ký',
  TheoDoi = 'Theo dõi',
  ThamMuu = 'Tham mưu',
  PhoiHop = 'Phối hợp',
  BaoCaoTask = 'Báo cáo CV', 
  LuuTruTask = 'Lưu trữ CV', 
  QuanLyDiTich = 'Quản lý di tích (chung)', 
  KiemKeDiTich = 'Kiểm kê di tích', 
  TuBoTonTaoDiTich = 'Tu bổ/Tôn tạo di tích',
  GiamSatHoatDongDuLich = 'Giám sát hoạt động du lịch', 
  PhatTrienDuLich = 'Phát triển du lịch',
  TiepThiQuangBa = 'Tiếp thị & quảng bá',
  HoTroKhachDuLich = 'Hỗ trợ khách du lịch',
  NghienCuuKhoaHoc = 'Nghiên cứu khoa học (Di tích/Du lịch)',
  XayDungSanPhamDuLich = 'Xây dựng sản phẩm du lịch',
  ThamGiaDuAn = 'Tham gia Dự án Quy hoạch/Kế hoạch', 
  Khac = 'Khác',
}

export interface Task {
  id: UUID;
  title: string;
  description?: string | null;
  related_document_id?: UUID | null;
  related_document_title?: string; 
  related_event_id?: UUID | null;
  related_event_name?: string; 
  priority: TaskPriority;
  status: TaskStatus;
  start_date?: string | null; 
  due_date?: string | null; 
  completion_date?: string | null; 
  assignee_id?: UUID | null; 
  estimated_effort_hours?: number | null; // Keep in main type for data, but remove from form
  actual_effort_hours?: number | null; // Keep in main type for data, but remove from form
  created_at?: string; 
  updated_at?: string; 
  user_id: UUID; 

  task_category?: TaskCategory | null; // Keep in main type for data, but remove from form
  department_responsible?: string | null; 
  coordinating_departments?: string | null; 

  inspection_target?: string | null; 
  restoration_phase?: string | null; 
  monitored_entity_name?: string | null; 
  inventory_scope?: string | null; 
}

export interface TaskFormData {
  title: string;
  description?: string | null;
  related_document_id?: UUID | null;
  related_event_id?: UUID | null;
  priority: TaskPriority;
  status: TaskStatus;
  start_date?: string | null;
  due_date?: string | null;
  completion_date?: string | null;
  // assignee_id?: UUID | null; // Removed from form for specialist role
  // estimated_effort_hours?: number | null; // Removed from form
  // actual_effort_hours?: number | null; // Removed from form
  // task_category?: TaskCategory | null; // Removed from form
  // department_responsible?: string | null; // Removed from form
  // coordinating_departments?: string | null; // Removed from form
  // inspection_target?: string | null; // Removed from form
  // restoration_phase?: string | null; // Removed from form
  // monitored_entity_name?: string | null; // Removed from form
  // inventory_scope?: string | null; // Removed from form
}


// Event & Promotion Management (EPM)
export enum EventType {
  HoiNghi = 'Hội nghị',
  HoiThao = 'Hội thảo',
  TrienLam = 'Triển lãm',
  ChuongTrinhXucTien = 'Chương trình xúc tiến', 
  LeKyNiem = 'Lễ kỷ niệm', 
  LeHoiTruyenThong = 'Lễ hội truyền thống',
  SuKienVanHoaNgheThuat = 'Sự kiện văn hóa nghệ thuật',
  HoiChoXucTienDuLich = 'Hội chợ xúc tiến du lịch',
  ChuongTrinhQuangBaDiSan = 'Chương trình quảng bá di sản',
  HoatDongTheThaoLeoNui = 'Hoạt động thể thao leo núi', 
  HoiThaoKhoaHoc = 'Hội thảo khoa học (Di tích/Du lịch)',
  ChuongTrinhKhaoSatFamtrip = 'Chương trình khảo sát thực địa/Famtrip',
  ToaDamGiaoLuu = 'Tọa đàm/Giao lưu',
  Khac = 'Khác',
}

export enum EventStatus {
  DaLenKeHoach = 'Đã lên kế hoạch',
  DangChuanBi = 'Đang chuẩn bị',
  DangDienRa = 'Đang diễn ra',
  HoanThanh = 'Hoàn thành',
  HuyBo = 'Hủy bỏ',
}

export interface Event {
  id: UUID;
  name: string;
  event_type: EventType;
  description?: string | null;
  start_datetime: string; 
  end_datetime: string; 
  location?: string | null;
  status: EventStatus;
  budget?: number | null; // Keep in main type for data, but remove from form
  organizer?: string | null;
  created_at?: string; 
  updated_at?: string; 
  user_id: UUID;

  expected_attendees?: number | null; // Keep in main type for data, but remove from form
  actual_attendees?: number | null; // Keep in main type for data, but remove from form
  coordinating_units?: string | null; // Keep in main type for data, but remove from form
  target_audience?: string | null; // Keep in main type for data, but remove from form
  funding_source?: string | null; // Keep in main type for data, but remove from form
  key_stakeholders?: string | null; // Keep in main type for data, but remove from form
  media_contact_person?: string | null; // Keep in main type for data, but remove from form
  post_event_report_doc_id?: UUID | null; // Keep in main type for data, but remove from form
}

export interface EventFormData {
  name: string;
  event_type: EventType;
  description?: string | null;
  start_datetime: string;
  end_datetime: string;
  location?: string | null;
  status: EventStatus;
  organizer?: string | null;
  // budget?: number | null; // Removed from form
  // expected_attendees?: number | null; // Removed from form
  // actual_attendees?: number | null; // Removed from form
  // coordinating_units?: string | null; // Removed from form
  // target_audience?: string | null; // Removed from form
  // funding_source?: string | null; // Removed from form
  // key_stakeholders?: string | null; // Removed from form
  // media_contact_person?: string | null; // Removed from form
  // post_event_report_doc_id?: UUID | null; // Removed from form
}

// Relic Management
export interface Relic {
  id: UUID;
  name: string;
  relic_type: RelicType;
  recognition_level: RelicRecognitionLevel;
  location_description: string; 
  established_date?: string | null; 
  short_description?: string | null;
  historical_cultural_value?: string | null; 
  current_conservation_status?: ConservationStatus | null;
  protection_zone_details?: string | null; 
  management_unit_responsible?: string | null; 
  last_inspection_date?: string | null; 
  tourism_exploitation_status?: RelicTourismExploitationStatus | null;
  main_image_url?: string | null; 
  notes?: string | null;
  user_id: UUID;
  created_at?: string;
  updated_at?: string;
}

export interface RelicFormData {
  name: string;
  relic_type: RelicType;
  recognition_level: RelicRecognitionLevel;
  location_description: string;
  established_date?: string | null;
  short_description?: string | null;
  historical_cultural_value?: string | null;
  current_conservation_status?: ConservationStatus | null;
  protection_zone_details?: string | null;
  management_unit_responsible?: string | null;
  last_inspection_date?: string | null;
  tourism_exploitation_status?: RelicTourismExploitationStatus | null;
  main_image_url?: string | null;
  notes?: string | null;
}

// --- Tourism Document Management ---
export enum TourismDocumentCategory {
  ThongTu = 'Thông tư',
  QuyetDinh = 'Quyết định',
  NghiDinh = 'Nghị định',
  Luat = 'Luật',
  CongVanHuongDan = 'Công văn hướng dẫn',
  ChiThi = 'Chỉ thị',
  KeHoachNganh = 'Kế hoạch ngành',
  BaoCaoNganh = 'Báo cáo ngành',
  TaiLieuHoiThao = 'Tài liệu Hội thảo/Tập huấn ngành',
  Khac = 'Khác',
}

export enum TourismSector {
  LuHanh = 'Lữ hành',
  LuuTru = 'Lưu trú',
  XucTienQuangBa = 'Xúc tiến & Quảng bá',
  VanChuyenDuLich = 'Vận chuyển du lịch',
  KhuDiemDuLich = 'Khu/Điểm du lịch',
  HuongDanVien = 'Hướng dẫn viên',
  AnToanDuLich = 'An toàn du lịch',
  DaoTaoNhanLuc = 'Đào tạo nhân lực du lịch',
  ChinhSachPhatTrien = 'Chính sách phát triển du lịch',
  NghienCuuDuLich = 'Nghiên cứu du lịch',
  Khac = 'Lĩnh vực khác',
}

export interface TourismFileAttachment {
  id: UUID;
  tourism_document_id: UUID;
  google_drive_file_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  google_drive_webview_link: string;
  google_drive_download_link?: string | null;
  version: number;
  uploaded_at?: string;
  user_id: UUID;
}

export interface TourismFileAttachmentLinkData {
  tourism_document_id: UUID;
  google_drive_file_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  google_drive_webview_link: string;
  google_drive_download_link?: string | null;
}

export enum TourismDocumentRelationType {
  LienQuanDen = 'Liên quan đến',
  ThayThe = 'Thay thế',
  BoSung = 'Bổ sung',
  SuaDoi = 'Sửa đổi',
  HuyBo = 'Hủy bỏ',
  Khac = 'Khác',
}

export interface TourismDocumentRelation {
  id: UUID;
  source_document_id: UUID;
  related_document_id: UUID;
  relation_type: TourismDocumentRelationType;
  description?: string | null;
  user_id: UUID;
  created_at?: string;
}

export interface TourismDocumentRelationFormData {
  source_document_id: UUID;
  related_document_id: UUID;
  relation_type: TourismDocumentRelationType;
  description?: string | null;
}

export interface TourismDocument {
  id: UUID;
  title: string; 
  document_number: string; 
  document_category: TourismDocumentCategory; 
  issuing_organization: string; 
  issued_date: string; 
  effective_date?: string | null; 
  expiry_date?: string | null; 
  tourism_sector?: TourismSector | null; 
  legal_basis?: string | null; 
  summary?: string | null; 
  applicable_entities?: string | null; 
  tags?: string[] | null; 
  file_attachments?: TourismFileAttachment[];
  related_documents?: TourismDocumentRelation[];
  user_id: UUID;
  created_at?: string;
  updated_at?: string;
}

export interface TourismDocumentFormData {
  title: string;
  document_number: string;
  document_category: TourismDocumentCategory;
  issuing_organization: string;
  issued_date: string; 
  effective_date?: string | null;
  expiry_date?: string | null;
  tourism_sector?: TourismSector | null;
  legal_basis?: string | null;
  summary?: string | null;
  applicable_entities?: string | null;
  tagsString?: string;
  tags?: string[] | null;
}


// For AI Features
export interface AISuggestedTask {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string; // YYYY-MM-DD
  related_document_id?: UUID; 
}


// Supabase Schema
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      document_relations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          related_document_id: string
          relation_type: Database["public"]["Enums"]["document_relation_type"]
          source_document_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          related_document_id: string
          relation_type: Database["public"]["Enums"]["document_relation_type"]
          source_document_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          related_document_id?: string
          relation_type?: Database["public"]["Enums"]["document_relation_type"]
          source_document_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_relations_related_document_id_fkey"
            columns: ["related_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_relations_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_relations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          document_number: string
          document_type: Database["public"]["Enums"]["document_type"]
          due_date: string | null
          id: string
          issued_date: string
          issuing_organization: string
          physical_storage_location: string | null
          status: Database["public"]["Enums"]["document_status"]
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_number: string
          document_type: Database["public"]["Enums"]["document_type"]
          due_date?: string | null
          id?: string
          issued_date: string
          issuing_organization: string
          physical_storage_location?: string | null
          status: Database["public"]["Enums"]["document_status"]
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_number?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          due_date?: string | null
          id?: string
          issued_date?: string
          issuing_organization?: string
          physical_storage_location?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          actual_attendees: number | null
          budget: number | null
          coordinating_units: string | null
          created_at: string
          description: string | null
          end_datetime: string
          event_type: Database["public"]["Enums"]["event_type"]
          expected_attendees: number | null
          funding_source: string | null
          id: string
          key_stakeholders: string | null 
          location: string | null
          media_contact_person: string | null 
          name: string
          organizer: string | null
          post_event_report_doc_id: string | null 
          start_datetime: string
          status: Database["public"]["Enums"]["event_status"]
          target_audience: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_attendees?: number | null
          budget?: number | null
          coordinating_units?: string | null
          created_at?: string
          description?: string | null
          end_datetime: string
          event_type: Database["public"]["Enums"]["event_type"]
          expected_attendees?: number | null
          funding_source?: string | null
          id?: string
          key_stakeholders?: string | null 
          location?: string | null
          media_contact_person?: string | null 
          name: string
          organizer?: string | null
          post_event_report_doc_id?: string | null 
          start_datetime: string
          status: Database["public"]["Enums"]["event_status"]
          target_audience?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_attendees?: number | null
          budget?: number | null
          coordinating_units?: string | null
          created_at?: string
          description?: string | null
          end_datetime?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          expected_attendees?: number | null
          funding_source?: string | null
          id?: string
          key_stakeholders?: string | null 
          location?: string | null
          media_contact_person?: string | null 
          name?: string
          organizer?: string | null
          post_event_report_doc_id?: string | null 
          start_datetime?: string
          status?: Database["public"]["Enums"]["event_status"]
          target_audience?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_post_event_report_doc_id_fkey" 
            columns: ["post_event_report_doc_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      file_attachments: {
        Row: {
          document_id: string 
          file_name: string
          google_drive_download_link: string | null
          google_drive_file_id: string
          google_drive_webview_link: string
          id: string
          mime_type: string
          size_bytes: number
          uploaded_at: string
          user_id: string
          version: number
        }
        Insert: {
          document_id: string 
          file_name: string
          google_drive_download_link?: string | null
          google_drive_file_id: string
          google_drive_webview_link: string
          id?: string
          mime_type: string
          size_bytes: number
          uploaded_at?: string
          user_id: string
          version?: number
        }
        Update: {
          document_id?: string 
          file_name?: string
          google_drive_download_link?: string | null
          google_drive_file_id?: string
          google_drive_webview_link?: string
          id?: string
          mime_type?: string
          size_bytes?: number
          uploaded_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "file_attachments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents" 
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_attachments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      relics: { 
        Row: {
          id: string
          name: string
          relic_type: Database["public"]["Enums"]["relic_type"]
          recognition_level: Database["public"]["Enums"]["relic_recognition_level"]
          location_description: string
          established_date: string | null
          short_description: string | null
          historical_cultural_value: string | null
          current_conservation_status: Database["public"]["Enums"]["conservation_status"] | null
          protection_zone_details: string | null
          management_unit_responsible: string | null
          last_inspection_date: string | null
          tourism_exploitation_status: Database["public"]["Enums"]["relic_tourism_exploitation_status"] | null
          main_image_url: string | null
          notes: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          relic_type: Database["public"]["Enums"]["relic_type"]
          recognition_level: Database["public"]["Enums"]["relic_recognition_level"]
          location_description: string
          established_date?: string | null
          short_description?: string | null
          historical_cultural_value?: string | null
          current_conservation_status?: Database["public"]["Enums"]["conservation_status"] | null
          protection_zone_details?: string | null
          management_unit_responsible?: string | null
          last_inspection_date?: string | null
          tourism_exploitation_status?: Database["public"]["Enums"]["relic_tourism_exploitation_status"] | null
          main_image_url?: string | null
          notes?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          relic_type?: Database["public"]["Enums"]["relic_type"]
          recognition_level?: Database["public"]["Enums"]["relic_recognition_level"]
          location_description?: string
          established_date?: string | null
          short_description?: string | null
          historical_cultural_value?: string | null
          current_conservation_status?: Database["public"]["Enums"]["conservation_status"] | null
          protection_zone_details?: string | null
          management_unit_responsible?: string | null
          last_inspection_date?: string | null
          tourism_exploitation_status?: Database["public"]["Enums"]["relic_tourism_exploitation_status"] | null
          main_image_url?: string | null
          notes?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "relics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          actual_effort_hours: number | null
          assignee_id: string | null
          completion_date: string | null
          coordinating_departments: string | null
          created_at: string
          department_responsible: string | null
          description: string | null
          due_date: string | null
          estimated_effort_hours: number | null
          id: string
          inspection_target: string | null 
          inventory_scope: string | null 
          monitored_entity_name: string | null 
          priority: Database["public"]["Enums"]["task_priority"]
          related_document_id: string | null
          related_event_id: string | null
          restoration_phase: string | null 
          start_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          task_category: Database["public"]["Enums"]["task_category"] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_effort_hours?: number | null
          assignee_id?: string | null
          completion_date?: string | null
          coordinating_departments?: string | null
          created_at?: string
          department_responsible?: string | null
          description?: string | null
          due_date?: string | null
          estimated_effort_hours?: number | null
          id?: string
          inspection_target?: string | null 
          inventory_scope?: string | null 
          monitored_entity_name?: string | null 
          priority: Database["public"]["Enums"]["task_priority"]
          related_document_id?: string | null
          related_event_id?: string | null
          restoration_phase?: string | null 
          start_date?: string | null
          status: Database["public"]["Enums"]["task_status"]
          task_category?: Database["public"]["Enums"]["task_category"] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_effort_hours?: number | null
          assignee_id?: string | null
          completion_date?: string | null
          coordinating_departments?: string | null
          created_at?: string
          department_responsible?: string | null
          description?: string | null
          due_date?: string | null
          estimated_effort_hours?: number | null
          id?: string
          inspection_target?: string | null 
          inventory_scope?: string | null 
          monitored_entity_name?: string | null 
          priority?: Database["public"]["Enums"]["task_priority"]
          related_document_id?: string | null
          related_event_id?: string | null
          restoration_phase?: string | null 
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_category?: Database["public"]["Enums"]["task_category"] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_document_id_fkey"
            columns: ["related_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tourism_documents: { // New table for Tourism Documents
        Row: {
          id: string
          title: string
          document_number: string
          document_category: Database["public"]["Enums"]["tourism_document_category"]
          issuing_organization: string
          issued_date: string
          effective_date: string | null
          expiry_date: string | null
          tourism_sector: Database["public"]["Enums"]["tourism_sector"] | null
          legal_basis: string | null
          summary: string | null
          applicable_entities: string | null
          tags: string[] | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          document_number: string
          document_category: Database["public"]["Enums"]["tourism_document_category"]
          issuing_organization: string
          issued_date: string
          effective_date?: string | null
          expiry_date?: string | null
          tourism_sector?: Database["public"]["Enums"]["tourism_sector"] | null
          legal_basis?: string | null
          summary?: string | null
          applicable_entities?: string | null
          tags?: string[] | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          document_number?: string
          document_category?: Database["public"]["Enums"]["tourism_document_category"]
          issuing_organization?: string
          issued_date?: string
          effective_date?: string | null
          expiry_date?: string | null
          tourism_sector?: Database["public"]["Enums"]["tourism_sector"] | null
          legal_basis?: string | null
          summary?: string | null
          applicable_entities?: string | null
          tags?: string[] | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tourism_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tourism_document_file_attachments: { // New table for Tourism Document File Attachments
        Row: {
          id: string
          tourism_document_id: string
          google_drive_file_id: string
          file_name: string
          mime_type: string
          size_bytes: number
          google_drive_webview_link: string
          google_drive_download_link: string | null
          version: number
          uploaded_at: string
          user_id: string
        }
        Insert: {
          id?: string
          tourism_document_id: string
          google_drive_file_id: string
          file_name: string
          mime_type: string
          size_bytes: number
          google_drive_webview_link: string
          google_drive_download_link?: string | null
          version?: number
          uploaded_at?: string
          user_id: string
        }
        Update: {
          id?: string
          tourism_document_id?: string
          google_drive_file_id?: string
          file_name?: string
          mime_type?: string
          size_bytes?: number
          google_drive_webview_link?: string
          google_drive_download_link?: string | null
          version?: number
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tourism_document_file_attachments_tourism_document_id_fkey"
            columns: ["tourism_document_id"]
            isOneToOne: false
            referencedRelation: "tourism_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tourism_document_file_attachments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tourism_document_relations: {
        Row: {
          id: string
          source_document_id: string
          related_document_id: string
          relation_type: Database["public"]["Enums"]["tourism_document_relation_type"]
          description: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          source_document_id: string
          related_document_id: string
          relation_type: Database["public"]["Enums"]["tourism_document_relation_type"]
          description?: string | null
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          source_document_id?: string
          related_document_id?: string
          relation_type?: Database["public"]["Enums"]["tourism_document_relation_type"]
          description?: string | null
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tourism_document_relations_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "tourism_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tourism_document_relations_related_document_id_fkey"
            columns: ["related_document_id"]
            isOneToOne: false
            referencedRelation: "tourism_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tourism_document_relations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      conservation_status: 
        | "Tốt"
        | "Cần tu bổ"
        | "Đang tu bổ"
        | "Xuống cấp nghiêm trọng"
        | "Mới phát hiện/khảo sát"
        | "Khác"
      document_relation_type: 
        | "Liên quan đến"
        | "Phụ thuộc vào"
        | "Là báo cáo cho"
        | "Là kế hoạch của"
        | "Được triển khai bởi"
        | "Tài liệu tham khảo cho"
      document_status: 
        | "Mới"
        | "Đang xử lý"
        | "Chờ phản hồi"
        | "Đã hoàn thành"
        | "Lưu trữ"
        | "Hủy"
      document_type: 
        | "Công văn đến"
        | "Công văn đi"
        | "Kế hoạch"
        | "Báo cáo"
        | "Tờ trình"
        | "Biên bản"
        | "Hợp đồng"
        | "Tài liệu tham khảo"
        | "Quyết định Phê duyệt" 
        | "Công văn Chỉ đạo" 
        | "Thuyết minh Dự án/Đề án" 
        | "Hồ sơ di tích"
        | "Quy hoạch phát triển"
        | "Đề án du lịch"
        | "Báo cáo khảo sát"
        | "Tài liệu nghiên cứu"
        | "Hồ sơ Dự án Quy hoạch/Kế hoạch" 
        | "Biên bản Kiểm kê Di tích" 
        | "Báo cáo Giám sát Hoạt động Du lịch" 
        | "Khác"
      event_status: 
        | "Đã lên kế hoạch"
        | "Đang chuẩn bị"
        | "Đang diễn ra"
        | "Hoàn thành"
        | "Huy bỏ"
      event_type: 
        | "Hội nghị"
        | "Hội thảo"
        | "Triển lãm"
        | "Chương trình xúc tiến"
        | "Lễ kỷ niệm"
        | "Lễ hội truyền thống"
        | "Sự kiện văn hóa nghệ thuật"
        | "Hội chợ xúc tiến du lịch"
        | "Chương trình quảng bá di sản"
        | "Hoạt động thể thao leo núi"
        | "Hội thảo khoa học (Di tích/Du lịch)" 
        | "Chương trình khảo sát thực địa/Famtrip" 
        | "Tọa đàm/Giao lưu" 
        | "Khác"
      priority: "Cao" | "Trung bình" | "Thấp"
      relic_recognition_level: 
        | "Quốc gia đặc biệt"
        | "Quốc gia"
        | "Cấp tỉnh"
        | "Chưa xếp hạng"
        | "Đề xuất xếp hạng"
      relic_tourism_exploitation_status: 
        | "Đang khai thác tốt"
        | "Khai thác hiệu quả thấp"
        | "Hạn chế khai thác"
        | "Ngừng khai thác"
        | "Tiềm năng, chưa khai thác"
        | "Đang nghiên cứu, xây dựng SP"
      relic_type: 
        | "Di tích kiến trúc nghệ thuật"
        | "Di tích lịch sử"
        | "Di tích khảo cổ"
        | "Danh lam thắng cảnh"
        | "Di tích lưu niệm sự kiện"
        | "Loại hình khác"
      task_category: 
        | "Soạn thảo"
        | "Trinh ký"
        | "Theo dõi"
        | "Tham mưu"
        | "Phối hợp"
        | "Báo cáo CV"
        | "Lưu trữ CV"
        | "Quản lý di tích (chung)" 
        | "Kiểm kê di tích" 
        | "Tu bổ/Tôn tạo di tích" 
        | "Giám sát hoạt động du lịch" 
        | "Phát triển du lịch"
        | "Tiếp thị & quảng bá"
        | "Hỗ trợ khách du lịch"
        | "Nghiên cứu khoa học (Di tích/Du lịch)" 
        | "Xây dựng sản phẩm du lịch" 
        | "Tham gia Dự án Quy hoạch/Kế hoạch" 
        | "Khác"
      task_priority: "Khẩn cấp" | "Cao" | "Trung bình" | "Thấp" 
      task_status: "Mới tạo" | "Đang thực hiện" | "Tạm dừng" | "Hoàn thành" | "Hủy bỏ"
      tourism_document_category: // New Enum
        | "Thông tư"
        | "Quyết định"
        | "Nghị định"
        | "Luật"
        | "Công văn hướng dẫn"
        | "Chỉ thị"
        | "Kế hoạch ngành"
        | "Báo cáo ngành"
        | "Tài liệu Hội thảo/Tập huấn ngành"
        | "Khác"
      tourism_sector: // New Enum
        | "Lữ hành"
        | "Lưu trú"
        | "Xúc tiến & Quảng bá"
        | "Vận chuyển du lịch"
        | "Khu/Điểm du lịch"
        | "Hướng dẫn viên"
        | "An toàn du lịch"
        | "Đào tạo nhân lực du lịch"
        | "Chính sách phát triển du lịch"
        | "Nghiên cứu du lịch"
        | "Lĩnh vực khác"
      tourism_document_relation_type: "LienQuanDen" | "ThayThe" | "BoSung" | "SuaDoi" | "HuyBo" | "Khac"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}