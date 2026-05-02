import streamlit as st
import sqlite3
import pandas as pd
from datetime import datetime, date, timedelta
import plotly.express as px
import plotly.graph_objects as go
import hashlib
import time

# ─────────────────────────────────────────────────────────────────────────────
#  CONFIG PAGE
# ─────────────────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="RAMA 2026 – Pilotage",
    layout="wide",
    page_icon="🏛️",
    initial_sidebar_state="expanded",
)

# ─────────────────────────────────────────────────────────────────────────────
#  CSS GLOBAL
# ─────────────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');

/* ═══════════════════════════════════════════════════════════
   PALETTE — violet profond, zéro blanc
   bg-deep   : #0d0020   (fond le plus sombre)
   bg-mid    : #1a0038   (fond principal)
   bg-surface: rgba(255,255,255,0.06)  (cartes verre)
   accent    : #a020f0   (violet vif)
   accent2   : #7c3aed   (violet bouton)
   text-main : #f0e6ff   (titres)
   text-body : #e0ccff   (corps)
   text-muted: #b899e8   (secondaire)
═══════════════════════════════════════════════════════════ */

/* ── RESET GLOBAL ── */
*, *::before, *::after { box-sizing: border-box; }

html, body {
    font-family: 'Inter', 'Poppins', sans-serif !important;
    background: #0d0020 !important;
    color: #e0ccff !important;
    margin: 0; padding: 0;
}

