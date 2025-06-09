import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { TaskPriority, AISuggestedTask, Document, Task, Event, TaskStatus, FileAttachment } from '../types';
import { googleDriveService } from './googleDriveService';

// Get API key from window.env or fallback to empty string
const apiKey = (window as any).env?.API_KEY || '';

// Debug logs
console.log('Window env object:', (window as any).env);
console.log('API Key value:', apiKey);
console.log('API Key length:', apiKey.length);

let ai: GoogleGenAI | null = null;

if (!apiKey) {
  console.warn("Gemini API key (window.env.API_KEY) is not set. Gemini AI features will be disabled.");
} else {
  try {
    ai = new GoogleGenAI({ apiKey: apiKey });
    console.log('Successfully initialized GoogleGenAI');
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
    ai = null; // Ensure ai is null if initialization fails
  }
}

const TEXT_MODEL = 'gemini-2.0-flash';

// Hàm đọc nội dung file từ Google Drive
const readFileFromDrive = async (fileId: string): Promise<string> => {
  try {
    const { content } = await googleDriveService.readFile(fileId);
    return content || '';
  } catch (error) {
    console.error("Error reading file from Drive:", error);
    throw error;
  }
};

export const geminiService = {
  isAvailable: (): boolean => !!ai,

  summarizeDocument: async (documentContent: string, attachments?: FileAttachment[]): Promise<string> => {
    if (!ai) return "Gemini API chưa sẵn sàng. Vui lòng đảm bảo API key đã được cấu hình chính xác.";
    if (!documentContent.trim() && (!attachments || attachments.length === 0)) return "Không có nội dung để tóm tắt.";

    let fullContent = documentContent;

    // Đọc nội dung từ các file đính kèm
    if (attachments && attachments.length > 0) {
      const fileContents = await Promise.all(
        attachments.map(async (att) => {
          try {
            const content = await readFileFromDrive(att.google_drive_file_id);
            
            // Xử lý nội dung từ OCR
            let processedContent = content;
            if (att.mime_type === 'application/pdf') {
              // Loại bỏ các ký tự đặc biệt và định dạng không cần thiết
              processedContent = content
                .replace(/[^\p{L}\p{N}\s.,;:!?()\-]/gu, ' ') // Giữ lại chữ cái, số và dấu câu cơ bản
                .replace(/\s+/g, ' ') // Loại bỏ khoảng trắng thừa
                .trim();
            }
            
            return `\nNội dung file "${att.file_name}":\n${processedContent}`;
          } catch (error) {
            console.error(`Lỗi đọc file ${att.file_name}:`, error);
            return `\nKhông thể đọc nội dung file "${att.file_name}"`;
          }
        })
      );
      fullContent += fileContents.join('\n---\n');
    }

// Prompt tinh chỉnh dựa trên prompt gốc
const prompt = `Bạn là trợ lý AI chuyên tóm tắt văn bản cho Ban Quản lý Di tích Quốc gia Núi Bà Đen.
Nhiệm vụ của bạn là trích xuất các ý chính từ nội dung dưới đây.

Yêu cầu nghiêm ngặt:
1.  Chỉ trình bày những thông tin có trong văn bản.
2.  Tuyệt đối không thêm ý kiến, bình luận hay đề xuất.
3.  Trình bày các ý chính dưới dạng gạch đầu dòng.
4.  Giữ nguyên các thông tin quan trọng: số hiệu, ngày tháng, số liệu, tên riêng.
5.  Bỏ qua các lỗi định dạng hoặc ký tự không hợp lệ.

Nội dung cần tóm tắt:
${fullContent}

Hãy tóm tắt nội dung trên.`;

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: prompt,
        generationConfig: {
          temperature: 0.3, // Giảm nhiệt độ để tạo tóm tắt chính xác hơn
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 1024,
        }
      });
      return response.text || '';
    } catch (error) {
      console.error("Error summarizing document with Gemini:", error);
      return `Lỗi tóm tắt tài liệu: ${error instanceof Error ? error.message : String(error)}`;
    }
  },

  generateWeeklyTaskSuggestions: async (
    activeDocuments: Document[], 
    activeTasks: Task[], 
    upcomingEvents: Event[]
  ): Promise<AISuggestedTask[] | string> => {
    if (!ai) return "Gemini API chưa sẵn sàng. Vui lòng đảm bảo API key đã được cấu hình chính xác.";

    let context = "Bối cảnh công việc:\n";
    context += `Bạn là trợ lý AI cho Ban Quản lý Di tích Quốc gia Núi Bà Đen.\n`;

    if (activeDocuments.length > 0) {
      context += "\nVăn bản đang xử lý:\n";
      activeDocuments.forEach(doc => {
        context += `- \"${doc.title}\" (Số hiệu: ${doc.document_number}, Hạn: ${doc.due_date || 'N/A'}, Trạng thái: ${doc.status})\n`;
      });
    }

    if (activeTasks.length > 0) {
      context += "\nCông việc hiện tại:\n";
      activeTasks.forEach(task => {
        context += `- \"${task.title}\" (Ưu tiên: ${task.priority}, Hạn: ${task.due_date || 'N/A'}, Trạng thái: ${task.status})\n`;
      });
    }

    if (upcomingEvents.length > 0) {
      context += "\nSự kiện sắp tới:\n";
      upcomingEvents.forEach(event => {
        context += `- \"${event.name}\" (Loại: ${event.event_type}, Bắt đầu: ${event.start_datetime}, Địa điểm: ${event.location || 'N/A'})\n`;
      });
    }

    if (activeDocuments.length === 0 && activeTasks.length === 0 && upcomingEvents.length === 0) {
        context += "\nKhông có mục nào nổi bật. Hãy đề xuất các nhiệm vụ chủ động chung cho tuần tới.";
    }
    
    // Prompt tối ưu cho đề xuất nhiệm vụ
    const prompt = `Dựa trên thông tin sau:
${context}

Hãy đề xuất 3-5 nhiệm vụ quan trọng cho tuần tới. Mỗi nhiệm vụ gồm: tiêu đề, mô tả ngắn, mức độ ưu tiên (Khẩn cấp, Cao, Trung bình, Thấp), hạn xử lý (YYYY-MM-DD, nếu có). Trả về kết quả dưới dạng mảng JSON với các trường: title, description, priority, dueDate. Nếu không có nhiệm vụ cụ thể, hãy đề xuất các nhiệm vụ chủ động chung.`;

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      let jsonStr = (response.text || '').trim();
      const fenceRegex = /^\`\`\`(?:json)?\s*\n?(.*?)\n?\s*\`\`\`$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[1]) {
        jsonStr = match[1].trim();
      }
      
      const parsedData = JSON.parse(jsonStr) as AISuggestedTask[];
      // Validate structure slightly
      if (Array.isArray(parsedData) && parsedData.every(item => typeof item.title === 'string')) {
        return parsedData.map(task => ({
          ...task,
          priority: task.priority || TaskPriority.TrungBinh // Default priority if AI doesn't provide
        }));
      }
      console.error("Gemini response for task suggestions was not in the expected format:", parsedData);
      return "AI trả về dữ liệu không đúng định dạng mong muốn. Vui lòng kiểm tra console.";

    } catch (error) {
      console.error("Error generating task suggestions with Gemini:", error);
      return `Lỗi tạo gợi ý công việc: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
};
