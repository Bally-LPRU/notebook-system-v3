import React, { useState, useRef, useCallback } from 'react';

const RichTextEditor = ({
  value,
  onChange,
  placeholder = 'เริ่มพิมพ์...',
  disabled = false,
  error = null,
  className = '',
  id,
  name,
  maxLength = 1000,
  showToolbar = true,
  minHeight = '120px'
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const editorRef = useRef(null);

  // Update word count
  const updateWordCount = useCallback((text) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, []);

  // Handle content change
  const handleChange = (e) => {
    const newValue = e.target.value;
    
    // Check max length
    if (maxLength && newValue.length > maxLength) {
      return;
    }
    
    onChange(newValue);
    updateWordCount(newValue);
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
  };

  // Format text functions
  const insertText = (before, after = '') => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  // Toolbar actions
  const toolbarActions = [
    {
      name: 'bold',
      icon: 'B',
      title: 'ตัวหนา',
      action: () => insertText('**', '**'),
      className: 'font-bold'
    },
    {
      name: 'italic',
      icon: 'I',
      title: 'ตัวเอียง',
      action: () => insertText('*', '*'),
      className: 'italic'
    },
    {
      name: 'underline',
      icon: 'U',
      title: 'ขีดเส้นใต้',
      action: () => insertText('<u>', '</u>'),
      className: 'underline'
    },
    {
      name: 'divider',
      type: 'divider'
    },
    {
      name: 'bullet',
      icon: '•',
      title: 'รายการแบบจุด',
      action: () => insertText('\n• ', ''),
    },
    {
      name: 'number',
      icon: '1.',
      title: 'รายการแบบตัวเลข',
      action: () => insertText('\n1. ', ''),
    },
    {
      name: 'divider',
      type: 'divider'
    },
    {
      name: 'link',
      icon: '🔗',
      title: 'ลิงก์',
      action: () => insertText('[', '](url)'),
    }
  ];

  // Initialize word count
  React.useEffect(() => {
    updateWordCount(value || '');
  }, [value, updateWordCount]);

  return (
    <div className={`relative ${className}`}>
      {/* Toolbar */}
      {showToolbar && (
        <div className={`border border-gray-300 border-b-0 rounded-t-md bg-gray-50 px-3 py-2 flex items-center space-x-1 ${
          disabled ? 'opacity-50' : ''
        }`}>
          {toolbarActions.map((action, index) => {
            if (action.type === 'divider') {
              return (
                <div key={`divider-${index}`} className="w-px h-6 bg-gray-300 mx-1" />
              );
            }

            return (
              <button
                key={action.name}
                type="button"
                onClick={action.action}
                disabled={disabled}
                title={action.title}
                className={`px-2 py-1 text-sm rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed ${
                  action.className || ''
                }`}
              >
                {action.icon}
              </button>
            );
          })}
        </div>
      )}

      {/* Editor */}
      <div className="relative">
        <textarea
          ref={editorRef}
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`block w-full sm:text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 ${
            showToolbar ? 'rounded-b-md rounded-t-none' : 'rounded-md'
          } ${error ? 'border-red-300' : ''} resize-none`}
          style={{ minHeight }}
          rows={6}
        />

        {/* Character/Word count */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-1 rounded">
          {value?.length || 0}/{maxLength} ตัวอักษร • {wordCount} คำ
        </div>
      </div>

      {/* Preview mode toggle */}
      {isFocused && value && (
        <div className="mt-2">
          <details className="group">
            <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
              ดูตัวอย่าง
            </summary>
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm">
              <div 
                dangerouslySetInnerHTML={{
                  __html: value
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
                    .replace(/\n• /g, '<br>• ')
                    .replace(/\n\d+\. /g, '<br>1. ')
                    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 underline">$1</a>')
                    .replace(/\n/g, '<br>')
                }}
              />
            </div>
          </details>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default RichTextEditor;