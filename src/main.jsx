import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Chess } from 'chess.js'
import './style.css'

const files = ['a','b','c','d','e','f','g','h']
const glyph = {
  p:'♟', n:'♞', b:'♝', r:'♜', q:'♛', k:'♚',
  P:'♙', N:'♘', B:'♗', R:'♖', Q:'♕', K:'♔'
}

const MOVES_PER_UCT = 20

function calculateMoves(uct) {
  return Math.max(0, Math.floor(Number(uct) * MOVES_PER_UCT))
}

const leaderboard = [
  ['1','NagaTimur','1.245 UCT','98%'],
  ['2','CaturManado','980 UCT','94%'],
  ['3','SphereKing','765 UCT','91%'],
  ['4','RajaPapan','620 UCT','88%'],
  ['5','KudaEmas','510 UCT','86%'],
  ['6','PemainBaru','420 UCT','82%'],
  ['7','Benteng99','355 UCT','79%'],
  ['8','SkakMat','290 UCT','76%']
]

async function connectSphere() {
  const { autoConnect } = await import('@unicitylabs/sphere-sdk/connect/browser')
  const { SPHERE_NETWORKS } = await import('@unicitylabs/sphere-sdk/connect')
  return autoConnect({
    dapp: {
      name: 'Sphere Chess',
      url: window.location.origin,
      icon: `${window.location.origin}/icon.svg`
    },
    network: SPHERE_NETWORKS.testnet2,
    permissions: ['identity:read', 'sign:request'],
    walletUrl: 'https://sphere.unicity.network',
    silent: true
  })
}

