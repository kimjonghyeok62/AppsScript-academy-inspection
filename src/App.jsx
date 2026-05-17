import { useState } from 'react'
import './App.css'
import { fetchAcademyFromNeis } from './utils/neisApi'
import { printTuitionForm, printTuitionFormExternal } from './utils/generateTuitionPDF'

export default function App() {
  const [searchName, setSearchName] = useState('')
  const [founderName, setFounderName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [academy, setAcademy] = useState(null)

  const canSearch = searchName.trim() && founderName.trim()

  async function handleSearch(e) {
    e.preventDefault()
    if (!canSearch) return

    setLoading(true)
    setError('')
    setAcademy(null)

    try {
      const result = await fetchAcademyFromNeis({ name: searchName.trim(), apiKey: apiKey.trim() })
      result.founder = { name: founderName.trim() }
      setAcademy(result)
    } catch (err) {
      setError(err.message || '조회 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setAcademy(null)
    setError('')
  }

  return (
    <div className="app-container">
      <div className="app-header">
        <h1 className="app-title">교습비등 게시표 출력</h1>
        <p className="app-subtitle">경기도 학원·교습소 교습비 공시 정보 조회 및 게시표 출력</p>
      </div>

      <div className="card">
        <div className="card-title">학원 정보 조회</div>

        <form onSubmit={handleSearch}>
          <div className="form-group">
            <label className="form-label">시도교육청</label>
            <div
              className="form-input"
              style={{ background: '#f1f5f9', color: 'var(--text-muted)', cursor: 'default' }}
            >
              경기도교육청
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">학원(교습소)명 *</label>
            <input
              className="form-input"
              type="text"
              placeholder="학원명을 입력하세요"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">학원설립운영자(교습자)명 *</label>
            <input
              className="form-input"
              type="text"
              placeholder="설립운영자 또는 교습자 이름"
              value={founderName}
              onChange={(e) => setFounderName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">NEIS API 키 (선택)</label>
            <input
              className="form-input"
              type="text"
              placeholder="open.neis.go.kr에서 발급 (없으면 비워두세요)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="hint">API 키 없이도 하루 500건까지 조회 가능합니다.</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="search-actions">
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={!canSearch || loading}
            >
              {loading ? <span className="spinner" /> : '🔍'} NEIS에서 조회
            </button>
          </div>
        </form>
      </div>

      {academy && (
        <div className="card animate-enter">
          <div className="card-title">조회 결과</div>

          <div className="academy-info">
            <div className="academy-info-name">{academy.name}</div>
            <div className="academy-info-meta">
              {academy.category && <span>{academy.category}</span>}
              {academy.address && <span> · {academy.address}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">등록(신고)번호</label>
            <input
              className="form-input"
              type="text"
              placeholder="등록번호를 직접 입력하세요 (NEIS에서 제공되지 않음)"
              value={academy.regNo || ''}
              onChange={(e) => setAcademy({ ...academy, regNo: e.target.value })}
            />
            <p className="hint">NEIS API는 등록(신고)번호를 제공하지 않습니다. 허가증을 확인하여 직접 입력해주세요.</p>
          </div>

          {academy.courses && academy.courses.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div className="section-divider">교습과정 정보</div>
              {academy.courses.map((c, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--bg-light)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '8px',
                    fontSize: '0.88rem',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{c.subject || c.process || '(과목명 없음)'}</span>
                  {c.tuitionFee && (
                    <span style={{ color: 'var(--primary)', marginLeft: '10px' }}>
                      {c.tuitionFee}원
                      {c.period && ` / ${c.period}`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="section-divider">게시표 출력</div>

          <div className="print-actions">
            <button
              className="btn btn-primary"
              onClick={() => printTuitionForm(academy)}
            >
              <div className="print-btn-inner">
                <span className="print-btn-label">🖨 내부용 출력</span>
                <span className="print-btn-sub">별지 제4호서식</span>
              </div>
            </button>
            <button
              className="btn btn-outline"
              onClick={() => printTuitionFormExternal(academy)}
            >
              <div className="print-btn-inner">
                <span className="print-btn-label">📋 외부용 출력</span>
                <span className="print-btn-sub">옥외가격표시제</span>
              </div>
            </button>
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={handleReset}>
              다시 조회
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
