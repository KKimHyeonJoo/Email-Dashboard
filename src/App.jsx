import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

// n8n API URL 
const API_BASE_URL = import.meta.env.VITE_N8N_URL;
const API = {
  GET: `${API_BASE_URL}/select-email`,
  DELETE: `${API_BASE_URL}/delete-email`,
  UPDATE: `${API_BASE_URL}/update-email`,
  CHAT: `${API_BASE_URL}/rag-chatbot`, 
};

function App() {
  // 1. 상태 관리
  const [emails, setEmails] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('action');
  const [newMemo, setNewMemo] = useState(''); 
  
  // 챗봇 상태
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { sender: 'bot', text: '안녕하세요! 이메일 비서입니다. 무엇을 도와드릴까요? (예: 이번 주 뉴스레터 요약해줘)' }
  ]);

  // 2. 데이터 페칭
  const fetchData = async () => {
    setStatus({ loading: true, error: null });
    try {
      const response = await axios.get(API.GET);
      const rawData = response.data;
      const data = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);
      const parsedData = data.map(item => ({
        ...item,
        comments: typeof item.comments === 'string' ? JSON.parse(item.comments || '[]') : (item.comments || [])
      }));
      setEmails(parsedData);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
      setStatus({ loading: false, error: "데이터를 불러오는 데 실패했습니다." });
    } finally {
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 3. 비즈니스 로직 (CRUD)
  const handleDelete = async (id) => {
    if (!window.confirm("정말로 이 메일을 삭제하시겠습니까?")) return;
    setIsProcessing(true);
    try {
      await axios.delete(API.DELETE, { params: { id } });
      setEmails(prev => prev.filter(e => e.id !== id));
      alert("삭제되었습니다.");
    } catch (e) {
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedEmail.title.trim() || !selectedEmail.summary.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }
    setIsProcessing(true);
    try {
      await axios.post(API.UPDATE, selectedEmail);
      alert("성공적으로 수정되었습니다!");
      setIsEditing(false);
      fetchData(); 
    } catch (e) {
      alert("수정 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 메모(댓글) 등록 로직
  const handleAddMemo = async () => {
    if (!newMemo.trim()) return;
    const memoObj = {
      id: Date.now(),
      text: newMemo,
      createdAt: new Date().toLocaleString('ko-KR', { hour12: false })
    };
    const updatedEmail = {
      ...selectedEmail,
      comments: [...(selectedEmail.comments || []), memoObj]
    };
    setSelectedEmail(updatedEmail);
    setNewMemo('');
    setIsProcessing(true);
    try {
      await axios.post(API.UPDATE, updatedEmail);
      fetchData();
    } catch (e) {
      alert("메모 저장 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 메모 삭제 로직
  const handleDeleteMemo = async (memoId) => {
    if (!window.confirm("이 메모를 삭제하시겠습니까?")) return;
    const updatedEmail = {
      ...selectedEmail,
      comments: (selectedEmail.comments || []).filter(c => c.id !== memoId)
    };
    setSelectedEmail(updatedEmail);
    setIsProcessing(true);
    try {
      await axios.post(API.UPDATE, updatedEmail);
      fetchData();
    } catch (e) {
      alert("메모 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 챗봇 메시지 전송 (n8n RAG 연동 실시간 답변)
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userInput = chatInput;
    // 1. 내가 보낸 메시지 화면에 즉시 표시
    setChatHistory(prev => [...prev, { sender: 'user', text: userInput }]);
    setChatInput('');
    
    // 2. 챗봇이 생각 중이라는 로딩 표시 추가
    setChatHistory(prev => [...prev, { 
      sender: 'bot', 
      text: '최근 이메일들을 분석하고 있습니다... 🔍', 
      isTemp: true 
    }]);

    try {
      // 3. n8n의 /chat Webhook으로 실제 질문 전송
      const response = await axios.post(API.CHAT, { message: userInput });
      
      // 4. n8n Respond to Webhook 노드에서 설정한 'reply' 값을 가져옴
      const botReply = response.data.reply || "답변을 가져오는 데 문제가 발생했습니다.";

      // 5. 로딩 메시지를 지우고 진짜 AI 답변으로 교체
      setChatHistory(prev => {
        const filtered = prev.filter(msg => !msg.isTemp);
        return [...filtered, { sender: 'bot', text: botReply }];
      });
    } catch (error) {
      console.error("챗봇 에러:", error);
      setChatHistory(prev => {
        const filtered = prev.filter(msg => !msg.isTemp);
        return [...filtered, { 
          sender: 'bot', 
          text: '앗, n8n 서버와 통신 중 오류가 발생했어요. 워크플로우가 Active 상태인지 확인해 주세요! 😥' 
        }];
      });
    }
  };

  // 4. 검색 및 탭 필터링
  const filteredEmails = useMemo(() => {
    // 1차 필터링: 탭에 따라 분류 (n8n에서 category를 '답장필요' / '뉴스레터' 등으로 분류해준다고 가정)
    let tabFiltered = emails.filter(email => {
      if (activeTab === 'action') return email.category === '답장필요';
      if (activeTab === 'newsletter') return email.category === '뉴스레터';
      return true;
    });

    // 2차 필터링: 검색어 적용
    const lowerCaseTerm = searchTerm.toLowerCase();
    return tabFiltered.filter(email => 
      (email.title?.toLowerCase() || "").includes(lowerCaseTerm) ||
      (email.summary?.toLowerCase() || "").includes(lowerCaseTerm)
    );
  }, [searchTerm, emails, activeTab]);

  // 5. 테마 설정
  const theme = {
    bg: isDarkMode ? '#121212' : '#f4f7f6',
    card: isDarkMode ? '#1e1e1e' : '#ffffff',
    text: isDarkMode ? '#e0e0e0' : '#2c3e50',
    textMuted: isDarkMode ? '#aaa' : '#7f8c8d',
    border: isDarkMode ? '#333' : '#e0e6ed',
    primary: '#4A90E2',
    danger: '#e74c3c',
    success: '#2ecc71',
    warning: '#f39c12',
    chatBg: isDarkMode ? '#2c2c2c' : '#e9f0f8',
  };

  if (status.loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: theme.bg, color: theme.text }}><h2>데이터를 불러오는 중입니다... 🚀</h2></div>;
  }

  return (
    <div style={{ padding: '40px 20px', backgroundColor: theme.bg, color: theme.text, minHeight: '100vh', transition: 'background-color 0.3s', fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* 헤더 섹션 */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: 0, fontSize: '28px' }}>📧 AI Agent 대시보드</h1>
          <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ padding: '10px 16px', cursor: 'pointer', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.card, color: theme.text, fontWeight: 'bold' }}>
            {isDarkMode ? '🌞 라이트 모드' : '🌙 다크 모드'}
          </button>
        </header>

        {/* 🌟 탭(Tab) 메뉴 섹션 */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={() => setActiveTab('action')}
            style={{ padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: activeTab === 'action' ? theme.primary : theme.card, color: activeTab === 'action' ? '#fff' : theme.textMuted, transition: '0.2s' }}
          >
            ⚡ 답장 필요 메일
          </button>
          <button 
            onClick={() => setActiveTab('newsletter')}
            style={{ padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: activeTab === 'newsletter' ? theme.primary : theme.card, color: activeTab === 'newsletter' ? '#fff' : theme.textMuted, transition: '0.2s' }}
          >
            📰 뉴스레터 모음
          </button>
        </div>

        {/* 검색 섹션 */}
        <div style={{ marginBottom: '24px' }}>
          <input type="text" placeholder="제목이나 내용으로 검색해보세요..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '16px 20px', borderRadius: '12px', border: `1px solid ${theme.border}`, fontSize: '16px', backgroundColor: theme.card, color: theme.text, boxSizing: 'border-box', outline: 'none' }} />
        </div>

        {/* 테이블 섹션 */}
        <div style={{ backgroundColor: theme.card, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: theme.primary, color: 'white' }}>
                <th style={{ padding: '18px 20px', fontWeight: '600' }}>제목</th>
                <th style={{ padding: '18px 20px', fontWeight: '600', width: '100px', textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmails.length > 0 ? (
                filteredEmails.map(email => (
                  <tr key={email.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td onClick={() => { setSelectedEmail(email); setIsEditing(false); setNewMemo(''); }} style={{ padding: '18px 20px', cursor: 'pointer', fontWeight: '500' }}>
                      {email.priority === 'High' && <span style={{ marginRight: '8px' }}>⭐</span>}
                      {email.title}
                      {email.comments && email.comments.length > 0 && (
                         <span style={{ marginLeft: '8px', fontSize: '12px', backgroundColor: theme.border, padding: '2px 8px', borderRadius: '10px' }}>📝 {email.comments.length}</span>
                      )}
                    </td>
                    <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                      <button onClick={() => handleDelete(email.id)} disabled={isProcessing} style={{ color: theme.danger, border: `1px solid ${theme.danger}`, background: 'transparent', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>삭제</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" style={{ padding: '50px', textAlign: 'center', color: theme.textMuted }}>
                    해당하는 메일이 없습니다. ✨
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 🌟 모달 (상세/수정 - 답장 초안 추가) */}
        {selectedEmail && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: theme.card, padding: '40px', borderRadius: '20px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>{isEditing ? "📝 내용 수정" : "📋 메일 상세 정보"}</h2>
                <span style={{ backgroundColor: theme.primary, color: 'white', padding: '4px 12px', borderRadius: '15px', fontSize: '14px' }}>{selectedEmail.category}</span>
              </div>
              <hr style={{ borderColor: theme.border, marginBottom: '24px' }} />
              
              {/* 제목 & 요약 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: theme.textMuted, marginBottom: '8px', fontWeight: 'bold' }}>제목</label>
                {isEditing ? <input style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text, boxSizing: 'border-box' }} value={selectedEmail.title} onChange={e => setSelectedEmail({...selectedEmail, title: e.target.value})} /> : <div style={{ fontSize: '18px', fontWeight: '600' }}>{selectedEmail.title}</div>}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: theme.textMuted, marginBottom: '8px', fontWeight: 'bold' }}>요약 내용</label>
                {isEditing ? <textarea style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text, minHeight: '100px', boxSizing: 'border-box' }} value={selectedEmail.summary} onChange={e => setSelectedEmail({...selectedEmail, summary: e.target.value})} /> : <div style={{ fontSize: '16px', lineHeight: '1.6', whiteSpace: 'pre-wrap', backgroundColor: isDarkMode ? '#222' : '#f8f9fa', padding: '16px', borderRadius: '12px' }}>{selectedEmail.summary}</div>}
              </div>

              {/* 🌟 답장 초안 영역 (답장필요 탭일 때만 또는 draft_reply 데이터가 있을 때만 표시) */}
              {(selectedEmail.category === '답장필요' || selectedEmail.draft_reply) && (
                <div style={{ marginBottom: '30px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: theme.primary, marginBottom: '8px', fontWeight: 'bold' }}>
                    🤖 AI 답장 초안
                  </label>
                  {isEditing ? 
                    <textarea style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text, minHeight: '120px', boxSizing: 'border-box' }} value={selectedEmail.draft_reply || ''} onChange={e => setSelectedEmail({...selectedEmail, draft_reply: e.target.value})} /> 
                    : <div style={{ fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-wrap', backgroundColor: theme.chatBg, border: `1px solid ${theme.primary}50`, padding: '16px', borderRadius: '12px', color: theme.text }}>{selectedEmail.draft_reply || '생성된 답장 초안이 없습니다.'}</div>
                  }
                </div>
              )}

              {/* 🌟 메모(기존 댓글) 섹션 */}
              {!isEditing && (
                <div style={{ backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', margin: '0 0 16px 0', borderBottom: `1px solid ${theme.border}`, paddingBottom: '10px' }}>📝 메모</h3>
                  <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '150px', overflowY: 'auto' }}>
                    {selectedEmail.comments && selectedEmail.comments.length > 0 ? (
                      selectedEmail.comments.map(memo => (
                        <div key={memo.id} style={{ backgroundColor: theme.bg, padding: '12px', borderRadius: '8px', fontSize: '14px' }}>
                          <p style={{ margin: '0 0 4px 0' }}>{memo.text}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: theme.textMuted }}>{memo.createdAt}</span>
                            <button onClick={() => handleDeleteMemo(memo.id)} style={{ background: 'none', border: 'none', color: theme.danger, cursor: 'pointer', fontSize: '12px' }}>삭제</button>
                          </div>
                        </div>
                      ))
                    ) : <p style={{ fontSize: '14px', color: theme.textMuted, textAlign: 'center' }}>등록된 메모가 없습니다.</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" placeholder="메모를 남겨보세요..." value={newMemo} onChange={e => setNewMemo(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddMemo()} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.card, color: theme.text, outline: 'none' }} />
                    <button onClick={handleAddMemo} disabled={isProcessing || !newMemo.trim()} style={{ padding: '0 16px', backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>등록</button>
                  </div>
                </div>
              )}

              {/* 하단 버튼 그룹 */}
              <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                {isEditing ? (
                  <button onClick={handleUpdate} disabled={isProcessing} style={{ flex: 1, padding: '14px', backgroundColor: theme.success, color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>저장하기</button>
                ) : (
                  <button onClick={() => setIsEditing(true)} style={{ flex: 1, padding: '14px', backgroundColor: theme.warning, color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>수정하기</button>
                )}
                <button onClick={() => { setSelectedEmail(null); setIsEditing(false); setNewMemo(''); }} disabled={isProcessing} style={{ flex: 1, padding: '14px', backgroundColor: theme.textMuted, color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>닫기</button>
              </div>

            </div>
          </div>
        )}

        {/* 🌟 우측 하단 챗봇 (Chatbot) 위젯 */}
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 999 }}>
          {isChatOpen ? (
            <div style={{ width: '350px', height: '500px', backgroundColor: theme.card, borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
              <div style={{ backgroundColor: theme.primary, padding: '16px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>🤖 AI 이메일 비서</span>
                <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✖</button>
              </div>
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: theme.bg }}>
                {chatHistory.map((chat, idx) => (
                  <div key={idx} style={{ alignSelf: chat.sender === 'user' ? 'flex-end' : 'flex-start', backgroundColor: chat.sender === 'user' ? theme.primary : theme.chatBg, color: chat.sender === 'user' ? 'white' : theme.text, padding: '10px 14px', borderRadius: '14px', maxWidth: '80%', fontSize: '14px', lineHeight: '1.4' }}>
                    {chat.text}
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px', backgroundColor: theme.card, borderTop: `1px solid ${theme.border}`, display: 'flex', gap: '8px' }}>
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="질문을 입력하세요..." style={{ flex: 1, padding: '10px', borderRadius: '20px', border: `1px solid ${theme.border}`, outline: 'none', backgroundColor: theme.bg, color: theme.text }} />
                <button onClick={handleSendMessage} style={{ backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>➤</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setIsChatOpen(true)} style={{ width: '60px', height: '60px', borderRadius: '30px', backgroundColor: theme.primary, color: 'white', border: 'none', fontSize: '28px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(74, 144, 226, 0.4)' }}>
              💬
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;