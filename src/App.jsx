import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

// n8n API URL 
const API_BASE_URL = import.meta.env.VITE_N8N_URL;
const API = {
  GET: `${API_BASE_URL}/select-email`,
  DELETE: `${API_BASE_URL}/delete-email`,
  UPDATE: `${API_BASE_URL}/update-email`,
  CHAT: `${API_BASE_URL}/chat`, 
  SEND_REPLY: `${API_BASE_URL}/send-reply`,
  JOB_CRAWLER: `${API_BASE_URL}/job-crawler`,
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
  
  // ✨ 기본 탭을 '전체 메일(all)'로 변경
  const [activeTab, setActiveTab] = useState('all'); 
  const [newMemo, setNewMemo] = useState(''); 
  
  // 챗봇 상태
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { sender: 'bot', text: '안녕하세요! 이메일 비서입니다. 무엇을 도와드릴까요? (예: 이번 주 뉴스레터 요약해줘)' }
  ]);

  // 추천 채용공고 상태 관리
  const [jobs, setJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  // 2. 데이터 페칭 (이메일)
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

  // 채용공고 데이터 페칭 함수
  const fetchRecommendedJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const response = await axios.post(API.JOB_CRAWLER);
      
      let parsedJobs = [];

      // 1. 현재처럼 n8n이 깔끔한 배열을 바로 보내줄 경우
      if (Array.isArray(response.data) && response.data.length > 0 && response.data[0].rank) {
        parsedJobs = response.data;
      } 
      // 2. 예전처럼 깊은 구조 안에 text로 숨겨져서 올 경우 (혹시 모를 에러 방지용)
      else if (response.data[0]?.output?.[0]?.content?.[0]?.text) {
        const aiText = response.data[0].output[0].content[0].text;
        parsedJobs = JSON.parse(aiText);
      }

      setJobs(parsedJobs);
      
    } catch (error) {
      console.error('채용공고 로딩 실패:', error);
      alert('채용공고를 불러오는 데 실패했습니다. 콘솔 창을 확인해주세요.');
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // 채용공고 탭 진입 시 데이터 자동 로드
  useEffect(() => {
    if (activeTab === 'jobs' && jobs.length === 0) {
      fetchRecommendedJobs();
    }
  }, [activeTab]);


  // 3. 비즈니스 로직 (CRUD) - 기존 로직 유지
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

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userInput = chatInput;
    setChatHistory(prev => [...prev, { sender: 'user', text: userInput }]);
    setChatInput('');
    setChatHistory(prev => [...prev, { sender: 'bot', text: '최근 이메일들을 분석하고 있습니다... 🔍', isTemp: true }]);

    try {
      const response = await axios.post(API.CHAT, { message: userInput });
      const botReply = response.data.reply || "답변을 가져오는 데 문제가 발생했습니다.";
      setChatHistory(prev => {
        const filtered = prev.filter(msg => !msg.isTemp);
        return [...filtered, { sender: 'bot', text: botReply }];
      });
    } catch (error) {
      console.error("챗봇 에러:", error);
      setChatHistory(prev => {
        const filtered = prev.filter(msg => !msg.isTemp);
        return [...filtered, { sender: 'bot', text: '앗, n8n 서버와 통신 중 오류가 발생했어요. 워크플로우가 Active 상태인지 확인해 주세요! 😥' }];
      });
    }
  };

  const handleSendReply = async () => {
    if (!selectedEmail.draft_reply || !selectedEmail.draft_reply.trim()) {
      alert("보낼 답장 내용(초안)이 없습니다.");
      return;
    }
    if (!window.confirm("현재 작성된 초안으로 메일을 발송하시겠습니까?")) return;
    setIsProcessing(true);
    try {
      await axios.post(API.SEND_REPLY, {
        recipient_email: selectedEmail.sender_email, 
        subject: `Re: ${selectedEmail.title}`,       
        message: selectedEmail.draft_reply           
      });
      alert("메일이 성공적으로 발송되었습니다! 🚀");
      setIsEditing(false);
    } catch (error) {
      console.error("메일 발송 실패:", error);
      alert("메일 발송 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. 검색 및 탭 필터링 로직
  const filteredEmails = useMemo(() => {
    let tabFiltered = emails.filter(email => {
      if (activeTab === 'all') return true; 
      if (activeTab === 'action') {
        return email.category === '답장필요' || email.category === '답장 필요' || email.category === '일정 조율' || email.category === '비즈니스 문의';
      }
      if (activeTab === 'newsletter') return email.category === '뉴스레터' || email.category === 'IT 뉴스';
      return false; // jobs 탭일 때는 이메일 필터링 안 함
    });

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

  if (status.loading && activeTab !== 'jobs') {
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
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('all')}
            style={{ padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: activeTab === 'all' ? theme.primary : theme.card, color: activeTab === 'all' ? '#fff' : theme.textMuted, transition: '0.2s' }}
          >
            📂 전체 메일
          </button>
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
          {/* ✨ 채용공고 탭 추가 */}
          <button 
            onClick={() => setActiveTab('jobs')}
            style={{ padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: activeTab === 'jobs' ? theme.primary : theme.card, color: activeTab === 'jobs' ? '#fff' : theme.textMuted, transition: '0.2s' }}
          >
            🚀 AI 추천 채용공고
          </button>
        </div>

        {/* =======================================================
            [화면 분기점] '채용공고 탭' vs '이메일 탭(all, action, newsletter)' 
            ======================================================= */}
        
        {activeTab === 'jobs' ? (
          
          /* ✨ [채용공고 탭 UI] */
          <div style={{ backgroundColor: theme.card, borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>🎯 AI 맞춤 추천 공고 TOP 3</h2>
              <button 
                onClick={fetchRecommendedJobs}
                style={{ padding: '10px 20px', backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                🔄 새로고침
              </button>
            </div>

            {isLoadingJobs ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textMuted }}>
                <h3 style={{ margin: '0 0 10px 0' }}>AI가 수십 개의 공고를 분석 중입니다... 🤖🔍</h3>
                <p>약 10~20초 정도 소요될 수 있습니다. 잠시만 기다려주세요!</p>
              </div>
            ) : jobs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {jobs.map((job) => (
                  <div key={job.rank} style={{
                    border: `1px solid ${theme.border}`,
                    borderRadius: '12px',
                    padding: '24px',
                    backgroundColor: isDarkMode ? '#252525' : '#fff',
                    transition: 'transform 0.2s',
                  }}>
                    {/* 타이틀 영역 */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '36px', lineHeight: '1' }}>
                        {job.rank === 1 ? '🥇' : job.rank === 2 ? '🥈' : '🥉'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: theme.text, wordBreak: 'keep-all' }}>
                          {job.title}
                        </h3>
                        <span style={{ color: theme.primary, fontWeight: 'bold', fontSize: '16px' }}>
                          🏢 {job.company}
                        </span>
                      </div>
                      <div style={{ 
                        backgroundColor: isDarkMode ? '#3d1a25' : '#FFF0F5', 
                        color: '#E83E8C', 
                        padding: '8px 16px', 
                        borderRadius: '20px', 
                        fontWeight: 'bold',
                        fontSize: '15px'
                      }}>
                        매칭 {job.score}점
                      </div>
                    </div>

                    {/* 추천 사유 영역 */}
                    <div style={{ color: theme.text, fontSize: '15px', lineHeight: '1.6', backgroundColor: theme.bg, padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                      <strong style={{ display: 'inline-block', marginBottom: '6px', color: theme.primary }}>💡 AI 추천 사유:</strong><br />
                      {job.reason}
                    </div>

                    {/* 링크 버튼 */}
                    <a href={job.link} target="_blank" rel="noopener noreferrer" style={{
                      display: 'block',
                      padding: '14px',
                      backgroundColor: theme.primary,
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}>
                      👉 공고 상세보기 (사람인)
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textMuted }}>
                아직 추천된 공고가 없습니다. '새로고침' 버튼을 눌러주세요!
              </div>
            )}
          </div>

        ) : (

          /* ✉️ [이메일 탭 UI] */
          <>
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
          </>
        )}

        {/* =======================================================
            🌟 모달 및 챗봇 영역 
            ======================================================= */}
        
        {/* 모달 (상세/수정 - 답장 초안 추가) */}
        {selectedEmail && activeTab !== 'jobs' && (
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

              {/* 🌟 답장 초안 영역 */}
              {(selectedEmail.category === '답장필요' || selectedEmail.category === '답장 필요' || selectedEmail.draft_reply) && (
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

              {/* 🌟 메모 섹션 */}
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
                {!isEditing && selectedEmail.draft_reply && (
                  <button 
                    onClick={handleSendReply} 
                    disabled={isProcessing} 
                    style={{ flex: 1, padding: '14px', backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    🚀 이 초안으로 바로 답장하기
                  </button>
                )}
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
                  <div key={idx} style={{ alignSelf: chat.sender === 'user' ? 'flex-end' : 'flex-start', backgroundColor: chat.sender === 'user' ? theme.primary : theme.chatBg, color: chat.sender === 'user' ? 'white' : theme.text, padding: '10px 14px', borderRadius: '14px', maxWidth: '80%', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
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