/* ── FOND PRINCIPAL — violet profond avec halos ── */
[data-testid="stAppViewContainer"] {
    background:
        radial-gradient(ellipse at 18% 25%,  rgba(160,32,240,0.50) 0%, transparent 52%),
        radial-gradient(ellipse at 82% 15%,  rgba(90,0,210,0.40)  0%, transparent 48%),
        radial-gradient(ellipse at 55% 78%,  rgba(70,0,170,0.35)  0%, transparent 52%),
        radial-gradient(ellipse at 8%  85%,  rgba(175,0,255,0.28) 0%, transparent 48%),
        radial-gradient(ellipse at 90% 70%,  rgba(120,0,220,0.22) 0%, transparent 45%),
        linear-gradient(150deg, #0d0020 0%, #190035 20%, #280058 45%, #1d004c 70%, #110025 100%) !important;
    min-height: 100vh;
}

/* ── TOUT fond natif Streamlit → transparent ── */
[data-testid="stMain"],
[data-testid="stMainBlockContainer"],
[data-testid="stVerticalBlock"],
[data-testid="stHorizontalBlock"],
[data-testid="stColumn"],
[data-testid="stColumns"],
[data-testid="stElementContainer"],
[data-testid="stForm"] > div,
[data-testid="stExpander"] > div > div,
.main, .block-container,
section > div, div[class*="block"] {
    background: transparent !important;
}

/* ── HEADER BARRE TOP ── */
[data-testid="stHeader"] {
    background: rgba(13,0,32,0.80) !important;
    backdrop-filter: blur(14px) !important;
    border-bottom: 1px solid rgba(160,32,240,0.22) !important;
}
[data-testid="stToolbar"],
[data-testid="stDecoration"],
[data-testid="stDeployButton"],
[data-testid="stStatusWidget"] {
    background: transparent !important;
}
.main .block-container {
    padding-top: 1.8rem;
    max-width: 1400px;
}

/* ── ANIMATIONS ── */
@keyframes fadeInUp {
    from { opacity:0; transform:translateY(18px); }
    to   { opacity:1; transform:translateY(0); }
}
@keyframes fadeIn {
    from { opacity:0; }
    to   { opacity:1; }
}

/* ══════════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════════ */
[data-testid="stSidebar"] {
    background:
        radial-gradient(ellipse at 40% 15%, rgba(140,0,220,0.30) 0%, transparent 60%),
        linear-gradient(170deg, #080016 0%, #100028 40%, #1c0048 80%, #140038 100%) !important;
    border-right: 1px solid rgba(160,32,240,0.18) !important;
    box-shadow: 4px 0 32px rgba(90,0,200,0.22) !important;
}
[data-testid="stSidebar"] > div { background: transparent !important; }

/* tous les textes sidebar */
[data-testid="stSidebar"],
[data-testid="stSidebar"] *,
[data-testid="stSidebar"] p,
[data-testid="stSidebar"] span,
[data-testid="stSidebar"] label,
[data-testid="stSidebar"] div { color: #e8d8ff !important; }

[data-testid="stSidebar"] .stSelectbox label,
[data-testid="stSidebar"] .stTextInput label {
    color: #b899e8 !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
}
[data-testid="stSidebar"] input,
[data-testid="stSidebar"] select,
[data-testid="stSidebar"] [data-baseweb="input"] > div,
[data-testid="stSidebar"] [data-baseweb="select"] > div {
    background: rgba(255,255,255,0.06) !important;
    border: 1px solid rgba(160,32,240,0.25) !important;
    color: #f0e6ff !important;
    border-radius: 10px !important;
}

/* Boutons nav sidebar */
div[data-testid="stSidebar"] div.stButton > button {
    width: 100%;
    background: rgba(255,255,255,0.04) !important;
    border: 1px solid rgba(160,32,240,0.15) !important;
    color: #d8b8ff !important;
    border-radius: 12px !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    padding: 11px 16px !important;
    text-align: left !important;
    transition: all 0.3s ease !important;
    margin-bottom: 4px !important;
}
div[data-testid="stSidebar"] div.stButton > button:hover {
    background: linear-gradient(90deg, rgba(160,32,240,0.28), rgba(80,0,200,0.18)) !important;
    border-color: rgba(160,32,240,0.5) !important;
    transform: translateX(5px) !important;
    color: #ffffff !important;
    box-shadow: 0 4px 16px rgba(140,0,240,0.30) !important;
}
div[data-testid="stSidebar"] div.stButton:last-child > button {
    background: rgba(239,68,68,0.10) !important;
    border-color: rgba(239,68,68,0.25) !important;
    color: #fca5a5 !important;
}
div[data-testid="stSidebar"] div.stButton:last-child > button:hover {
    background: rgba(239,68,68,0.22) !important;
    border-color: rgba(239,68,68,0.50) !important;
}

/* ══════════════════════════════════════════════
   KPI CARDS
══════════════════════════════════════════════ */
.kpi-card {
    background: rgba(255,255,255,0.06);
    backdrop-filter: blur(16px);
    border-radius: 18px;
    padding: 22px 20px 18px;
    border: 1px solid rgba(200,150,255,0.15);
    border-top: 4px solid #a855f7;
    box-shadow: 0 4px 24px rgba(100,0,200,0.20), inset 0 1px 0 rgba(255,255,255,0.06);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    animation: fadeInUp 0.5s ease both;
}
.kpi-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(160,32,240,0.35), inset 0 1px 0 rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.09);
}
.kpi-card.green  { border-top-color: #10b981; }
.kpi-card.red    { border-top-color: #f87171; }
.kpi-card.orange { border-top-color: #fb923c; }
.kpi-card.blue   { border-top-color: #60a5fa; }
.kpi-card.purple { border-top-color: #c084fc; }
.kpi-label { font-size:10.5px; color:#b899e8; font-weight:700; text-transform:uppercase; letter-spacing:0.7px; margin-bottom:8px; }
.kpi-value { font-size:2.1rem; font-weight:800; color:#f0e6ff; font-family:'Poppins',sans-serif; line-height:1; letter-spacing:-0.5px; text-shadow:0 0 20px rgba(200,150,255,0.35); }
.kpi-sub   { font-size:11px; color:#9878cc; margin-top:6px; font-weight:500; }

/* ── SECTION TITLE ── */
.section-title {
    font-family: 'Poppins', sans-serif;
    font-size: 1.3rem;
    font-weight: 700;
    color: #f0e6ff;
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 12px;
    border-bottom: 2px solid transparent;
    border-image: linear-gradient(90deg, #a855f7, #3b82f6, transparent) 1;
    margin-bottom: 22px;
    text-shadow: 0 0 16px rgba(200,150,255,0.28);
}

/* ── ROLE BADGES ── */
.role-badge { display:inline-block; padding:4px 14px; border-radius:30px; font-size:10px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; }
.role-ca    { background:rgba(254,243,199,0.12); color:#fde68a; border:1px solid rgba(253,230,138,0.28); }
.role-dg    { background:rgba(96,165,250,0.12);  color:#93c5fd; border:1px solid rgba(96,165,250,0.28); }
.role-chef  { background:rgba(16,185,129,0.12);  color:#6ee7b7; border:1px solid rgba(16,185,129,0.28); }
.role-agent { background:rgba(192,132,252,0.12); color:#e9d5ff; border:1px solid rgba(192,132,252,0.28); }

/* ── NOTIF CARDS ── */
.notif-card {
    background: rgba(255,255,255,0.05);
    backdrop-filter: blur(12px);
    border-radius: 12px;
    padding: 16px 18px;
    margin-bottom: 10px;
    border: 1px solid rgba(200,150,255,0.10);
    border-left: 4px solid #7c3aed;
    box-shadow: 0 2px 16px rgba(100,0,200,0.12);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    animation: fadeInUp 0.4s ease;
}
.notif-card:hover { transform:translateX(4px); box-shadow:0 6px 24px rgba(160,32,240,0.22); background:rgba(255,255,255,0.08); }
.notif-card * { color:#e0ccff !important; }
.notif-card.urgent { border-left-color:#f87171; background:rgba(248,113,113,0.07); }
.notif-card.warn   { border-left-color:#fb923c; background:rgba(251,146,60,0.07); }
.notif-card.info   { border-left-color:#60a5fa; background:rgba(96,165,250,0.07); }

/* ── FEED / IDEA CARDS ── */
.feed-card, .idea-card {
    background: rgba(255,255,255,0.05);
    backdrop-filter: blur(12px);
    border-radius: 14px;
    padding: 16px 18px;
    margin-bottom: 12px;
    border: 1px solid rgba(200,150,255,0.12);
    box-shadow: 0 2px 14px rgba(100,0,200,0.10);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    animation: fadeInUp 0.4s ease;
}
.feed-card:hover, .idea-card:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(160,32,240,0.22); background:rgba(255,255,255,0.08); }
.feed-card *, .idea-card * { color:#e0ccff !important; }

/* ── CHIPS ── */
.chip-ok   { background:rgba(16,185,129,0.18);  color:#6ee7b7; border:1px solid rgba(16,185,129,0.32);  padding:4px 12px; border-radius:30px; font-size:12px; font-weight:700; }
.chip-late { background:rgba(248,113,113,0.18); color:#fca5a5; border:1px solid rgba(248,113,113,0.32); padding:4px 12px; border-radius:30px; font-size:12px; font-weight:700; }
.chip-warn { background:rgba(251,191,36,0.18);  color:#fde68a; border:1px solid rgba(251,191,36,0.32);  padding:4px 12px; border-radius:30px; font-size:12px; font-weight:700; }
.chip-na   { background:rgba(200,150,255,0.10); color:#c4a8f0; border:1px solid rgba(200,150,255,0.20); padding:4px 12px; border-radius:30px; font-size:12px; font-weight:500; }

/* ── LOGIN CARD ── */
.login-card {
    max-width: 440px;
    margin: 0 auto;
    background: rgba(255,255,255,0.05);
    backdrop-filter: blur(24px);
    border-radius: 24px;
    padding: 44px 40px;
    border: 1px solid rgba(200,150,255,0.18);
    box-shadow: 0 8px 60px rgba(100,0,200,0.32), 0 0 0 1px rgba(200,150,255,0.10);
    animation: fadeInUp 0.6s ease;
}

/* ══════════════════════════════════════════════
   BOUTONS PRINCIPAUX
══════════════════════════════════════════════ */
div.stButton > button,
button[kind="primary"],
button[kind="secondary"] {
    background: linear-gradient(135deg, #7c3aed, #4f46e5) !important;
    color: #fff !important;
    border: 1px solid rgba(200,150,255,0.25) !important;
    border-radius: 10px !important;
    font-weight: 600 !important;
    font-size: 13.5px !important;
    padding: 10px 20px !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 4px 18px rgba(124,58,237,0.35) !important;
}
div.stButton > button:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 28px rgba(160,32,240,0.48) !important;
    background: linear-gradient(135deg, #9333ea, #6366f1) !important;
}

/* ══════════════════════════════════════════════
   INPUTS / SELECTS / TEXTAREA
══════════════════════════════════════════════ */
input, textarea, select,
[data-baseweb="input"] > div,
[data-baseweb="base-input"],
[data-baseweb="select"] > div,
[data-baseweb="textarea"] > div,
div[data-baseweb="input"],
div[data-baseweb="textarea"],
.stTextInput input,
.stTextArea textarea,
.stSelectbox select,
[data-testid="stNumberInput"] input,
[data-testid="stDateInput"] input {
    background: rgba(255,255,255,0.07) !important;
    color: #f0e6ff !important;
    border: 1.5px solid rgba(200,150,255,0.22) !important;
    border-radius: 10px !important;
}
input:focus, textarea:focus {
    border-color: #a855f7 !important;
    box-shadow: 0 0 0 3px rgba(168,85,247,0.18) !important;
    outline: none !important;
}
/* Placeholder */
input::placeholder, textarea::placeholder { color: #9878cc !important; }

/* Labels */
label,
.stTextInput label, .stSelectbox label,
.stTextArea label, .stSlider label,
.stMultiSelect label, .stDateInput label,
.stNumberInput label, .stCheckbox label,
.stRadio label {
    color: #c4a8f0 !important;
    font-weight: 500 !important;
}

/* ── DROPDOWN / POPOVER ── */
[data-baseweb="popover"],
[data-baseweb="menu"],
ul[data-baseweb="menu"],
[role="listbox"],
[data-baseweb="select"] [role="listbox"] {
    background: #1a0040 !important;
    border: 1px solid rgba(200,150,255,0.20) !important;
    border-radius: 12px !important;
}
[role="option"],
[data-baseweb="menu"] li {
    color: #e0ccff !important;
    background: transparent !important;
}
[role="option"]:hover,
[data-baseweb="menu"] li:hover {
    background: rgba(168,85,247,0.20) !important;
    color: #f0e6ff !important;
}

/* Texte dans select affiché */
[data-baseweb="select"] span,
[data-baseweb="select"] div,
[data-baseweb="select"] [data-testid="stMarkdownContainer"] {
    color: #f0e6ff !important;
    background: transparent !important;
}

/* Multiselect tags */
[data-baseweb="tag"] {
    background: rgba(168,85,247,0.22) !important;
    color: #e9d5ff !important;
    border: 1px solid rgba(200,150,255,0.28) !important;
    border-radius: 20px !important;
}
[data-baseweb="tag"] span { color: #e9d5ff !important; }

/* ══════════════════════════════════════════════
   DATAFRAME / TABLEAUX
══════════════════════════════════════════════ */
[data-testid="stDataFrame"],
[data-testid="stDataFrame"] > div,
.stDataFrame, .stDataFrame > div {
    background: transparent !important;
    border-radius: 12px !important;
    overflow: hidden !important;
}
.glide-data-grid,
.glide-data-grid-container {
    background: rgba(255,255,255,0.04) !important;
    border-radius: 10px !important;
}
.dataframe thead tr th {
    background: rgba(160,32,240,0.22) !important;
    color: #e9d5ff !important;
    font-weight: 700 !important;
    font-size: 12px !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
    padding: 10px 14px !important;
    border-bottom: 1px solid rgba(200,150,255,0.22) !important;
}
.dataframe tbody tr { background: rgba(255,255,255,0.03) !important; }
.dataframe tbody tr:hover { background: rgba(160,32,240,0.12) !important; }
.dataframe tbody td { color: #e0ccff !important; border-bottom: 1px solid rgba(200,150,255,0.07) !important; }

[data-testid="stTable"] table,
[data-testid="stTable"] thead,
[data-testid="stTable"] tbody { background: rgba(255,255,255,0.04) !important; }
[data-testid="stTable"] th { background: rgba(160,32,240,0.22) !important; color: #e9d5ff !important; border-bottom: 1px solid rgba(200,150,255,0.22) !important; }
[data-testid="stTable"] td { color: #e0ccff !important; border-bottom: 1px solid rgba(200,150,255,0.07) !important; }
[data-testid="stTable"] tr:hover td { background: rgba(168,85,247,0.10) !important; }

/* ══════════════════════════════════════════════
   EXPANDER / TABS / FORM
══════════════════════════════════════════════ */
[data-testid="stExpander"],
details {
    background: rgba(255,255,255,0.04) !important;
    border: 1px solid rgba(200,150,255,0.14) !important;
    border-radius: 12px !important;
}
.streamlit-expanderHeader,
details > summary {
    background: rgba(255,255,255,0.05) !important;
    color: #d8b4fe !important;
    font-weight: 600 !important;
    border-radius: 12px !important;
    padding: 12px 16px !important;
    border: none !important;
}
.streamlit-expanderHeader:hover, details > summary:hover {
    background: rgba(255,255,255,0.09) !important;
}

[data-testid="stTabs"],
[data-baseweb="tab-list"] {
    background: rgba(255,255,255,0.04) !important;
    border-bottom: 1px solid rgba(200,150,255,0.18) !important;
    border-radius: 10px 10px 0 0 !important;
}
[data-baseweb="tab"] {
    background: transparent !important;
    color: #c4a8f0 !important;
}
[data-baseweb="tab"][aria-selected="true"] {
    color: #f0e6ff !important;
    border-bottom: 2px solid #a855f7 !important;
    background: rgba(168,85,247,0.14) !important;
}
[data-baseweb="tab-panel"] { background: transparent !important; }

[data-testid="stForm"] {
    background: rgba(255,255,255,0.04) !important;
    border: 1px solid rgba(200,150,255,0.14) !important;
    border-radius: 16px !important;
    padding: 20px !important;
}

/* ── METRICS ── */
[data-testid="stMetric"] {
    background: rgba(255,255,255,0.06) !important;
    backdrop-filter: blur(12px) !important;
    border-radius: 14px !important;
    padding: 16px !important;
    border: 1px solid rgba(200,150,255,0.14) !important;
    box-shadow: 0 2px 16px rgba(100,0,200,0.15) !important;
}
[data-testid="stMetricLabel"] { color: #c4a8f0 !important; font-weight: 700 !important; font-size: 12px !important; }
[data-testid="stMetricValue"] { color: #f0e6ff !important; font-family: 'Poppins', sans-serif !important; font-weight: 800 !important; }
[data-testid="stMetricDelta"] { color: #6ee7b7 !important; }

/* ── ALERTS ── */
[data-testid="stAlert"],
div[data-baseweb="notification"] {
    background: rgba(255,255,255,0.06) !important;
    backdrop-filter: blur(8px) !important;
    border-radius: 12px !important;
    border: 1px solid rgba(200,150,255,0.18) !important;
    color: #e0ccff !important;
}
[data-testid="stAlert"] * { color: #e0ccff !important; }

/* ── PROGRESS BAR ── */
.stProgress > div {
    background: rgba(255,255,255,0.10) !important;
    border-radius: 99px !important;
}
.stProgress > div > div {
    background: linear-gradient(90deg, #a855f7, #3b82f6) !important;
    border-radius: 99px !important;
}

/* ── SLIDER ── */
[data-testid="stSlider"] > div > div { background: rgba(255,255,255,0.10) !important; }

/* ── MARKDOWN & TEXTES ── */
p, span, div, li, td, th, small,
.stMarkdown p, .stMarkdown li,
[data-testid="stMarkdownContainer"] p,
[data-testid="stMarkdownContainer"] li,
[data-testid="stMarkdownContainer"] { color: #e0ccff !important; }
h1, h2, h3, h4, h5, h6,
.stMarkdown h1, .stMarkdown h2, .stMarkdown h3 { color: #f0e6ff !important; }
a { color: #c084fc !important; }
a:hover { color: #e9d5ff !important; }
code { background: rgba(168,85,247,0.14) !important; color: #e9d5ff !important; border-radius:4px; padding:2px 6px; }

/* ── DIVIDER ── */
hr { border:none; border-top:1px solid rgba(200,150,255,0.18); margin:20px 0; }

/* ── TOOLTIP ── */
[role="tooltip"], .tooltip {
    background: #1a0040 !important;
    border: 1px solid rgba(200,150,255,0.20) !important;
    color: #e0ccff !important;
    border-radius: 8px !important;
}

/* ── SCROLLBAR ── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.38); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(168,85,247,0.60); }

/* ── RADIO / CHECKBOX ── */
[data-baseweb="radio"] label,
[data-baseweb="checkbox"] label { color: #d8b4fe !important; }

</style>
""", unsafe_allow_html=True)

# ─────────────────────────────────────────────────────────────────────────────
#  BASE DE DONNÉES – MLD COMPLET
# ─────────────────────────────────────────────────────────────────────────────
DB_PATH = "rama2026.db"

@st.cache_resource
def get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

conn = get_conn()

def run(sql, params=()):
    conn.execute(sql, params)
    conn.commit()

def fetch(sql, params=()):
    return conn.execute(sql, params).fetchall()

def fetchdf(sql, params=()):
    return pd.read_sql_query(sql, conn, params=params)

def init_db():
    conn.executescript("""
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS Service (
        id_service   INTEGER PRIMARY KEY AUTOINCREMENT,
        nom          TEXT NOT NULL UNIQUE,
        description  TEXT
    );

    CREATE TABLE IF NOT EXISTS Activite (
        id_activite          INTEGER PRIMARY KEY AUTOINCREMENT,
        type_activite        TEXT NOT NULL,
        description          TEXT,
        date_debut_prevue    DATE,
        date_debut_reel      DATE,
        date_fin_prevue      DATE,
        date_fin_reel        DATE,
        pourcentage_avancement INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS Agent (
        id_agent           INTEGER PRIMARY KEY AUTOINCREMENT,
        prenom             TEXT NOT NULL,
        nom                TEXT NOT NULL,
        telephone          TEXT,
        email              TEXT UNIQUE,
        mot_de_passe       TEXT NOT NULL,
        etat               TEXT DEFAULT 'actif',
        id_service         INTEGER REFERENCES Service(id_service),
        id_agent_superieur INTEGER REFERENCES Agent(id_agent),
        role               TEXT DEFAULT 'agent'
    );

    CREATE TABLE IF NOT EXISTS Tache (
        id_tache          INTEGER PRIMARY KEY AUTOINCREMENT,
        nom_tache         TEXT NOT NULL,
        description       TEXT,
        date_debut_prevue DATE,
        date_debut_reel   DATE,
        date_fin_prevue   DATE,
        date_fin_reel     DATE,
        etat              TEXT DEFAULT 'Non démarré',
        id_agent          INTEGER REFERENCES Agent(id_agent),
        id_activite       INTEGER REFERENCES Activite(id_activite)
    );

    CREATE TABLE IF NOT EXISTS Feedback (
        id_feedback      INTEGER PRIMARY KEY AUTOINCREMENT,
        type_feedback    TEXT,
        contenu          TEXT NOT NULL,
        date_creation    TEXT,
        id_agent         INTEGER REFERENCES Agent(id_agent)
    );

    CREATE TABLE IF NOT EXISTS Historique_tache (
        id_historique_tache INTEGER PRIMARY KEY AUTOINCREMENT,
        ancien_agent        TEXT,
        nouveau_agent       TEXT,
        motif               TEXT,
        date_action         TEXT,
        id_tache            INTEGER REFERENCES Tache(id_tache)
    );

    CREATE TABLE IF NOT EXISTS Notification (
        id_notification INTEGER PRIMARY KEY AUTOINCREMENT,
        type            TEXT,
        message         TEXT NOT NULL,
        date_envoie     TEXT,
        lue             INTEGER DEFAULT 0,
        id_agent        INTEGER REFERENCES Agent(id_agent)
    );

    CREATE TABLE IF NOT EXISTS Idee (
        id_idee           INTEGER PRIMARY KEY AUTOINCREMENT,
        contenu           TEXT NOT NULL,
        date_envoie       TEXT,
        id_agent_superieur INTEGER REFERENCES Agent(id_agent),
        id_agent_simple    INTEGER REFERENCES Agent(id_agent)
    );

    CREATE TABLE IF NOT EXISTS Gestion (
        id_service  INTEGER REFERENCES Service(id_service),
        id_activite INTEGER REFERENCES Activite(id_activite),
        PRIMARY KEY (id_service, id_activite)
    );
    """)
    conn.commit()
    _seed_demo_data()

def _hash(pwd):
    return hashlib.sha256(pwd.encode()).hexdigest()

def _seed_demo_data():
    # Check if already seeded
    if fetch("SELECT 1 FROM Agent LIMIT 1"):
        return

    # Services
    services = [
        ("Direction Générale", "Direction générale de l'organisation"),
        ("Ressources Humaines", "Gestion du personnel et recrutement"),
        ("Finance", "Gestion financière et comptabilité"),
        ("Technique", "Département technique et ingénierie"),
        ("Communication", "Relations publiques et communication"),
        ("IT", "Systèmes d'information et informatique"),
        ("Logistique", "Gestion des approvisionnements et stocks"),
    ]
    for nom, desc in services:
        conn.execute("INSERT OR IGNORE INTO Service(nom, description) VALUES(?,?)", (nom, desc))
    conn.commit()

    svc = {r[0]: r[1] for r in fetch("SELECT nom, id_service FROM Service")}

    # Agents (id_agent_superieur NULL pour les rôles hauts)
    agents = [
        # prenom, nom, email, mdp, etat, service, superieur, role
        ("Conseil", "Administration", "ca@rama.sn",   "ca2026",    "actif", None,                   None, "ca"),
        ("Directeur", "Général",      "dg@rama.sn",   "dg2026",    "actif", svc["Direction Générale"], None, "dg"),
        ("Chef",  "RH",               "chef.rh@rama.sn","chef2026","actif", svc["Ressources Humaines"],None,"chef"),
        ("Chef",  "Finance",          "chef.fin@rama.sn","chef2026","actif",svc["Finance"],           None, "chef"),
        ("Chef",  "Technique",        "chef.tech@rama.sn","chef2026","actif",svc["Technique"],        None, "chef"),
        ("Chef",  "IT",               "chef.it@rama.sn","chef2026", "actif",svc["IT"],               None, "chef"),
        ("Aminata","Diallo",          "a.diallo@rama.sn","agent2026","actif",svc["Ressources Humaines"],None,"agent"),
        ("Moussa", "Sow",             "m.sow@rama.sn",  "agent2026","actif",svc["Finance"],           None,"agent"),
        ("Fatou",  "Ndiaye",          "f.ndiaye@rama.sn","agent2026","actif",svc["Technique"],        None,"agent"),
        ("Ibrahima","Fall",           "i.fall@rama.sn", "agent2026","actif",svc["IT"],               None,"agent"),
        ("Rokhaya","Ba",              "r.ba@rama.sn",   "agent2026","actif",svc["Communication"],     None,"agent"),
        ("Omar",   "Gueye",           "o.gueye@rama.sn","agent2026","actif",svc["Logistique"],        None,"agent"),
    ]
    for prenom, nom, email, mdp, etat, service, sup, role in agents:
        conn.execute(
            "INSERT OR IGNORE INTO Agent(prenom,nom,email,mot_de_passe,etat,id_service,id_agent_superieur,role) VALUES(?,?,?,?,?,?,?,?)",
            (prenom, nom, email, _hash(mdp), etat, service, sup, role)
        )
    conn.commit()

    ag = {r[0]: r[1] for r in fetch("SELECT email, id_agent FROM Agent")}

    # Activités
    today = date.today()
    activites = [
        ("Formation", "Formation sur les outils numériques",
         str(today - timedelta(20)), str(today - timedelta(18)),
         str(today + timedelta(10)), None, 60),
        ("Audit", "Audit annuel des comptes",
         str(today - timedelta(10)), str(today - timedelta(8)),
         str(today + timedelta(20)), None, 40),
        ("Séminaire", "Séminaire stratégique RAMA 2026",
         str(today + timedelta(5)), None,
         str(today + timedelta(15)), None, 0),
        ("Rapport", "Rapport trimestriel Q1",
         str(today - timedelta(5)), str(today - timedelta(3)),
         str(today + timedelta(5)), None, 75),
        ("Mission", "Mission terrain région nord",
         str(today - timedelta(30)), str(today - timedelta(28)),
         str(today - timedelta(5)), str(today - timedelta(6)), 100),
    ]
    for ta, desc, ddp, ddr, dfp, dfr, pct in activites:
        conn.execute(
            "INSERT INTO Activite(type_activite,description,date_debut_prevue,date_debut_reel,date_fin_prevue,date_fin_reel,pourcentage_avancement) VALUES(?,?,?,?,?,?,?)",
            (ta, desc, ddp, ddr, dfp, dfr, pct)
        )
    conn.commit()

    acts = fetch("SELECT id_activite FROM Activite ORDER BY id_activite")
    act_ids = [r[0] for r in acts]

    # Gestion (service → activité)
    gestions = [
        (svc["Ressources Humaines"], act_ids[0]),
        (svc["Finance"],             act_ids[1]),
        (svc["Direction Générale"],  act_ids[2]),
        (svc["Finance"],             act_ids[3]),
        (svc["Technique"],           act_ids[4]),
    ]
    for sid, aid in gestions:
        conn.execute("INSERT OR IGNORE INTO Gestion(id_service,id_activite) VALUES(?,?)", (sid, aid))
    conn.commit()

    # Tâches
    taches = [
        ("Préparer supports formation", "Préparer les slides et docs",
         str(today-timedelta(18)), str(today-timedelta(17)), str(today-timedelta(10)), str(today-timedelta(11)),
         "Terminée", ag["a.diallo@rama.sn"], act_ids[0]),
        ("Animer sessions formation", "Animer les 3 sessions prévues",
         str(today-timedelta(10)), str(today-timedelta(9)), str(today+timedelta(5)), None,
         "En cours", ag["a.diallo@rama.sn"], act_ids[0]),
        ("Évaluer les apprenants", "Évaluation post-formation",
         str(today+timedelta(3)), None, str(today+timedelta(10)), None,
         "Non démarré", ag["r.ba@rama.sn"], act_ids[0]),
        ("Collecte documents audit", "Rassembler tous les justificatifs",
         str(today-timedelta(8)), str(today-timedelta(7)), str(today-timedelta(3)), str(today-timedelta(4)),
         "Terminée", ag["m.sow@rama.sn"], act_ids[1]),
        ("Analyse des comptes", "Vérification et analyse financière",
         str(today-timedelta(3)), str(today-timedelta(2)), str(today+timedelta(10)), None,
         "En cours", ag["m.sow@rama.sn"], act_ids[1]),
        ("Rédaction rapport audit", "Rédiger le rapport final",
         str(today+timedelta(10)), None, str(today+timedelta(20)), None,
         "Non démarré", ag["m.sow@rama.sn"], act_ids[1]),
        ("Préparer agenda séminaire", "Planification détaillée",
         str(today+timedelta(2)), None, str(today+timedelta(7)), None,
         "Non démarré", ag["a.diallo@rama.sn"], act_ids[2]),
        ("Rédiger rapport Q1", "Rapport performance trimestrielle",
         str(today-timedelta(3)), str(today-timedelta(2)), str(today+timedelta(3)), None,
         "En cours", ag["f.ndiaye@rama.sn"], act_ids[3]),
        ("Valider indicateurs", "Validation des KPIs Q1",
         str(today-timedelta(2)), None, str(today+timedelta(5)), None,
         "En retard", ag["m.sow@rama.sn"], act_ids[3]),
        ("Rapport mission terrain", "Compte-rendu final mission",
         str(today-timedelta(7)), str(today-timedelta(6)), str(today-timedelta(2)), str(today-timedelta(3)),
         "Terminée", ag["f.ndiaye@rama.sn"], act_ids[4]),
    ]
    for nom_t, desc, ddp, ddr, dfp, dfr, etat, id_ag, id_act in taches:
        conn.execute(
            "INSERT INTO Tache(nom_tache,description,date_debut_prevue,date_debut_reel,date_fin_prevue,date_fin_reel,etat,id_agent,id_activite) VALUES(?,?,?,?,?,?,?,?,?)",
            (nom_t, desc, ddp, ddr, dfp, dfr, etat, id_ag, id_act)
        )
    conn.commit()

    # Historiques
    tache_ids = [r[0] for r in fetch("SELECT id_tache FROM Tache ORDER BY id_tache")]
    historiques = [
        (tache_ids[0], "Aminata Diallo", "—", "Création initiale", str(today-timedelta(18))),
        (tache_ids[1], "—", "Aminata Diallo", "Réaffectée après congé", str(today-timedelta(5))),
        (tache_ids[3], "Moussa Sow", "—", "Création initiale", str(today-timedelta(8))),
        (tache_ids[8], "Omar Gueye", "Moussa Sow", "Retrait de rôle – surcharge", str(today-timedelta(1))),
    ]
    for id_t, anc, nouv, motif, date_a in historiques:
        conn.execute(
            "INSERT INTO Historique_tache(id_tache,ancien_agent,nouveau_agent,motif,date_action) VALUES(?,?,?,?,?)",
            (id_t, anc, nouv, motif, date_a)
        )
    conn.commit()

    # Notifications
    notifs = [
        ("info", "Bienvenue sur RAMA 2026 !", str(today), ag["a.diallo@rama.sn"]),
        ("warn", "Tâche 'Valider indicateurs' en retard !", str(today), ag["m.sow@rama.sn"]),
        ("urgent", "Réaffectation : 'Valider indicateurs' retiré.", str(today), ag["o.gueye@rama.sn"]),
        ("info", "Tâche 'Animer sessions' démarrée.", str(today), ag["a.diallo@rama.sn"]),
    ]
    for typ, msg, date_e, id_ag in notifs:
        conn.execute(
            "INSERT INTO Notification(type,message,date_envoie,lue,id_agent) VALUES(?,?,?,0,?)",
            (typ, msg, date_e, id_ag)
        )
    conn.commit()

    # Feedbacks
    feedbacks = [
        ("Suggestion", "Il faudrait un système de suivi des congés intégré.", str(today-timedelta(3)), ag["a.diallo@rama.sn"]),
        ("Signalement", "Problème d'accès aux fichiers partagés IT.", str(today-timedelta(1)), ag["i.fall@rama.sn"]),
        ("Idée Forte", "Mettre en place un tableau de bord mobile.", str(today), ag["f.ndiaye@rama.sn"]),
    ]
    for typ, cont, date_c, id_ag in feedbacks:
        conn.execute(
            "INSERT INTO Feedback(type_feedback,contenu,date_creation,id_agent) VALUES(?,?,?,?)",
            (typ, cont, date_c, id_ag)
        )
    conn.commit()

    # Idées
    conn.execute(
        "INSERT INTO Idee(contenu,date_envoie,id_agent_superieur,id_agent_simple) VALUES(?,?,?,?)",
        ("Organiser une journée de team-building inter-services", str(today), ag["chef.rh@rama.sn"], ag["a.diallo@rama.sn"])
    )
    conn.commit()

init_db()

# ─────────────────────────────────────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────────────────────────────────────
ROLE_LABELS = {
    "ca":    ("Conseil d'Administration", "role-ca"),
    "dg":    ("Directeur Général",        "role-dg"),
    "chef":  ("Chef de Service",          "role-chef"),
    "agent": ("Agent",                    "role-agent"),
}

TYPES_ACTIVITE = ["Atelier", "Audit", "Colloque", "Formation", "Mission", "Rapport", "Séminaire"]
ETATS_TACHE    = ["Non démarré", "En cours", "En pause", "Terminée", "En retard"]

def authenticate(email, password):
    row = conn.execute(
        "SELECT * FROM Agent WHERE email=? AND mot_de_passe=? AND etat='actif'",
        (email, _hash(password))
    ).fetchone()
    return dict(row) if row else None

def get_agent_by_id(id_agent):
    row = conn.execute("SELECT * FROM Agent WHERE id_agent=?", (id_agent,)).fetchone()
    return dict(row) if row else None

def get_service_name(id_service):
    if not id_service:
        return "—"
    r = conn.execute("SELECT nom FROM Service WHERE id_service=?", (id_service,)).fetchone()
    return r[0] if r else "—"

def add_notification(id_agent, message, type_="info"):
    conn.execute(
        "INSERT INTO Notification(id_agent,type,message,date_envoie,lue) VALUES(?,?,?,?,0)",
        (id_agent, type_, message, datetime.now().strftime("%Y-%m-%d %H:%M"))
    )
    conn.commit()

def add_historique(id_tache, ancien, nouveau, motif):
    conn.execute(
        "INSERT INTO Historique_tache(id_tache,ancien_agent,nouveau_agent,motif,date_action) VALUES(?,?,?,?,?)",
        (id_tache, ancien, nouveau, motif, datetime.now().strftime("%Y-%m-%d %H:%M"))
    )
    conn.commit()

def count_notifs(id_agent):
    r = conn.execute("SELECT COUNT(*) FROM Notification WHERE id_agent=? AND lue=0", (id_agent,)).fetchone()
    return r[0] if r else 0

def kpi(col, label, value, sub="", color=""):
    col.markdown(f"""
    <div class="kpi-card {color}">
        <div class="kpi-label">{label}</div>
        <div class="kpi-value">{value}</div>
        <div class="kpi-sub">{sub}</div>
    </div>""", unsafe_allow_html=True)

def section(icon, title):
    st.markdown(f'<div class="section-title">{icon} {title}</div>', unsafe_allow_html=True)

# ─────────────────────────────────────────────────────────────────────────────
#  LOGIN
# ─────────────────────────────────────────────────────────────────────────────
def page_login():
    col_c, col_f, col_r = st.columns([1, 1.6, 1])
    with col_f:
        st.markdown("""
        <div style='text-align:center; margin-bottom:36px;'>
            <div style='display:inline-flex; align-items:center; justify-content:center;
                        background:linear-gradient(135deg,#1d4ed8,#4f46e5);
                        border-radius:20px; padding:14px 24px; margin-bottom:16px;
                        box-shadow:0 8px 28px rgba(37,99,235,0.3);'>
                <span style='font-size:2rem;'>🏛️</span>
                <span style='font-family:Poppins,sans-serif; font-size:1.7rem; font-weight:800;
                             color:#ffffff; margin-left:10px; letter-spacing:-0.5px;'>RAMA 2026</span>
            </div>
            <div style='font-size:14px; color:#64748b; font-weight:500; margin-top:4px;'>
                Pilotage intelligent des activités organisationnelles
            </div>
        </div>
        """, unsafe_allow_html=True)

        with st.form("login_form"):
            email = st.text_input("📧 Email", placeholder="votre@email.sn")
            mdp   = st.text_input("🔒 Mot de passe", type="password", placeholder="••••••••")
            btn   = st.form_submit_button("Se connecter →", use_container_width=True)

        if btn:
            if not email or not mdp:
                st.error("Veuillez remplir tous les champs.")
            else:
                user = authenticate(email, mdp)
                if user:
                    st.session_state.user = user
                    st.session_state.page = "dashboard"
                    st.rerun()
                else:
                    st.error("❌ Identifiants incorrects ou compte inactif.")

        st.markdown("""
        <div style='margin-top:24px; padding:16px 18px;
                    background:linear-gradient(135deg,#f8fafc,#eff6ff);
                    border-radius:14px; font-size:12px; color:#64748b;
                    border:1px solid #dbeafe;'>
            <div style='font-weight:700; color:#1e40af; margin-bottom:8px; font-size:11px;
                        text-transform:uppercase; letter-spacing:0.5px;'>
                🔑 Comptes de démonstration
            </div>
            <div style='display:grid; gap:5px;'>
                <div>🏛️ <strong>ca@rama.sn</strong> / ca2026 &nbsp;→ Conseil d'Administration</div>
                <div>👔 <strong>dg@rama.sn</strong> / dg2026 &nbsp;→ Directeur Général</div>
                <div>👨‍💼 <strong>chef.rh@rama.sn</strong> / chef2026 &nbsp;→ Chef de Service</div>
                <div>👤 <strong>a.diallo@rama.sn</strong> / agent2026 &nbsp;→ Agent</div>
            </div>
        </div>
        """, unsafe_allow_html=True)

# ─────────────────────────────────────────────────────────────────────────────
#  SIDEBAR NAVIGATION
# ─────────────────────────────────────────────────────────────────────────────
def build_sidebar(user):
    role      = user["role"]
    role_lbl, role_css = ROLE_LABELS[role]
    notif_cnt = count_notifs(user["id_agent"])

    with st.sidebar:
        st.markdown(f"""
        <div style='text-align:center; padding:24px 0 16px;'>
            <div style='display:inline-flex; align-items:center; justify-content:center;
                        background:linear-gradient(135deg,rgba(59,130,246,0.2),rgba(99,102,241,0.2));
                        border-radius:18px; padding:10px 18px; margin-bottom:10px;
                        border:1px solid rgba(99,179,237,0.2);'>
                <span style='font-size:1.6rem;'>🏛️</span>
                <span style='font-family:Poppins,sans-serif; font-size:1.3rem; font-weight:800;
                             color:#f1f5f9; margin-left:8px; letter-spacing:-0.3px;'>RAMA 2026</span>
            </div>
            <div style='font-size:10.5px; color:#7fb3d3; font-weight:500; letter-spacing:0.4px;
                        text-transform:uppercase;'>Pilotage des activités</div>
        </div>
        <div style='background:linear-gradient(135deg,rgba(255,255,255,0.07),rgba(99,130,246,0.05));
                    border-radius:14px; padding:14px 16px; margin-bottom:16px;
                    border:1px solid rgba(99,179,237,0.15);'>
            <div style='display:flex; align-items:center; gap:10px;'>
                <div style='width:38px; height:38px; border-radius:50%;
                            background:linear-gradient(135deg,#3b82f6,#8b5cf6);
                            display:flex; align-items:center; justify-content:center;
                            font-weight:800; font-size:14px; color:white; flex-shrink:0;'>
                    {user["prenom"][0].upper()}{user["nom"][0].upper()}
                </div>
                <div>
                    <div style='font-size:13px; font-weight:700; color:#f1f5f9;
                                line-height:1.2;'>{user["prenom"]} {user["nom"]}</div>
                    <div style='font-size:10.5px; color:#7fb3d3; margin-top:2px;'>
                        {get_service_name(user["id_service"])}</div>
                </div>
            </div>
            <div style='margin-top:10px;'><span class="role-badge {role_css}">{role_lbl}</span></div>
        </div>
        <div style='height:1px; background:linear-gradient(90deg,transparent,rgba(99,179,237,0.25),transparent);
                    margin:0 0 12px;'></div>
        """, unsafe_allow_html=True)

        if "page" not in st.session_state:
            st.session_state.page = "dashboard"

        # Pages available by role
        pages_ca    = [("dashboard","📊  Tableau de bord"),("gantt","📆  Gantt"),("historique","🕓  Historique"),("ecarts","📏  Écarts & Délais"),("productivite","🏆  Productivité"),("activites","⚡  Activités"),("agents","👥  Agents")]
        pages_dg    = [("dashboard","📊  Tableau de bord"),("activites","⚡  Activités"),("gantt","📆  Gantt"),("ecarts","📏  Écarts & Délais"),("productivite","🏆  Productivité"),("agents","👥  Agents"),("notifications","🔔  Notifications"),("idees","💡  Idées")]
        pages_chef  = [("dashboard","📊  Tableau de bord"),("taches","✅  Tâches"),("gantt","📆  Gantt"),("historique","🕓  Historique"),("ecarts","📏  Écarts & Délais"),("productivite","🏆  Productivité"),("notifications","🔔  Notifications"),("idees","💡  Idées")]
        pages_agent = [("mes_taches","✅  Mes Tâches"),("mon_historique","🕓  Mon Historique"),("ma_productivite","🏆  Ma Productivité"),("notifications","🔔  Notifications"),("idees","💡  Idées")]

        nav_map = {"ca": pages_ca, "dg": pages_dg, "chef": pages_chef, "agent": pages_agent}
        pages   = nav_map[role]

        for key, label in pages:
            badge = ""
            if key == "notifications" and notif_cnt > 0:
                badge = f' 🔴{notif_cnt}'
            if st.button(f"{label}{badge}", key=f"nav_{key}", use_container_width=True):
                st.session_state.page = key

        st.markdown("<div style='height:1px; background:linear-gradient(90deg,transparent,rgba(99,179,237,0.25),transparent); margin:14px 0;'></div>", unsafe_allow_html=True)
        if st.button("🚪 Déconnexion", use_container_width=True):
            st.session_state.clear()
            st.rerun()

# ─────────────────────────────────────────────────────────────────────────────
#  PAGES
# ─────────────────────────────────────────────────────────────────────────────

# ── DASHBOARD ──────────────────────────────────────────────────────────────
def page_dashboard(user):
    section("📊", "Tableau de Bord Global")
    role = user["role"]

    if role in ("ca", "dg"):
        df = fetchdf("SELECT t.*, a.type_activite, s.nom as service_nom FROM Tache t LEFT JOIN Activite a ON t.id_activite=a.id_activite LEFT JOIN Agent ag ON t.id_agent=ag.id_agent LEFT JOIN Service s ON ag.id_service=s.id_service")
        df_act = fetchdf("SELECT * FROM Activite")
    elif role == "chef":
        svc_id = user["id_service"]
        df = fetchdf("""
            SELECT t.*, a.type_activite, s.nom as service_nom
            FROM Tache t
            LEFT JOIN Activite a ON t.id_activite=a.id_activite
            LEFT JOIN Agent ag ON t.id_agent=ag.id_agent
            LEFT JOIN Service s ON ag.id_service=s.id_service
            WHERE ag.id_service=?
        """, (svc_id,))
        df_act = fetchdf("""
            SELECT a.* FROM Activite a
            JOIN Gestion g ON a.id_activite=g.id_activite
            WHERE g.id_service=?
        """, (svc_id,))
    else:
        return

    total     = len(df)
    done      = len(df[df.etat == "Terminée"]) if total else 0
    en_cours  = len(df[df.etat == "En cours"]) if total else 0
    en_retard = len(df[df.etat == "En retard"]) if total else 0
    nb_act    = len(df_act)
    avg_pct   = int(df_act.pourcentage_avancement.mean()) if nb_act else 0

    c1,c2,c3,c4,c5,c6 = st.columns(6)
    kpi(c1,"Total Tâches", total, "dans le périmètre")
    kpi(c2,"Terminées", done, f"{int(done/total*100) if total else 0}% du total", "green")
    kpi(c3,"En cours", en_cours, "actives", "blue")
    kpi(c4,"En retard", en_retard, "⚠️ alerte", "red")
    kpi(c5,"Activités", nb_act, "planifiées", "purple")
    kpi(c6,"Avancement moy.", f"{avg_pct}%", "activités", "orange")

    st.write("")

    if df.empty:
        st.info("Aucune donnée disponible.")
        return

    col_l, col_r = st.columns([3,2])
    with col_l:
        st.markdown("##### 📈 Avancement par Activité")
        fig1 = px.bar(df, x="type_activite", y="etat", color="etat",
                      barmode="group",
                      color_discrete_map={
                          "Terminée":"#10b981","En cours":"#3b82f6",
                          "Non démarré":"#d1d5db","En retard":"#ef4444","En pause":"#f59e0b"
                      })
        fig1.update_layout(plot_bgcolor="white",paper_bgcolor="white",font_family="Inter",margin=dict(t=10,b=10))
        st.plotly_chart(fig1, use_container_width=True)

    with col_r:
        st.markdown("##### 🥧 Répartition des États")
        ec = df.etat.value_counts().reset_index()
        ec.columns = ["etat","count"]
        fig2 = px.pie(ec, names="etat", values="count", hole=0.45,
                      color_discrete_map={"Terminée":"#10b981","En cours":"#3b82f6",
                                          "Non démarré":"#d1d5db","En retard":"#ef4444","En pause":"#f59e0b"})
        fig2.update_layout(margin=dict(t=10,b=10),font_family="Inter")
        st.plotly_chart(fig2, use_container_width=True)

    if role in ("ca","dg") and "service_nom" in df.columns:
        c_a, c_b = st.columns(2)
        with c_a:
            st.markdown("##### 🏢 Tâches par Service")
            svc_g = df.groupby("service_nom").etat.count().reset_index()
            svc_g.columns = ["Service","Nb"]
            fig3 = px.bar(svc_g, x="Service", y="Nb", color="Nb", color_continuous_scale="Blues")
            fig3.update_layout(plot_bgcolor="white",paper_bgcolor="white",font_family="Inter",margin=dict(t=10))
            st.plotly_chart(fig3, use_container_width=True)
        with c_b:
            st.markdown("##### 🏆 Productivité Top 5 Agents")
            ag_df = fetchdf("""
                SELECT ag.prenom||' '||ag.nom as agent, COUNT(*) as total,
                       SUM(CASE WHEN t.etat='Terminée' THEN 1 ELSE 0 END) as terminees
                FROM Tache t JOIN Agent ag ON t.id_agent=ag.id_agent
                GROUP BY ag.id_agent ORDER BY terminees DESC LIMIT 5
            """)
            if not ag_df.empty:
                fig4 = px.bar(ag_df, x="terminees", y="agent", orientation="h", color="terminees",
                              color_continuous_scale="Greens")
                fig4.update_layout(plot_bgcolor="white",paper_bgcolor="white",font_family="Inter",margin=dict(t=10))
                st.plotly_chart(fig4, use_container_width=True)


# ── ACTIVITÉS (DG & chef) ──────────────────────────────────────────────────
def page_activites(user):
    section("⚡", "Gestion des Activités")
    role   = user["role"]
    svc_id = user["id_service"]

    if role == "dg":
        df_act = fetchdf("""
            SELECT a.*, GROUP_CONCAT(s.nom, ', ') as services
            FROM Activite a
            LEFT JOIN Gestion g ON a.id_activite=g.id_activite
            LEFT JOIN Service s ON g.id_service=s.id_service
            GROUP BY a.id_activite
        """)
    else:
        df_act = fetchdf("""
            SELECT a.* FROM Activite a
            JOIN Gestion g ON a.id_activite=g.id_activite
            WHERE g.id_service=?
        """, (svc_id,))

    # Créer activité (DG seulement)
    if role == "dg":
        with st.expander("➕ Créer une nouvelle activité"):
            with st.form("form_act"):
                c1, c2 = st.columns(2)
                ta     = c1.selectbox("Type d'activité", TYPES_ACTIVITE)
                desc   = c2.text_area("Description", height=80)
                c3, c4 = st.columns(2)
                ddp    = c3.date_input("Date début prévue", date.today())
                dfp    = c4.date_input("Date fin prévue",   date.today()+timedelta(30))

                df_svc = fetchdf("SELECT id_service, nom FROM Service")
                svc_opts = df_svc.set_index("nom")["id_service"].to_dict()
                svcs_sel = st.multiselect("Services concernés", list(svc_opts.keys()))

                if st.form_submit_button("🚀 Créer l'activité"):
                    conn.execute(
                        "INSERT INTO Activite(type_activite,description,date_debut_prevue,date_fin_prevue,pourcentage_avancement) VALUES(?,?,?,?,0)",
                        (ta, desc, str(ddp), str(dfp))
                    )
                    conn.commit()
                    new_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
                    for snom in svcs_sel:
                        conn.execute("INSERT OR IGNORE INTO Gestion VALUES(?,?)", (svc_opts[snom], new_id))
                    conn.commit()
                    # Notifier chefs de service
                    for snom in svcs_sel:
                        chef = conn.execute(
                            "SELECT id_agent FROM Agent WHERE id_service=? AND role='chef' LIMIT 1",
                            (svc_opts[snom],)
                        ).fetchone()
                        if chef:
                            add_notification(chef[0], f"Nouvelle activité assignée à votre service : {ta}", "info")
                    st.success("✅ Activité créée et services notifiés.")
                    st.rerun()

    st.divider()
    st.markdown("##### 📋 Liste des Activités")
    if df_act.empty:
        st.info("Aucune activité.")
        return

    for _, row in df_act.iterrows():
        pct   = row.get("pourcentage_avancement", 0) or 0
        color = "#10b981" if pct==100 else ("#f59e0b" if pct>=50 else "#3b82f6")
        with st.expander(f"{'✅' if pct==100 else '🔄'} [{row.id_activite}] {row.type_activite} — {row.description[:60]}"):
            col_i, col_p = st.columns([3,1])
            with col_i:
                st.markdown(f"**Description :** {row.description}")
                st.markdown(f"**Début prévu :** {row.date_debut_prevue} &nbsp;&nbsp; **Fin prévue :** {row.date_fin_prevue}")
                st.markdown(f"**Début réel :** {row.date_debut_reel or '—'} &nbsp;&nbsp; **Fin réelle :** {row.date_fin_reel or '—'}")
            with col_p:
                st.metric("Avancement", f"{pct}%")
                st.progress(int(pct)/100)

            # Update avancement (chef)
            if role in ("dg","chef"):
                new_pct = st.slider("Mettre à jour l'avancement", 0, 100, int(pct), 5, key=f"sl_{row.id_activite}")
                if st.button("💾 Enregistrer", key=f"sv_{row.id_activite}"):
                    etat_fin = str(date.today()) if new_pct == 100 else None
                    conn.execute("UPDATE Activite SET pourcentage_avancement=?, date_fin_reel=? WHERE id_activite=?",
                                 (new_pct, etat_fin, row.id_activite))
                    conn.commit()
                    st.rerun()

            # Tâches liées
            df_t = fetchdf("""
                SELECT t.nom_tache, ag.prenom||' '||ag.nom as agent, t.etat, t.date_fin_prevue
                FROM Tache t JOIN Agent ag ON t.id_agent=ag.id_agent
                WHERE t.id_activite=?
            """, (row.id_activite,))
            if not df_t.empty:
                st.markdown("**Tâches associées :**")
                st.dataframe(df_t, use_container_width=True, hide_index=True)


# ── TÂCHES (chef de service) ───────────────────────────────────────────────
def page_taches(user):
    section("📋", "Pilotage des Tâches")
    role   = user["role"]
    svc_id = user["id_service"]

    # Agents du service
    df_agents = fetchdf("SELECT id_agent, prenom||' '||nom as full_name FROM Agent WHERE id_service=? AND role='agent'", (svc_id,))
    agents_map = df_agents.set_index("full_name")["id_agent"].to_dict() if not df_agents.empty else {}

    # Activités du service
    df_acts_svc = fetchdf("""
        SELECT a.id_activite, a.type_activite||' – '||COALESCE(a.description,'') as label
        FROM Activite a JOIN Gestion g ON a.id_activite=g.id_activite WHERE g.id_service=?
    """, (svc_id,))
    acts_map = df_acts_svc.set_index("label")["id_activite"].to_dict() if not df_acts_svc.empty else {}

    with st.expander("➕ Assigner une nouvelle tâche"):
        with st.form("form_tache"):
            c1, c2 = st.columns(2)
            t_nom   = c1.text_input("Nom de la tâche *")
            t_desc  = c2.text_area("Description", height=70)
            c3, c4  = st.columns(2)
            t_agent_sel = c3.selectbox("Agent assigné *", list(agents_map.keys()) if agents_map else ["Aucun agent"])
            t_act_sel   = c4.selectbox("Activité *", list(acts_map.keys()) if acts_map else ["Aucune activité"])
            c5, c6  = st.columns(2)
            t_ddp   = c5.date_input("Date début prévue", date.today())
            t_dfp   = c6.date_input("Date fin prévue",   date.today()+timedelta(7))

            if st.form_submit_button("🚀 Assigner la tâche"):
                if t_nom and agents_map and acts_map:
                    id_ag  = agents_map[t_agent_sel]
                    id_act = acts_map[t_act_sel]
                    conn.execute(
                        "INSERT INTO Tache(nom_tache,description,date_debut_prevue,date_fin_prevue,etat,id_agent,id_activite) VALUES(?,?,?,?,?,?,?)",
                        (t_nom, t_desc, str(t_ddp), str(t_dfp), "Non démarré", id_ag, id_act)
                    )
                    conn.commit()
                    new_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
                    add_historique(new_id, "—", t_agent_sel, "Création initiale")
                    add_notification(id_ag, f"Nouvelle tâche assignée : **{t_nom}** (échéance {t_dfp})", "info")
                    st.success(f"✅ Tâche '{t_nom}' assignée à {t_agent_sel}")
                    st.rerun()
                else:
                    st.error("Remplissez tous les champs obligatoires.")

    st.divider()

    df_t = fetchdf("""
        SELECT t.id_tache, t.nom_tache, ag.prenom||' '||ag.nom as agent, a.type_activite,
               t.date_debut_prevue, t.date_fin_prevue, t.etat
        FROM Tache t
        JOIN Agent ag ON t.id_agent=ag.id_agent
        JOIN Activite a ON t.id_activite=a.id_activite
        WHERE ag.id_service=?
        ORDER BY t.date_fin_prevue
    """, (svc_id,))

    if df_t.empty:
        st.info("Aucune tâche pour votre service.")
        return

    # Filtres
    fc1, fc2 = st.columns(2)
    f_etat = fc1.multiselect("Filtrer par état", df_t.etat.unique())
    f_ag   = fc2.multiselect("Filtrer par agent", df_t.agent.unique())
    dff    = df_t.copy()
    if f_etat: dff = dff[dff.etat.isin(f_etat)]
    if f_ag:   dff = dff[dff.agent.isin(f_ag)]

    st.dataframe(dff, use_container_width=True, hide_index=True)

    st.divider()
    col_act, col_reaf = st.columns(2)

    with col_act:
        st.markdown("#### ⚡ Actions rapides")
        active = df_t[df_t.etat != "Terminée"]
        if not active.empty:
            opts   = active.apply(lambda r: f"[{r.id_tache}] {r.nom_tache}", axis=1).tolist()
            sel_s  = st.selectbox("Tâche", opts, key="sel_tache")
            sel_id = int(sel_s.split("]")[0][1:])
            sel_r  = df_t[df_t.id_tache == sel_id].iloc[0]

            b1, b2, b3 = st.columns(3)
            if b1.button("▶️ Démarrer"):
                conn.execute("UPDATE Tache SET etat='En cours', date_debut_reel=? WHERE id_tache=?",
                             (str(date.today()), sel_id))
                conn.commit()
                id_ag = conn.execute("SELECT id_agent FROM Tache WHERE id_tache=?", (sel_id,)).fetchone()[0]
                add_notification(id_ag, f"Tâche '{sel_r.nom_tache}' démarrée.", "info")
                st.rerun()
            if b2.button("✅ Terminer"):
                conn.execute("UPDATE Tache SET etat='Terminée', date_fin_reel=? WHERE id_tache=?",
                             (str(date.today()), sel_id))
                conn.commit()
                id_ag = conn.execute("SELECT id_agent FROM Tache WHERE id_tache=?", (sel_id,)).fetchone()[0]
                add_notification(id_ag, f"Tâche '{sel_r.nom_tache}' marquée terminée 🎉", "info")
                _update_activite_avancement(conn.execute("SELECT id_activite FROM Tache WHERE id_tache=?", (sel_id,)).fetchone()[0])
                st.snow()
                st.rerun()
            if b3.button("⏸ Pause"):
                conn.execute("UPDATE Tache SET etat='En pause' WHERE id_tache=?", (sel_id,))
                conn.commit()
                st.rerun()

    with col_reaf:
        st.markdown("#### 🔄 Réaffecter une tâche")
        active2 = df_t[df_t.etat != "Terminée"]
        if not active2.empty and agents_map:
            opts2  = active2.apply(lambda r: f"[{r.id_tache}] {r.nom_tache}", axis=1).tolist()
            sel2   = st.selectbox("Tâche à réaffecter", opts2, key="reaf_s")
            sel2_id= int(sel2.split("]")[0][1:])
            row2   = df_t[df_t.id_tache == sel2_id].iloc[0]
            nv_ag  = st.selectbox("Nouvel agent", list(agents_map.keys()), key="nouvel_ag")
            motif  = st.text_input("Motif", key="motif_r")
            if st.button("🔄 Confirmer"):
                old_ag_id = conn.execute("SELECT id_agent FROM Tache WHERE id_tache=?", (sel2_id,)).fetchone()[0]
                new_ag_id = agents_map[nv_ag]
                conn.execute("UPDATE Tache SET id_agent=? WHERE id_tache=?", (new_ag_id, sel2_id))
                conn.commit()
                add_historique(sel2_id, row2.agent, nv_ag, motif or "Réaffectation")
                add_notification(old_ag_id, f"Tâche '{row2.nom_tache}' vous a été retirée → {nv_ag}", "urgent")
                add_notification(new_ag_id, f"Tâche '{row2.nom_tache}' vous a été réaffectée", "warn")
                st.success(f"✅ Réaffectée à {nv_ag}")
                st.rerun()

def _update_activite_avancement(id_activite):
    rows = conn.execute(
        "SELECT COUNT(*), SUM(CASE WHEN etat='Terminée' THEN 1 ELSE 0 END) FROM Tache WHERE id_activite=?",
        (id_activite,)
    ).fetchone()
    total, done = rows
    if total:
        pct = int(done / total * 100)
        conn.execute("UPDATE Activite SET pourcentage_avancement=? WHERE id_activite=?", (pct, id_activite))
        conn.commit()


# ── MES TÂCHES (agent) ─────────────────────────────────────────────────────
def page_mes_taches(user):
    section("📋", "Mes Tâches")
    id_ag = user["id_agent"]

    df_t = fetchdf("""
        SELECT t.id_tache, t.nom_tache, t.description, a.type_activite,
               t.date_debut_prevue, t.date_fin_prevue, t.date_fin_reel, t.etat
        FROM Tache t JOIN Activite a ON t.id_activite=a.id_activite
        WHERE t.id_agent=?
        ORDER BY t.date_fin_prevue
    """, (id_ag,))

    if df_t.empty:
        st.info("Aucune tâche assignée pour le moment.")
        return

    # KPIs personnels
    c1,c2,c3,c4 = st.columns(4)
    kpi(c1,"Total",         len(df_t))
    kpi(c2,"Terminées",     len(df_t[df_t.etat=="Terminée"]), color="green")
    kpi(c3,"En cours",      len(df_t[df_t.etat=="En cours"]),  color="blue")
    kpi(c4,"En retard",     len(df_t[df_t.etat=="En retard"]), color="red")

    st.divider()
    st.dataframe(df_t, use_container_width=True, hide_index=True)

    st.divider()
    st.markdown("#### ⚡ Mettre à jour une tâche")
    active = df_t[df_t.etat != "Terminée"]
    if not active.empty:
        opts  = active.apply(lambda r: f"[{r.id_tache}] {r.nom_tache}", axis=1).tolist()
        sel   = st.selectbox("Tâche", opts)
        sel_id= int(sel.split("]")[0][1:])
        b1, b2, b3 = st.columns(3)
        if b1.button("▶️ Démarrer"):
            conn.execute("UPDATE Tache SET etat='En cours', date_debut_reel=? WHERE id_tache=?",
                         (str(date.today()), sel_id))
            conn.commit()
            st.rerun()
        if b2.button("✅ Terminer"):
            conn.execute("UPDATE Tache SET etat='Terminée', date_fin_reel=? WHERE id_tache=?",
                         (str(date.today()), sel_id))
            conn.commit()
            act_id = conn.execute("SELECT id_activite FROM Tache WHERE id_tache=?", (sel_id,)).fetchone()[0]
            _update_activite_avancement(act_id)
            st.snow()
            st.rerun()
        if b3.button("⏸ Pause"):
            conn.execute("UPDATE Tache SET etat='En pause' WHERE id_tache=?", (sel_id,))
            conn.commit()
            st.rerun()


# ── GANTT ──────────────────────────────────────────────────────────────────
def page_gantt(user):
    section("📆", "Diagramme de Gantt")
    role   = user["role"]
    svc_id = user["id_service"]

    if role in ("ca","dg"):
        df_g = fetchdf("""
            SELECT t.nom_tache as Tâche, ag.prenom||' '||ag.nom as Agent,
                   a.type_activite as Activité, s.nom as Service, t.etat as État,
                   t.date_debut_prevue as Début, t.date_fin_prevue as Fin
            FROM Tache t
            JOIN Agent ag ON t.id_agent=ag.id_agent
            JOIN Activite a ON t.id_activite=a.id_activite
            JOIN Service s ON ag.id_service=s.id_service
        """)
    else:
        df_g = fetchdf("""
            SELECT t.nom_tache as Tâche, ag.prenom||' '||ag.nom as Agent,
                   a.type_activite as Activité, s.nom as Service, t.etat as État,
                   t.date_debut_prevue as Début, t.date_fin_prevue as Fin
            FROM Tache t
            JOIN Agent ag ON t.id_agent=ag.id_agent
            JOIN Activite a ON t.id_activite=a.id_activite
            JOIN Service s ON ag.id_service=s.id_service
            WHERE ag.id_service=?
        """, (svc_id,))

    if df_g.empty:
        st.info("Aucune donnée pour le Gantt.")
        return

    # Filtres
    c1, c2 = st.columns(2)
    act_opts = ["Toutes"] + list(df_g["Activité"].unique())
    f_act = c1.selectbox("Activité", act_opts)
    if role in ("ca","dg"):
        svc_opts = ["Tous"] + list(df_g["Service"].unique())
        f_svc = c2.selectbox("Service", svc_opts)
    else:
        f_svc = "Tous"

    dff = df_g.copy()
    if f_act != "Toutes": dff = dff[dff["Activité"] == f_act]
    if f_svc != "Tous":   dff = dff[dff["Service"]  == f_svc]

    dff["Début"] = pd.to_datetime(dff["Début"], errors="coerce").fillna(pd.Timestamp.today())
    dff["Fin"]   = pd.to_datetime(dff["Fin"],   errors="coerce").fillna(pd.Timestamp.today()+pd.Timedelta(7,"D"))

    color_map = {"Terminée":"#10b981","En cours":"#3b82f6",
                 "Non démarré":"#94a3b8","En retard":"#ef4444","En pause":"#f59e0b"}

    fig = px.timeline(dff, x_start="Début", x_end="Fin", y="Tâche", color="État",
                      hover_data=["Agent","Activité","Service"],
                      color_discrete_map=color_map, title="Diagramme de Gantt")
    fig.update_yaxes(autorange="reversed")
    # ✅ APRÈS
    fig.add_vline(x=pd.Timestamp.today().timestamp() * 1000,
              line_dash="dash", line_color="#ef4444",
              annotation_text="Aujourd'hui", annotation_position="top right")
    fig.update_layout(plot_bgcolor="white",paper_bgcolor="white",font_family="Inter",
                      height=max(420, len(dff)*36), margin=dict(t=40,b=20))
    st.plotly_chart(fig, use_container_width=True)


# ── HISTORIQUE ─────────────────────────────────────────────────────────────
def page_historique(user, agent_only=False):
    section("🕓", "Historique des Tâches & Rôles")
    role   = user["role"]
    svc_id = user["id_service"]
    id_ag  = user["id_agent"]

    if agent_only:
        df_h = fetchdf("""
            SELECT h.date_action, t.nom_tache as Tâche, a.type_activite as Activité,
                   h.ancien_agent as "Ancien Agent", h.nouveau_agent as "Nouvel Agent", h.motif as Motif
            FROM Historique_tache h
            JOIN Tache t ON h.id_tache=t.id_tache
            JOIN Activite a ON t.id_activite=a.id_activite
            WHERE t.id_agent=?
            ORDER BY h.id_historique_tache DESC
        """, (id_ag,))
    elif role in ("ca","dg"):
        df_h = fetchdf("""
            SELECT h.date_action, t.nom_tache as Tâche, a.type_activite as Activité,
                   s.nom as Service, h.ancien_agent as "Ancien Agent",
                   h.nouveau_agent as "Nouvel Agent", h.motif as Motif
            FROM Historique_tache h
            JOIN Tache t ON h.id_tache=t.id_tache
            JOIN Activite a ON t.id_activite=a.id_activite
            JOIN Agent ag ON t.id_agent=ag.id_agent
            JOIN Service s ON ag.id_service=s.id_service
            ORDER BY h.id_historique_tache DESC
        """)
    else:
        df_h = fetchdf("""
            SELECT h.date_action, t.nom_tache as Tâche, a.type_activite as Activité,
                   h.ancien_agent as "Ancien Agent", h.nouveau_agent as "Nouvel Agent", h.motif as Motif
            FROM Historique_tache h
            JOIN Tache t ON h.id_tache=t.id_tache
            JOIN Activite a ON t.id_activite=a.id_activite
            JOIN Agent ag ON t.id_agent=ag.id_agent
            WHERE ag.id_service=?
            ORDER BY h.id_historique_tache DESC
        """, (svc_id,))

    if df_h.empty:
        st.info("Aucun historique.")
        return

    st.dataframe(df_h, use_container_width=True, hide_index=True)

    if not agent_only:
        st.divider()
        st.markdown("#### 📊 Fréquence des mouvements par Activité")
        if "Activité" in df_h.columns:
            cnt = df_h["Activité"].value_counts().reset_index()
            cnt.columns = ["Activité","Nb"]
            fig = px.bar(cnt, x="Activité", y="Nb", color="Nb", color_continuous_scale="Blues")
            fig.update_layout(plot_bgcolor="white",paper_bgcolor="white",font_family="Inter",margin=dict(t=10))
            st.plotly_chart(fig, use_container_width=True)


# ── ÉCARTS & DÉLAIS ────────────────────────────────────────────────────────
def page_ecarts(user):
    section("📏", "Mesure des Écarts sur Délais")
    role   = user["role"]
    svc_id = user["id_service"]

    if role in ("ca","dg"):
        df_e = fetchdf("""
            SELECT t.nom_tache, ag.prenom||' '||ag.nom as agent, a.type_activite,
                   s.nom as service, t.date_debut_prevue, t.date_fin_prevue,
                   t.date_fin_reel, t.etat
            FROM Tache t
            JOIN Agent ag ON t.id_agent=ag.id_agent
            JOIN Activite a ON t.id_activite=a.id_activite
            JOIN Service s ON ag.id_service=s.id_service
        """)
    else:
        df_e = fetchdf("""
            SELECT t.nom_tache, ag.prenom||' '||ag.nom as agent, a.type_activite,
                   t.date_debut_prevue, t.date_fin_prevue, t.date_fin_reel, t.etat
            FROM Tache t
            JOIN Agent ag ON t.id_agent=ag.id_agent
            JOIN Activite a ON t.id_activite=a.id_activite
            WHERE ag.id_service=?
        """, (svc_id,))

    if df_e.empty:
        st.info("Aucune tâche.")
        return

    today = pd.Timestamp.today().normalize()
    df_e["date_fin_prevue"] = pd.to_datetime(df_e["date_fin_prevue"], errors="coerce")
    df_e["date_fin_reel"]   = pd.to_datetime(df_e["date_fin_reel"],   errors="coerce")

    def calc_ecart(r):
        if r.etat == "Terminée" and pd.notna(r.date_fin_reel):
            return (r.date_fin_reel - r.date_fin_prevue).days
        elif r.etat != "Terminée" and pd.notna(r.date_fin_prevue):
            return max((today - r.date_fin_prevue).days, 0)
        return None

    df_e["ecart"] = df_e.apply(calc_ecart, axis=1)

    def chip(e):
        if e is None: return '<span class="chip-na">N/A</span>'
        if e < 0:  return f'<span class="chip-ok">{abs(e)}j avance</span>'
        if e == 0: return '<span class="chip-ok">À temps</span>'
        if e <= 3: return f'<span class="chip-warn">+{e}j retard</span>'
        return f'<span class="chip-late">+{e}j RETARD</span>'

    df_e["Écart"] = df_e["ecart"].apply(chip)

    en_retard = df_e[df_e["ecart"] > 0]
    en_avance = df_e[df_e["ecart"] < 0]
    a_temps   = df_e[df_e["ecart"] == 0]

    c1,c2,c3,c4 = st.columns(4)
    kpi(c1,"En retard", len(en_retard), color="red")
    kpi(c2,"À l'heure", len(a_temps),   color="green")
    kpi(c3,"En avance", len(en_avance), color="blue")
    retard_moy = f"{en_retard['ecart'].mean():.1f}j" if not en_retard.empty else "—"
    kpi(c4,"Retard moyen", retard_moy,  color="orange")

    st.write("")
    cols_disp = [c for c in ["nom_tache","agent","type_activite","service","date_fin_prevue","date_fin_reel","etat","ecart","Écart"] if c in df_e.columns]
    st.write(df_e[cols_disp].to_html(escape=False, index=False), unsafe_allow_html=True)

    st.divider()
    df_plot = df_e.dropna(subset=["ecart"])
    if not df_plot.empty:
        fig = px.bar(df_plot.sort_values("ecart"), x="nom_tache", y="ecart",
                     color="type_activite", labels={"ecart":"Écart (j)","nom_tache":"Tâche"})
        fig.add_hline(y=0, line_dash="dash", line_color="green")
        fig.update_layout(plot_bgcolor="white",paper_bgcolor="white",font_family="Inter",margin=dict(t=10))
        st.plotly_chart(fig, use_container_width=True)

    # Écart moyen par activité
    st.markdown("#### 🏷️ Écart moyen par Type d'Activité")
    ea = df_e.groupby("type_activite")["ecart"].mean().reset_index()
    ea.columns = ["Activité","Écart moyen (j)"]
    fig2 = px.bar(ea, x="Activité", y="Écart moyen (j)", color="Écart moyen (j)", color_continuous_scale="RdYlGn_r")
    fig2.update_layout(plot_bgcolor="white",paper_bgcolor="white",font_family="Inter",margin=dict(t=10))
    st.plotly_chart(fig2, use_container_width=True)

    # Type d'activité le plus en vue par service (CA/DG)
    if role in ("ca","dg") and "service" in df_e.columns:
        st.markdown("#### 🏢 Type d'Activité le Plus Fréquent par Service")
        top = df_e.groupby(["service","type_activite"]).size().reset_index(name="nb")
        top = top.loc[top.groupby("service")["nb"].idxmax()]
        fig3 = px.bar(top, x="service", y="nb", color="type_activite", text="type_activite",
                      color_discrete_sequence=px.colors.qualitative.Safe)
        fig3.update_layout(plot_bgcolor="white",paper_bgcolor="white",font_family="Inter",margin=dict(t=10))
        st.plotly_chart(fig3, use_container_width=True)


# ── PRODUCTIVITÉ ───────────────────────────────────────────────────────────
def page_productivite(user, agent_only=False):
    section("🏆", "Productivité des Intervenants")
    role   = user["role"]
    svc_id = user["id_service"]
    id_ag  = user["id_agent"]

    if agent_only:
        df_p = fetchdf("""
            SELECT t.nom_tache, a.type_activite, t.etat,
                   t.date_debut_prevue, t.date_fin_prevue, t.date_fin_reel
            FROM Tache t JOIN Activite a ON t.id_activite=a.id_activite
            WHERE t.id_agent=?
        """, (id_ag,))
        if df_p.empty:
            st.info("Aucune tâche.")
            return
        total = len(df_p)
        done  = len(df_p[df_p.etat=="Terminée"])
        kpi(st.columns(3)[0], "Total tâches", total)
        kpi(st.columns(3)[1], "Terminées",    done, f"{int(done/total*100) if total else 0}%", "green")
        kpi(st.columns(3)[2], "Taux réalisation", f"{int(done/total*100) if total else 0}%", color="blue")
        st.dataframe(df_p, use_container_width=True, hide_index=True)
        return

    if role in ("ca","dg"):
        agg = fetchdf("""
            SELECT ag.prenom||' '||ag.nom as Agent, s.nom as Service,
                   COUNT(*) as Total,
                   SUM(CASE WHEN t.etat='Terminée' THEN 1 ELSE 0 END) as Terminées,
                   SUM(CASE WHEN t.etat='En cours'  THEN 1 ELSE 0 END) as "En cours",
                   SUM(CASE WHEN t.etat='En retard' THEN 1 ELSE 0 END) as "En retard"
            FROM Tache t
            JOIN Agent ag ON t.id_agent=ag.id_agent
            JOIN Service s ON ag.id_service=s.id_service
            GROUP BY ag.id_agent ORDER BY Terminées DESC
        """)
    else:
        agg = fetchdf("""
            SELECT ag.prenom||' '||ag.nom as Agent,
                   COUNT(*) as Total,
                   SUM(CASE WHEN t.etat='Terminée' THEN 1 ELSE 0 END) as Terminées,
                   SUM(CASE WHEN t.etat='En cours'  THEN 1 ELSE 0 END) as "En cours",
                   SUM(CASE WHEN t.etat='En retard' THEN 1 ELSE 0 END) as "En retard"
            FROM Tache t
            JOIN Agent ag ON t.id_agent=ag.id_agent
            WHERE ag.id_service=?
            GROUP BY ag.id_agent ORDER BY Terminées DESC
        """, (svc_id,))

    if agg.empty:
        st.info("Aucune donnée.")
        return

    agg["Taux (%)"] = (agg["Terminées"] / agg["Total"] * 100).round(1)
    st.dataframe(agg, use_container_width=True, hide_index=True)

    c1, c2 = st.columns(2)
    with c1:
        st.markdown("##### 📊 Tâches par Agent")
        melt_cols = ["Agent","Terminées","En cours","En retard"]
        df_melt = agg[melt_cols].melt(id_vars="Agent", var_name="État", value_name="Nb")
        fig1 = px.bar(df_melt, x="Agent", y="Nb", color="État", barmode="stack",
                      color_discrete_map={"Terminées":"#10b981","En cours":"#3b82f6","En retard":"#ef4444"})
        fig1.update_layout(plot_bgcolor="white",paper_bgcolor="white",font_family="Inter",margin=dict(t=10))
        st.plotly_chart(fig1, use_container_width=True)
    with c2:
        st.markdown("##### 📈 Taux de Réalisation (%)")
        fig2 = px.bar(agg.sort_values("Taux (%)"), x="Taux (%)", y="Agent",
                      orientation="h", color="Taux (%)", color_continuous_scale="Greens")
        fig2.update_layout(plot_bgcolor="white",paper_bgcolor="white",font_family="Inter",margin=dict(t=10))
        st.plotly_chart(fig2, use_container_width=True)

    if len(agg) >= 3:
        st.markdown("##### 🕸️ Radar Comparatif")
        cats = ["Total","Terminées","En cours","En retard"]
        fig3 = go.Figure()
        for _, row in agg.iterrows():
            fig3.add_trace(go.Scatterpolar(r=[row[c] for c in cats], theta=cats,
                                            fill="toself", name=row["Agent"]))
        fig3.update_layout(polar=dict(radialaxis=dict(visible=True)),
                           paper_bgcolor="white",font_family="Inter",margin=dict(t=30))
        st.plotly_chart(fig3, use_container_width=True)


# ── AGENTS ────────────────────────────────────────────────────────────────
def page_agents(user):
    section("👥", "Gestion des Agents")
    role = user["role"]

    df_ag = fetchdf("""
        SELECT ag.id_agent, ag.prenom, ag.nom, ag.email, ag.telephone,
               ag.role, ag.etat, s.nom as service
        FROM Agent ag LEFT JOIN Service s ON ag.id_service=s.id_service
        ORDER BY ag.id_agent
    """)
    st.dataframe(df_ag, use_container_width=True, hide_index=True)

    if role == "dg":
        st.divider()
        with st.expander("➕ Ajouter un agent"):
            with st.form("form_ag"):
                c1,c2 = st.columns(2)
                prenom = c1.text_input("Prénom *")
                nom_   = c2.text_input("Nom *")
                c3,c4  = st.columns(2)
                email_ = c3.text_input("Email *")
                tel_   = c4.text_input("Téléphone")
                c5,c6  = st.columns(2)
                df_svc = fetchdf("SELECT id_service, nom FROM Service")
                svc_d  = df_svc.set_index("nom")["id_service"].to_dict()
                svc_sel= c5.selectbox("Service", list(svc_d.keys()))
                role_a = c6.selectbox("Rôle", ["agent","chef"])
                mdp_   = st.text_input("Mot de passe", type="password")
                if st.form_submit_button("➕ Créer"):
                    if prenom and nom_ and email_ and mdp_:
                        try:
                            conn.execute(
                                "INSERT INTO Agent(prenom,nom,email,telephone,mot_de_passe,etat,id_service,role) VALUES(?,?,?,?,?,?,?,?)",
                                (prenom, nom_, email_, tel_, _hash(mdp_), "actif", svc_d[svc_sel], role_a)
                            )
                            conn.commit()
                            st.success(f"✅ Agent {prenom} {nom_} créé.")
                            st.rerun()
                        except Exception as e:
                            st.error(f"Erreur : {e}")
                    else:
                        st.error("Remplissez tous les champs obligatoires.")


# ── NOTIFICATIONS ─────────────────────────────────────────────────────────
def page_notifications(user):
    section("🔔", "Notifications")
    id_ag = user["id_agent"]
    role  = user["role"]

    col_h, col_btn = st.columns([4,1])
    with col_btn:
        if st.button("✅ Tout marquer lu"):
            conn.execute("UPDATE Notification SET lue=1 WHERE id_agent=?", (id_ag,))
            conn.commit()
            st.rerun()

    df_n = fetchdf(
        "SELECT * FROM Notification WHERE id_agent=? ORDER BY id_notification DESC",
        (id_ag,)
    )

    if df_n.empty:
        st.success("Aucune notification.")
    else:
        non_lues = df_n[df_n["lue"] == 0]
        st.markdown(f"**{len(non_lues)} non lue(s)**")

        type_css = {"urgent":"urgent","warn":"warn","info":"info"}
        for _, r in df_n.iterrows():
            css   = type_css.get(str(r.get("type","")), "")
            badge = "🔵 " if not r.get("lue",0) else ""
            st.markdown(f"""
            <div class="notif-card {css}">
                <div style="display:flex;justify-content:space-between;">
                    <span><strong>{badge}{r.get('type','').upper()}</strong></span>
                    <small style="color:#94a3b8;">{r.get('date_envoie','')}</small>
                </div>
                <div style="margin-top:6px;">{r.get('message','')}</div>
            </div>
            """, unsafe_allow_html=True)

    # Chefs et DG peuvent envoyer des notifications
    if role in ("dg","chef"):
        st.divider()
        st.markdown("#### 📢 Envoyer une notification")
        df_dest = fetchdf("SELECT id_agent, prenom||' '||nom as nom FROM Agent WHERE role='agent'")
        if not df_dest.empty:
            dest_map = df_dest.set_index("nom")["id_agent"].to_dict()
            with st.form("send_notif"):
                dest_sel = st.selectbox("Destinataire", list(dest_map.keys()))
                msg_n    = st.text_area("Message")
                typ_n    = st.selectbox("Type", ["info","warn","urgent"])
                if st.form_submit_button("📨 Envoyer"):
                    if msg_n.strip():
                        add_notification(dest_map[dest_sel], msg_n, typ_n)
                        st.success("✅ Notification envoyée.")
                        st.rerun()


# ── IDÉES ─────────────────────────────────────────────────────────────────
def page_idees(user):
    section("💡", "Boîte à Idées & Feedbacks")
    id_ag = user["id_agent"]
    role  = user["role"]

    col_in, col_out = st.columns([1,1.3])

    with col_in:
        st.markdown("#### ✍️ Soumettre une idée / feedback")
        with st.form("form_idee", clear_on_submit=True):
            f_type = st.selectbox("Catégorie", ["Idée Forte","Suggestion","Avis fonctionnel","Signalement"])
            f_msg  = st.text_area("Votre message", height=140)
            if st.form_submit_button("📨 Envoyer"):
                if f_msg.strip():
                    conn.execute(
                        "INSERT INTO Feedback(type_feedback,contenu,date_creation,id_agent) VALUES(?,?,?,?)",
                        (f_type, f_msg, datetime.now().strftime("%Y-%m-%d %H:%M"), id_ag)
                    )
                    conn.commit()
                    st.toast("Message envoyé !", icon="📧")
                    st.balloons()
                else:
                    st.error("Le message ne peut pas être vide.")

    with col_out:
        st.markdown("#### 📥 Messages reçus")
        if role in ("ca","dg"):
            df_f = fetchdf("""
                SELECT f.type_feedback, f.contenu, f.date_creation,
                       ag.prenom||' '||ag.nom as agent, s.nom as service
                FROM Feedback f
                JOIN Agent ag ON f.id_agent=ag.id_agent
                JOIN Service s ON ag.id_service=s.id_service
                ORDER BY f.id_feedback DESC
            """)
        elif role == "chef":
            svc_id = user["id_service"]
            df_f = fetchdf("""
                SELECT f.type_feedback, f.contenu, f.date_creation,
                       ag.prenom||' '||ag.nom as agent
                FROM Feedback f
                JOIN Agent ag ON f.id_agent=ag.id_agent
                WHERE ag.id_service=?
                ORDER BY f.id_feedback DESC
            """, (svc_id,))
        else:
            df_f = fetchdf("""
                SELECT f.type_feedback, f.contenu, f.date_creation
                FROM Feedback f WHERE f.id_agent=? ORDER BY f.id_feedback DESC
            """, (id_ag,))

        if df_f.empty:
            st.info("Aucun feedback.")
        else:
            colors = {"Idée Forte":"#10b981","Suggestion":"#3b82f6",
                      "Avis fonctionnel":"#8b5cf6","Signalement":"#ef4444"}
            for _, r in df_f.iterrows():
                color = colors.get(r["type_feedback"], "#64748b")
                ag_s  = f"<strong>{r.get('agent','')}</strong> — " if "agent" in r else ""
                st.markdown(f"""
                <div class="idea-card">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="color:{color};font-weight:700;font-size:12px;">{r['type_feedback']}</span>
                        <small style="color:#94a3b8;">{r.get('date_creation','')}</small>
                    </div>
                    <div style="margin-top:6px;">{ag_s}{r['contenu']}</div>
                </div>
                """, unsafe_allow_html=True)

            if role in ("ca","dg") and not df_f.empty:
                st.divider()
                cnt = df_f["type_feedback"].value_counts().reset_index()
                cnt.columns = ["Type","Nb"]
                fig = px.pie(cnt, names="Type", values="Nb", hole=0.4,
                             color_discrete_sequence=px.colors.qualitative.Safe)
                fig.update_layout(font_family="Inter",margin=dict(t=10))
                st.plotly_chart(fig, use_container_width=True)


# ─────────────────────────────────────────────────────────────────────────────
#  ROUTEUR PRINCIPAL
# ─────────────────────────────────────────────────────────────────────────────
if "user" not in st.session_state:
    page_login()
else:
    user = st.session_state.user
    build_sidebar(user)
    role = user["role"]
    page = st.session_state.get("page","dashboard")

    # Accès selon rôle
    if page == "dashboard":
        if role in ("ca","dg","chef"):
            page_dashboard(user)
        else:
            page_mes_taches(user)

    elif page == "activites":
        if role in ("dg","chef"):
            page_activites(user)
        else:
            st.warning("Accès non autorisé.")

    elif page == "taches":
        if role == "chef":
            page_taches(user)
        else:
            st.warning("Accès non autorisé.")

    elif page == "mes_taches":
        page_mes_taches(user)

    elif page == "gantt":
        page_gantt(user)

    elif page == "historique":
        page_historique(user)

    elif page == "mon_historique":
        page_historique(user, agent_only=True)

    elif page == "ecarts":
        page_ecarts(user)

    elif page == "productivite":
        page_productivite(user)

    elif page == "ma_productivite":
        page_productivite(user, agent_only=True)

    elif page == "agents":
        if role in ("ca","dg"):
            page_agents(user)
        else:
            st.warning("Accès non autorisé.")

    elif page == "notifications":
        page_notifications(user)

    elif page == "idees":
        page_idees(user)

    else:
        st.warning("Page introuvable.")