import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Card, Typography, Spin, Avatar, Space } from 'antd';
import { MessageOutlined, CloseOutlined, SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import userApi from '../api/userApi';

const { Text, Title } = Typography;

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: 'Chào đồng chí! Tôi là Trợ lý AI của Chi bộ. Đồng chí có câu hỏi gì về công tác Đảng, quy trình hay cần liên hệ với ai không?',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg = inputValue.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await userApi.chatWithBot(userMsg);

      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: response.data.reply },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      let errorMsg = 'Xin lỗi, có lỗi xảy ra khi kết nối. Vui lòng thử lại sau.';
      if (error.response && error.response.status === 429) {
        errorMsg = 'Hệ thống AI đang bị quá tải (vượt quá giới hạn miễn phí). Vui lòng báo cho Quản trị viên thay API Key hoặc thử lại sau nhé.';
      }
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: errorMsg, isError: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Nút bấm hình tròn mở Chatbot */}
      {!isOpen && (
        <Button
          type="default"
          shape="circle"
          size="large"
          icon={<MessageOutlined style={{ fontSize: '28px', color: '#a91f23' }} />} // Icon màu đỏ đậm
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '60px',
            height: '60px',
            zIndex: 9999,
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)',
            backgroundColor: '#fff1aa', // Nền màu vàng (giống màu Header)
            borderColor: '#a91f23', // Viền đỏ mỏng để nổi bật
            borderWidth: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      )}

      {/* Cửa sổ Chatbot */}
      {isOpen && (
        <Card
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '380px',
            height: '550px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
          styles={{
            body: {
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              backgroundColor: '#a91f23',
              color: '#fff1aa', // Vàng sao
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Space>
              <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#fff1aa', color: '#a91f23' }} />
              <div>
                <Title level={5} style={{ margin: 0, color: '#fff' }}>
                  Trợ lý Chi bộ AI
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>Luôn sẵn sàng hỗ trợ</Text>
              </div>
            </Space>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setIsOpen(false)}
              style={{ color: '#fff' }}
            />
          </div>

          {/* Message Area */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              backgroundColor: '#f5f7fa',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: '8px',
                }}
              >
                {msg.role === 'bot' && (
                  <Avatar size="small" icon={<RobotOutlined />} style={{ backgroundColor: '#a91f23', flexShrink: 0 }} />
                )}
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: '16px',
                    backgroundColor: msg.role === 'user' ? '#1677ff' : '#fff',
                    color: msg.role === 'user' ? '#fff' : (msg.isError ? '#cf1322' : '#000'),
                    borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                    borderBottomLeftRadius: msg.role === 'bot' ? '4px' : '16px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    minWidth: 0,
                  }}
                >
                  {msg.role === 'user' ? (
                    <Text style={{ color: '#fff', wordBreak: 'break-word' }}>{msg.content}</Text>
                  ) : (
                    <div className="markdown-body" style={{
                      fontSize: '14px',
                      color: 'inherit',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }}>
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: '#1677ff',
                                wordBreak: 'break-all',
                                overflowWrap: 'break-word',
                                display: 'inline-block',
                                maxWidth: '100%'
                              }}
                            >
                              {children}
                            </a>
                          )
                        }}
                      >{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Avatar size="small" icon={<RobotOutlined />} style={{ backgroundColor: '#a91f23' }} />
                <Spin size="small" />
                <Text type="secondary" style={{ fontSize: '12px' }}>Đang suy nghĩ...</Text>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid #f0f0f0',
            backgroundColor: '#fff',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '8px'
          }}>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi trợ lý AI... (Shift+Enter để gửi)"
              rows={1}
              style={{
                flex: 1,
                borderRadius: '20px',
                border: '1px solid #d9d9d9',
                padding: '8px 14px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none',
                overflowY: 'auto',
                maxHeight: '120px',
                minHeight: '38px',
                lineHeight: '1.5',
                wordWrap: 'break-word',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#a91f23'}
              onBlur={(e) => e.target.style.borderColor = '#d9d9d9'}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              style={{
                backgroundColor: inputValue.trim() ? '#a91f23' : '#d9d9d9',
                borderColor: 'transparent',
                flexShrink: 0,
                marginBottom: '2px'
              }}
            />
          </div>
        </Card>
      )}
    </>
  );
};

export default FloatingChatbot;
