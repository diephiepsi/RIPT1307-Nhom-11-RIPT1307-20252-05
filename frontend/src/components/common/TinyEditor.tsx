import { Editor } from '@tinymce/tinymce-react';

const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY ?? '';

type TinyEditorProps = {
  value?: string;
  onChange?: (html: string) => void;
};

/** Rich text (TinyMCE) — cần VITE_TINYMCE_API_KEY trong frontend/.env */
export function TinyEditor({ value = '', onChange }: TinyEditorProps) {
  if (!TINYMCE_API_KEY) {
    return (
      <div style={{ padding: 12, border: '1px dashed var(--color-accent)', borderRadius: 8, background: 'var(--color-surface)' }}>
        Thiếu API key TinyMCE. Thêm vào <code>frontend/.env</code>:<br />
        <code>VITE_TINYMCE_API_KEY=9vdql462mzulq7sd182n06zk9l0vpqez8j69exuifwnvijyd</code>
        <br />
        Lấy key miễn phí tại:{' '}
        <a href="https://www.tiny.cloud/auth/signup/" target="_blank" rel="noreferrer">
          tiny.cloud
        </a>
      </div>
    );
  }

  return (
    <Editor
      apiKey={TINYMCE_API_KEY}
      value={value}
      onEditorChange={(html) => onChange?.(html)}
      init={{
        height: 320,
        menubar: false,
        branding: false,
        promotion: false,
        plugins: ['lists', 'link', 'code', 'table'],
        toolbar: 'undo redo | bold italic underline | bullist numlist | link table | code',
        placeholder: 'Nhập nội dung câu hỏi...',
      }}
    />
  );
}