function App() {
  const [wallet, setWallet] = useState(null)
  const [game, setGame] = useState(() => new Chess())
  const [selected, setSelected] = useState(null)
  const [stake, setStake] = useState('5')
  const [difficulty, setDifficulty] = useState('Sedang')
  const [status, setStatus] = useState('Hubungkan Sphere Wallet untuk mulai bermain.')
  const [credits, setCredits] = useState(0)
  const [tab, setTab] = useState('permainan')

  const board = game.board()
  const turnText = game.turn() === 'w' ? 'Giliran Anda' : 'Komputer berpikir…'

  const identity = wallet?.nametag || wallet?.directAddress || wallet?.chainPubkey || 'Terhubung'

  async function handleConnect() {
    setStatus('Membuka Sphere Wallet…')
    try {
      const result = await connectSphere()
      setWallet(result.connection?.identity ?? result.identity ?? null)
      setStatus('Wallet berhasil terhubung. Silakan isi deposit untuk mendapatkan kredit langkah.')
    } catch (e) {
      setStatus(e?.message || 'Koneksi Sphere gagal. Coba lagi.')
    }
  }

  function depositDemo() {
    if (!wallet) return setStatus('Hubungkan Sphere Wallet terlebih dahulu.')
    const amount = Number(stake)
    if (!amount || amount < 5) return setStatus('Minimal deposit adalah 5 UCT.')
    setCredits(calculateMoves(amount))
    setStatus(`Deposit ${amount} UCT = ${calculateMoves(amount)} langkah. Konfirmasi transaksi dilakukan melalui Sphere Wallet.`)
  }

  function newGame() {
    setGame(new Chess())
    setSelected(null)
    setStatus(credits > 0 ? 'Permainan baru. Anda bermain sebagai putih.' : 'Isi deposit untuk mendapatkan kredit langkah.')
  }

  function makeComputerMove(nextGame) {
    const moves = nextGame.moves({ verbose: true })
    if (!moves.length) return
    // AI ringan untuk frontend: prioritaskan skak, tangkapan bernilai tinggi, lalu pilihan acak.
    const values = { p:1, n:3, b:3, r:5, q:9, k:100 }
    const scored = moves.map(m => {
      let score = Math.random() * 0.6
      if (m.san.includes('#')) score += 1000
      else if (m.san.includes('+')) score += 30
      if (m.captured) score += (values[m.captured] || 0) * 5
      if (m.promotion) score += 8
      return { m, score }
    }).sort((a,b) => b.score-a.score)
    const chosen = scored[0].m
    nextGame.move(chosen)
    setGame(new Chess(nextGame.fen()))
    if (nextGame.isCheckmate()) setStatus('Skakmat! Komputer menang.')
    else if (nextGame.isDraw()) setStatus('Permainan berakhir seri.')
    else setStatus('Giliran Anda.')
  }

  function clickSquare(row, col) {
    if (!wallet) return setStatus('Hubungkan Sphere Wallet terlebih dahulu.')
    if (credits <= 0) return setStatus('Anda belum memiliki kredit langkah. Isi deposit UCT terlebih dahulu.')
    if (game.turn() !== 'w') return

    const square = `${files[col]}${8-row}`
    if (!selected) {
      const piece = board[row][col]
      if (piece?.color === 'w') setSelected(square)
      return
    }

    const next = new Chess(game.fen())
    try {
      next.move({ from: selected, to: square, promotion: 'q' })
      setCredits(c => Math.max(0, c - 1))
      setSelected(null)
      setGame(new Chess(next.fen()))
      if (next.isCheckmate()) {
        setStatus('Anda menang! Skakmat komputer.')
        return
      }
      if (next.isDraw()) {
        setStatus('Permainan berakhir seri.')
        return
      }
      setStatus('Komputer sedang berpikir…')
      setTimeout(() => makeComputerMove(next), difficulty === 'Sulit' ? 700 : difficulty === 'Sedang' ? 450 : 250)
    } catch {
      setSelected(null)
      setStatus('Langkah tidak valid.')
    }
  }

  return (
    <main>
      <header className="topbar">
        <div>
          <div className="brand">♟ <span>Sphere Chess</span></div>
          <p>Permainan catur melawan komputer dengan UCT Testnet</p>
        </div>
        {!wallet ? (
          <button className="primary" onClick={handleConnect}>Hubungkan Sphere Wallet</button>
        ) : (
          <div className="wallet">✓ {String(identity).slice(0, 18)}{String(identity).length > 18 ? '…' : ''}</div>
        )}
      </header>

      <section className="hero">
        <h1>Main catur, kumpulkan kredit langkah, dan masuk papan peringkat.</h1>
        <p>Hubungkan Sphere Wallet, deposit UCT untuk kredit langkah, lalu bersaing di papan peringkat global dan mingguan. <b>50% dari seluruh deposit mingguan dialokasikan ke kumpulan hadiah untuk 5 pemain teratas.</b></p>
      </section>

      <nav className="tabs">
        <button className={tab==='permainan'?'active':''} onClick={()=>setTab('permainan')}>♟ Permainan</button>
        <button className={tab==='papan'?'active':''} onClick={()=>setTab('papan')}>🏆 Papan Peringkat</button>
      </nav>

      {tab === 'permainan' ? (
        <>
          <section className="panel controls">
            <div className="field"><label>Deposit UCT</label><div className="input-row"><input value={stake} onChange={e=>setStake(e.target.value)} inputMode="decimal" min="5" /><span>UCT</span></div><small className="hint">5 UCT = 100 langkah • 10 UCT = 200 langkah</small></div>
            <div className="field"><label>Tingkat komputer</label><select value={difficulty} onChange={e=>setDifficulty(e.target.value)}><option>Mudah</option><option>Sedang</option><option>Sulit</option></select></div>
            <button disabled={!wallet} onClick={depositDemo}>Deposit & Dapatkan Kredit</button>
            <button onClick={newGame}>Permainan Baru</button>
          </section>

          <div className="credit-line"><span>Kredit langkah: <b>{credits}</b></span><span className="network">Sphere Testnet 2</span></div>
          <p className="status">{status}</p>

          <section className="game-wrap">
            <div>
              <div className="playerbar"><span>Anda</span><b>Putih</b><span>{turnText}</span></div>
              <div className="board">
                {board.map((row,r)=>row.map((cell,c)=>{
                  const sq=`${files[c]}${8-r}`
                  const dark=(r+c)%2===1
                  return <button key={sq} className={`sq ${dark?'dark':'light'} ${selected===sq?'selected':''}`} onClick={()=>clickSquare(r,c)}>
                    {cell && <span className={cell.color==='w'?'white-piece':'black-piece'}>{glyph[cell.color==='w'?cell.type.toUpperCase():cell.type]}</span>}
                  </button>
                }))}
              </div>
              <div className="playerbar"><span>Komputer</span><b>Hitam</b><span>● Online</span></div>
            </div>

            <aside className="panel side">
              <h2>Informasi permainan</h2>
              <div className="stat"><span>Deposit</span><b>{stake} UCT</b></div>
              <div className="stat"><span>Langkah tersisa</span><b>{credits}</b></div>
              <div className="stat"><span>Tingkat</span><b>{difficulty}</b></div>
              <hr/>
              <h3>Kredit langkah</h3><p>Setiap 1 UCT = 20 langkah. Jadi 5 UCT = 100 langkah, 10 UCT = 200 langkah, 15 UCT = 300 langkah, dan seterusnya.</p><h3>Hadiah mingguan</h3>
              <p>50% dari deposit mingguan masuk ke kumpulan hadiah.</p>
              <p className="prize">🏆 5 pemain teratas</p>
              <small>Catatan: tombol deposit pada versi ini menyiapkan alur UI. Transfer UCT nyata, perhitungan pool, dan pembayaran hadiah membutuhkan backend/settlement on-chain yang aman.</small>
            </aside>
          </section>
        </>
      ) : (
        <section className="panel leaderboard">
          <div className="leader-head"><div><h2>🏆 Papan Peringkat</h2><p>Peringkat contoh untuk tampilan aplikasi.</p></div><div className="week">Minggu ini</div></div>
          <div className="pool"><span>Kumpulan hadiah mingguan</span><b>50% dari deposit mingguan</b></div>
          {leaderboard.map(([rank,name,prize,win])=><div className="rank" key={rank}><strong>#{rank}</strong><span className="avatar">{name[0]}</span><div><b>{name}</b><small>Rasio menang {win}</small></div><em>{prize}</em></div>)}
          <p className="footnote">5 peringkat teratas berhak atas pembagian kumpulan hadiah sesuai aturan game yang diterapkan pada backend.</p>
        </section>
      )}
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
