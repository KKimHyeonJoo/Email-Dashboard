import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

// API URL
const API_BASE_URL = import.meta.env.VITE_N8N_URL;
const API = {
  GET: `${API_BASE_URL}/select-email`,
  DELETE: `${API_BASE_URL}/delete-email`,
  UPDATE: `${API_BASE_URL}/update-email`,
};

function App() {
  // 1. 상태 관리 (State Management)
  const [emails, setEmails] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // 🌟 새롭게 추가된 댓글 입력 상태
  const [newComment, setNewComment] = useState('');

  // 2. 데이터 페칭 (Data Fetching)
  const fetchData = async () => {
    setStatus({ loading: true, error: null });
    try {
      const response = await axios.get(API.GET);
      const rawData = response.data;
      const data = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);
      // DB에서 넘어온 comments 데이터가 문자열일 경우 배열로 파싱하는 방어적 로직 추가
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
    if (!window.confirm("정말로 이 요약을 삭제하시겠습니까?")) return;
    
    setIsProcessing(true);
    try {
      await axios.delete(API.DELETE, { params: { id } });
      setEmails(prev => prev.filter(e => e.id !== id));
      alert("삭제되었습니다.");
    } catch (e) {
      console.error("삭제 실패:", e);
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
      // API 전송 시 객체를 넘김 (n8n에서 comments 필드를 받을 수 있어야 함)
      await axios.post(API.UPDATE, selectedEmail);
      alert("성공적으로 수정되었습니다!");
      setIsEditing(false);
      fetchData(); 
    } catch (e) {
      console.error("수정 실패:", e);
      alert("수정 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 🌟 댓글 등록 로직
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const commentObj = {
      id: Date.now(),
      text: newComment,
      createdAt: new Date().toLocaleString('ko-KR', { hour12: false })
    };

    // 기존 selectedEmail에 새 댓글 추가
    const updatedEmail = {
      ...selectedEmail,
      comments: [...(selectedEmail.comments || []), commentObj]
    };

    // 모달창 UI 즉시 업데이트
    setSelectedEmail(updatedEmail);
    setNewComment('');

    setIsProcessing(true);
    try {
      // 서버로 즉시 업데이트 전송 (저장 버튼을 따로 누르지 않아도 바로 저장되도록 UX 구성)
      await axios.post(API.UPDATE, updatedEmail);
      fetchData(); // 백그라운드에서 전체 데이터 최신화
    } catch (e) {
      console.error("댓글 저장 실패:", e);
      alert("댓글 저장 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 🌟 댓글 삭제 로직
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("이 댓글을 삭제하시겠습니까?")) return;

    const updatedEmail = {
      ...selectedEmail,
      comments: (selectedEmail.comments || []).filter(c => c.id !== commentId)
    };

    setSelectedEmail(updatedEmail);

    setIsProcessing(true);
    try {
      await axios.post(API.UPDATE, updatedEmail);
      fetchData();
    } catch (e) {
      console.error("댓글 삭제 실패:", e);
      alert("댓글 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. 검색 필터링 최적화
  const filteredEmails = useMemo(() => {
    const lowerCaseTerm = searchTerm.toLowerCase();
    return emails.filter(email => 
      (email.title?.toLowerCase() || "").includes(lowerCaseTerm) ||
      (email.summary?.toLowerCase() || "").includes(lowerCaseTerm) ||
      (email.category?.toLowerCase() || "").includes(lowerCaseTerm)
    );
  }, [searchTerm, emails]);

  // 5. 테마 설정 (디자인 토큰)
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
  };

  // 6. 렌더링 영역
  if (status.loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: theme.bg, color: theme.text }}>
        <h2>데이터를 불러오는 중입니다... 🚀</h2>
      </div>
    );
  }

  if (status.error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: theme.danger }}>
        <h2>앗, 문제가 발생했습니다! 🚨</h2>
        <p>{status.error}</p>
        <button onClick={fetchData} style={{ padding: '10px 20px', cursor: 'pointer' }}>다시 시도</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', backgroundColor: theme.bg, color: theme.text, minHeight: '100vh', transition: 'background-color 0.3s', fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* 헤더 섹션 */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: 0, fontSize: '28px' }}>📧 AI 메일 요약보드 <span style={{ fontSize: '16px', color: theme.textMuted }}>({filteredEmails.length}건)</span></h1>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            style={{ padding: '10px 16px', cursor: 'pointer', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.card, color: theme.text, fontWeight: 'bold', transition: '0.2s' }}
          >
            {isDarkMode ? '🌞 라이트 모드' : '🌙 다크 모드'}
          </button>
        </header>

        {/* 검색 섹션 */}
        <div style={{ marginBottom: '24px' }}>
          <input 
            type="text" 
            placeholder="제목, 내용, 카테고리로 검색해보세요..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '16px 20px', borderRadius: '12px', border: `1px solid ${theme.border}`, fontSize: '16px', backgroundColor: theme.card, color: theme.text, boxSizing: 'border-box', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', outline: 'none' }}
          />
        </div>

        {/* 테이블 섹션 */}
        <div style={{ backgroundColor: theme.card, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: theme.primary, color: 'white' }}>
                <th style={{ padding: '18px 20px', fontWeight: '600' }}>제목</th>
                <th style={{ padding: '18px 20px', fontWeight: '600', width: '120px' }}>카테고리</th>
                <th style={{ padding: '18px 20px', fontWeight: '600', width: '100px', textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmails.length > 0 ? (
                filteredEmails.map(email => (
                  <tr key={email.id} style={{ borderBottom: `1px solid ${theme.border}`, transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#2a2a2a' : '#f8fbfc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td onClick={() => { setSelectedEmail(email); setIsEditing(false); setNewComment(''); }} style={{ padding: '18px 20px', cursor: 'pointer', fontWeight: '500' }}>
                      {email.priority === 'High' && (
                        <span style={{ marginRight: '8px' }} title="중요 메일">⭐</span>
                      )}
                      {email.title}
                      {/* 제목 옆에 댓글 갯수 배지 추가 */}
                      {email.comments && email.comments.length > 0 && (
                         <span style={{ marginLeft: '8px', fontSize: '12px', backgroundColor: theme.border, padding: '2px 8px', borderRadius: '10px' }}>
                           💬 {email.comments.length}
                         </span>
                      )}
                    </td>
                    <td style={{ padding: '18px 20px' }}>
                      <span style={{ backgroundColor: isDarkMode ? '#333' : '#eef2f5', padding: '6px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', color: theme.primary }}>
                        {email.category || '미분류'}
                      </span>
                    </td>
                    <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDelete(email.id)} 
                        disabled={isProcessing}
                        style={{ color: theme.danger, border: `1px solid ${theme.danger}`, background: 'transparent', padding: '6px 12px', borderRadius: '6px', cursor: isProcessing ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 'bold', opacity: isProcessing ? 0.5 : 1 }}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ padding: '50px', textAlign: 'center', color: theme.textMuted }}>
                    일치하는 메일이 없습니다. 텅~ 🌬️
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 모달 (상세/수정) */}
        {selectedEmail && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            {/* 모달 크기를 키우고 스크롤 가능하게 변경 */}
            <div style={{ backgroundColor: theme.card, padding: '40px', borderRadius: '20px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>
                  {isEditing ? "📝 내용 수정" : "📋 메일 상세 정보"}
                  {selectedEmail.priority === 'High' && <span style={{ marginLeft: '10px', fontSize: '24px' }}>⭐</span>}
                </h2>
                <span style={{ backgroundColor: theme.primary, color: 'white', padding: '4px 12px', borderRadius: '15px', fontSize: '14px' }}>{selectedEmail.category}</span>
              </div>
              
              <hr style={{ borderColor: theme.border, marginBottom: '24px' }} />
              
              {/* 메일 상세 내용 영역 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: theme.textMuted, marginBottom: '8px', fontWeight: 'bold' }}>제목</label>
                {isEditing ? 
                  <input style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text, fontSize: '16px', boxSizing: 'border-box' }} value={selectedEmail.title} onChange={e => setSelectedEmail({...selectedEmail, title: e.target.value})} /> 
                  : <div style={{ fontSize: '18px', fontWeight: '600', lineHeight: '1.4' }}>{selectedEmail.title}</div>
                }
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: theme.textMuted, marginBottom: '8px', fontWeight: 'bold' }}>요약 내용</label>
                {isEditing ? 
                  <textarea style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text, fontSize: '16px', minHeight: '150px', boxSizing: 'border-box', resize: 'vertical' }} value={selectedEmail.summary} onChange={e => setSelectedEmail({...selectedEmail, summary: e.target.value})} /> 
                  : <div style={{ fontSize: '16px', lineHeight: '1.6', whiteSpace: 'pre-wrap', backgroundColor: isDarkMode ? '#222' : '#f8f9fa', padding: '20px', borderRadius: '12px' }}>{selectedEmail.summary}</div>
                }
              </div>

              {/* 댓글 섹션 시작 */}
              {!isEditing && (
                <div style={{ backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', margin: '0 0 16px 0', borderBottom: `1px solid ${theme.border}`, paddingBottom: '10px' }}>💬 팀 메모 / 댓글</h3>
                  
                  {/* 댓글 목록 */}
                  <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                    {selectedEmail.comments && selectedEmail.comments.length > 0 ? (
                      selectedEmail.comments.map(comment => (
                        <div key={comment.id} style={{ backgroundColor: theme.bg, padding: '12px', borderRadius: '8px', fontSize: '14px', position: 'relative', textAlign: 'left' }}>
                          <p style={{ margin: '0 0 4px 0', lineHeight: '1.5' }}>{comment.text}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: theme.textMuted }}>{comment.createdAt}</span>
                            <button onClick={() => handleDeleteComment(comment.id)} style={{ background: 'none', border: 'none', color: theme.danger, cursor: 'pointer', fontSize: '12px', padding: 0 }}>삭제</button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: '14px', color: theme.textMuted, textAlign: 'center', margin: '10px 0' }}>아직 등록된 메모가 없습니다.</p>
                    )}
                  </div>

                  {/* 댓글 입력창 */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="메일과 관련된 메모를 남겨보세요..." 
                      value={newComment} 
                      onChange={e => setNewComment(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                      style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.card, color: theme.text, outline: 'none' }}
                    />
                    <button 
                      onClick={handleAddComment}
                      disabled={isProcessing || !newComment.trim()}
                      style={{ padding: '0 16px', backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '6px', cursor: (!newComment.trim() || isProcessing) ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                    >
                      등록
                    </button>
                  </div>
                </div>
              )}
              {/* 댓글 섹션 끝 */}

              {/* 하단 버튼 그룹 */}
              <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                {isEditing ? (
                  <button onClick={handleUpdate} disabled={isProcessing} style={{ flex: 1, padding: '14px', backgroundColor: theme.success, color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: isProcessing ? 'not-allowed' : 'pointer', opacity: isProcessing ? 0.7 : 1 }}>
                    {isProcessing ? '저장 중...' : '저장하기'}
                  </button>
                ) : (
                  <button onClick={() => setIsEditing(true)} style={{ flex: 1, padding: '14px', backgroundColor: theme.warning, color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                    수정하기
                  </button>
                )}
                <button onClick={() => { setSelectedEmail(null); setIsEditing(false); setNewComment(''); }} disabled={isProcessing} style={{ flex: 1, padding: '14px', backgroundColor: theme.textMuted, color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                  닫기
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;