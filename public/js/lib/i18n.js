/* global window, localStorage */
/**
 * Tiny i18n module. 8 languages, key-based translations, persisted in
 * localStorage. Falls back to English (and to the key itself) when missing.
 *
 * Usage in views:
 *   const t = window.I18n.t;
 *   t('nav.dashboard')      // → "Dashboard" / "Дашборд" / …
 *   t('scan.btn.en', '🌍 EN scan')   // optional default
 */
window.I18n = (function () {
  const LANGS = [
    { code: 'en',    label: 'English' },
    { code: 'es',    label: 'Español' },
    { code: 'pt-BR', label: 'Português' },
    { code: 'ko',    label: '한국어' },
    { code: 'ja',    label: '日本語' },
    { code: 'ru',    label: 'Русский' },
    { code: 'zh-CN', label: '简体中文' },
    { code: 'zh-TW', label: '繁體中文' },
  ];

  const DICT = {
    // Navigation labels
    'nav.dashboard':  { en: 'Dashboard', es: 'Panel', 'pt-BR': 'Painel', ko: '대시보드', ja: 'ダッシュボード', ru: 'Дашборд', 'zh-CN': '仪表盘', 'zh-TW': '儀表板' },
    'nav.scan':       { en: 'Scan',      es: 'Búsqueda', 'pt-BR': 'Busca', ko: '검색', ja: '検索', ru: 'Поиск', 'zh-CN': '搜索', 'zh-TW': '搜尋' },
    'nav.pipeline':   { en: 'Pipeline',  es: 'Pipeline', 'pt-BR': 'Pipeline', ko: '파이프라인', ja: 'パイプライン', ru: 'Pipeline', 'zh-CN': '流水线', 'zh-TW': '流水線' },
    'nav.evaluate':   { en: 'Evaluate',  es: 'Evaluar', 'pt-BR': 'Avaliar', ko: '평가', ja: '評価', ru: 'Оценить', 'zh-CN': '评估', 'zh-TW': '評估' },
    'nav.deep':       { en: 'Deep research', es: 'Investigación', 'pt-BR': 'Pesquisa', ko: '심층 조사', ja: 'ディープ調査', ru: 'Deep research', 'zh-CN': '深度研究', 'zh-TW': '深度研究' },
    'nav.apply':      { en: 'Apply helper', es: 'Aplicar', 'pt-BR': 'Aplicar', ko: '지원 도우미', ja: '応募ヘルパー', ru: 'Apply helper', 'zh-CN': '申请助手', 'zh-TW': '申請助手' },
    'nav.tracker':    { en: 'Tracker', es: 'Tracker', 'pt-BR': 'Tracker', ko: '트래커', ja: 'トラッカー', ru: 'Трекер', 'zh-CN': '跟踪器', 'zh-TW': '追蹤器' },
    'nav.reports':    { en: 'Reports', es: 'Reportes', 'pt-BR': 'Relatórios', ko: '보고서', ja: 'レポート', ru: 'Отчёты', 'zh-CN': '报告', 'zh-TW': '報告' },
    'nav.cv':         { en: 'CV', es: 'CV', 'pt-BR': 'CV', ko: '이력서', ja: '履歴書', ru: 'CV', 'zh-CN': '简历', 'zh-TW': '履歷' },
    'nav.settings':   { en: 'Profile', es: 'Perfil', 'pt-BR': 'Perfil', ko: '프로필', ja: 'プロフィール', ru: 'Профиль', 'zh-CN': '个人资料', 'zh-TW': '個人資料' },
    'nav.health':     { en: 'Health', es: 'Estado', 'pt-BR': 'Saúde', ko: '상태', ja: 'ヘルス', ru: 'Health', 'zh-CN': '健康', 'zh-TW': '健康' },

    // Top bar
    'top.search':     { en: 'Find a company, role or URL…', es: 'Buscar empresa, rol o URL…', 'pt-BR': 'Buscar empresa, vaga ou URL…', ko: '회사, 직무 또는 URL 검색…', ja: '会社、役割、URL を検索…', ru: 'Найти компанию, роль или URL…', 'zh-CN': '查找公司、职位或 URL…', 'zh-TW': '查找公司、職位或 URL…' },
    'top.doctor':     { en: 'Doctor', es: 'Doctor', 'pt-BR': 'Doctor', ko: 'Doctor', ja: 'Doctor', ru: 'Doctor', 'zh-CN': 'Doctor', 'zh-TW': 'Doctor' },
    'top.quickscan':  { en: 'Quick scan', es: 'Búsqueda rápida', 'pt-BR': 'Busca rápida', ko: '빠른 검색', ja: 'クイック検索', ru: 'Quick scan', 'zh-CN': '快速搜索', 'zh-TW': '快速搜尋' },
    'top.langhint':   { en: 'CTRL+K — search', es: 'CTRL+K — buscar', 'pt-BR': 'CTRL+K — buscar', ko: 'CTRL+K — 검색', ja: 'CTRL+K — 検索', ru: 'CTRL+K — поиск', 'zh-CN': 'CTRL+K — 搜索', 'zh-TW': 'CTRL+K — 搜尋' },

    // Common
    'common.loading': { en: 'Loading…', es: 'Cargando…', 'pt-BR': 'Carregando…', ko: '로딩 중…', ja: '読み込み中…', ru: 'Загрузка…', 'zh-CN': '加载中…', 'zh-TW': '載入中…' },
    'common.error':   { en: 'Error', es: 'Error', 'pt-BR': 'Erro', ko: '오류', ja: 'エラー', ru: 'Ошибка', 'zh-CN': '错误', 'zh-TW': '錯誤' },
    'common.retry':   { en: 'Retry', es: 'Reintentar', 'pt-BR': 'Tentar novamente', ko: '다시 시도', ja: '再試行', ru: 'Повторить', 'zh-CN': '重试', 'zh-TW': '重試' },
    'common.save':    { en: 'Save', es: 'Guardar', 'pt-BR': 'Salvar', ko: '저장', ja: '保存', ru: 'Сохранить', 'zh-CN': '保存', 'zh-TW': '儲存' },
    'common.cancel':  { en: 'Cancel', es: 'Cancelar', 'pt-BR': 'Cancelar', ko: '취소', ja: 'キャンセル', ru: 'Отмена', 'zh-CN': '取消', 'zh-TW': '取消' },
    'common.add':     { en: 'Add', es: 'Añadir', 'pt-BR': 'Adicionar', ko: '추가', ja: '追加', ru: 'Добавить', 'zh-CN': '添加', 'zh-TW': '新增' },
    'common.run':     { en: 'Run', es: 'Ejecutar', 'pt-BR': 'Executar', ko: '실행', ja: '実行', ru: 'Запустить', 'zh-CN': '运行', 'zh-TW': '執行' },
    'common.open':    { en: 'Open', es: 'Abrir', 'pt-BR': 'Abrir', ko: '열기', ja: '開く', ru: 'Открыть', 'zh-CN': '打开', 'zh-TW': '開啟' },
    'common.close':   { en: 'Close', es: 'Cerrar', 'pt-BR': 'Fechar', ko: '닫기', ja: '閉じる', ru: 'Закрыть', 'zh-CN': '关闭', 'zh-TW': '關閉' },
    'common.empty':   { en: 'No results', es: 'Sin resultados', 'pt-BR': 'Sem resultados', ko: '결과 없음', ja: '結果なし', ru: 'Нет результатов', 'zh-CN': '无结果', 'zh-TW': '無結果' },
    'common.refresh': { en: 'Refresh', es: 'Actualizar', 'pt-BR': 'Atualizar', ko: '새로고침', ja: '更新', ru: 'Обновить', 'zh-CN': '刷新', 'zh-TW': '重新整理' },

    // Dashboard
    'dash.title':     { en: 'Command Center', es: 'Centro de Comando', 'pt-BR': 'Centro de Comando', ko: '커맨드 센터', ja: 'コマンドセンター', ru: 'Командный центр', 'zh-CN': '指挥中心', 'zh-TW': '指揮中心' },
    'dash.subtitle':  { en: 'Every job, report, and active process — in one place.', es: 'Cada trabajo, reporte y proceso activo — en un solo lugar.', 'pt-BR': 'Cada vaga, relatório e processo ativo — em um só lugar.', ko: '모든 채용, 보고서, 활성 프로세스 — 한 곳에서.', ja: 'すべての求人、レポート、アクティブなプロセス — 一か所に。', ru: 'Все вакансии, отчёты и активные процессы — в одном месте.', 'zh-CN': '所有职位、报告和活动流程 — 集中一处。', 'zh-TW': '所有職位、報告和活動流程 — 集中一處。' },
    'dash.apps':      { en: 'Applications', es: 'Aplicaciones', 'pt-BR': 'Aplicações', ko: '지원', ja: '応募', ru: 'Заявки', 'zh-CN': '申请', 'zh-TW': '申請' },
    'dash.pipeline':  { en: 'Pipeline', es: 'Pipeline', 'pt-BR': 'Pipeline', ko: '파이프라인', ja: 'パイプライン', ru: 'Pipeline', 'zh-CN': '流水线', 'zh-TW': '流水線' },
    'dash.reports':   { en: 'Reports', es: 'Reportes', 'pt-BR': 'Relatórios', ko: '보고서', ja: 'レポート', ru: 'Отчёты', 'zh-CN': '报告', 'zh-TW': '報告' },
    'dash.avgScore':  { en: 'Avg score', es: 'Score medio', 'pt-BR': 'Score médio', ko: '평균 점수', ja: '平均スコア', ru: 'Средний score', 'zh-CN': '平均分数', 'zh-TW': '平均分數' },
    'dash.tracker':   { en: 'tracker', es: 'tracker', 'pt-BR': 'tracker', ko: '트래커', ja: 'トラッカー', ru: 'трекер', 'zh-CN': '跟踪器', 'zh-TW': '追蹤器' },
    'dash.pending':   { en: 'pending', es: 'pendientes', 'pt-BR': 'pendentes', ko: '대기 중', ja: '保留中', ru: 'ожидают обработки', 'zh-CN': '待处理', 'zh-TW': '待處理' },
    'dash.generated': { en: 'generated', es: 'generados', 'pt-BR': 'gerados', ko: '생성됨', ja: '生成済み', ru: 'сгенерировано', 'zh-CN': '已生成', 'zh-TW': '已生成' },
    'dash.openPipeline':{ en: 'Open Pipeline', es: 'Abrir Pipeline', 'pt-BR': 'Abrir Pipeline', ko: '파이프라인 열기', ja: 'パイプラインを開く', ru: 'Открыть Pipeline', 'zh-CN': '打开流水线', 'zh-TW': '開啟流水線' },
    'dash.evaluate':  { en: 'Evaluate vacancy', es: 'Evaluar vacante', 'pt-BR': 'Avaliar vaga', ko: '채용 공고 평가', ja: '求人を評価', ru: 'Оценить вакансию', 'zh-CN': '评估职位', 'zh-TW': '評估職位' },
    'dash.statuses':  { en: 'Application statuses', es: 'Estados de aplicaciones', 'pt-BR': 'Status das aplicações', ko: '지원 상태', ja: '応募ステータス', ru: 'Статусы заявок', 'zh-CN': '申请状态', 'zh-TW': '申請狀態' },
    'dash.recent':    { en: 'Recent applications', es: 'Aplicaciones recientes', 'pt-BR': 'Aplicações recentes', ko: '최근 지원', ja: '最近の応募', ru: 'Последние заявки', 'zh-CN': '最近申请', 'zh-TW': '最近申請' },
    'dash.lastReport':{ en: 'Latest report', es: 'Último reporte', 'pt-BR': 'Último relatório', ko: '최신 보고서', ja: '最新レポート', ru: 'Последний отчёт', 'zh-CN': '最新报告', 'zh-TW': '最新報告' },

    // Scan
    'scan.title':     { en: 'Vacancy search', es: 'Búsqueda de vacantes', 'pt-BR': 'Busca de vagas', ko: '채용 공고 검색', ja: '求人検索', ru: 'Поиск вакансий', 'zh-CN': '职位搜索', 'zh-TW': '職位搜尋' },
    'scan.subtitle':  { en: 'EN: companies with API · RU: hh.ru + Habr Career', es: 'EN: empresas con API · RU: hh.ru + Habr Career', 'pt-BR': 'EN: empresas com API · RU: hh.ru + Habr Career', ko: 'EN: API가 있는 회사 · RU: hh.ru + Habr Career', ja: 'EN: API のある会社 · RU: hh.ru + Habr Career', ru: 'EN: компаний с API · RU: hh.ru + Habr Career', 'zh-CN': 'EN: 有 API 的公司 · RU: hh.ru + Habr Career', 'zh-TW': 'EN: 有 API 的公司 · RU: hh.ru + Habr Career' },
    'scan.btnAll':    { en: 'Scan all sources', es: 'Buscar en todas las fuentes', 'pt-BR': 'Buscar em todas as fontes', ko: '모든 소스 검색', ja: 'すべてのソースを検索', ru: 'Сканировать все источники', 'zh-CN': '搜索所有来源', 'zh-TW': '搜尋所有來源' },
    'scan.runAll':    { en: 'Scanning all sources…', es: 'Buscando en todas las fuentes…', 'pt-BR': 'Buscando em todas as fontes…', ko: '모든 소스 검색 중…', ja: 'すべてのソースを検索中…', ru: 'Сканирую все источники…', 'zh-CN': '正在搜索所有来源…', 'zh-TW': '正在搜尋所有來源…' },
    'scan.btnEn':     { en: '🌍 EN scan', es: '🌍 EN scan', 'pt-BR': '🌍 EN scan', ko: '🌍 EN scan', ja: '🌍 EN scan', ru: '🌍 EN scan', 'zh-CN': '🌍 EN scan', 'zh-TW': '🌍 EN scan' },
    'scan.btnRu':     { en: '🇷🇺 RU scan', es: '🇷🇺 RU scan', 'pt-BR': '🇷🇺 RU scan', ko: '🇷🇺 RU scan', ja: '🇷🇺 RU scan', ru: '🇷🇺 RU scan', 'zh-CN': '🇷🇺 RU scan', 'zh-TW': '🇷🇺 RU scan' },
    'scan.btnPipe':   { en: 'Pipeline', es: 'Pipeline', 'pt-BR': 'Pipeline', ko: '파이프라인', ja: 'パイプライン', ru: 'Pipeline', 'zh-CN': '流水线', 'zh-TW': '流水線' },
    'scan.chip.dynamic':{ en: 'Keywords', es: 'Palabras clave', 'pt-BR': 'Palavras-chave', ko: '키워드', ja: 'キーワード', ru: 'Ключевые слова', 'zh-CN': '关键词', 'zh-TW': '關鍵字' },
    'scan.dryRun':    { en: 'Dry run (no write)', es: 'Dry run (sin escribir)', 'pt-BR': 'Dry run (sem escrever)', ko: 'Dry run (기록 없음)', ja: 'ドライラン (書込なし)', ru: 'Dry run (без записи)', 'zh-CN': '干运行 (不写入)', 'zh-TW': '乾運行 (不寫入)' },
    'scan.companyLbl':{ en: 'Company (for EN, optional)', es: 'Empresa (para EN, opcional)', 'pt-BR': 'Empresa (para EN, opcional)', ko: '회사 (EN용, 선택사항)', ja: '会社 (EN用、オプション)', ru: 'Компания (для EN, опционально)', 'zh-CN': '公司 (用于 EN, 可选)', 'zh-TW': '公司 (用於 EN, 可選)' },
    'scan.allCompanies':{ en: 'all companies', es: 'todas las empresas', 'pt-BR': 'todas as empresas', ko: '모든 회사', ja: 'すべての会社', ru: 'все компании', 'zh-CN': '所有公司', 'zh-TW': '所有公司' },
    'scan.results':   { en: 'Vacancies found', es: 'Vacantes encontradas', 'pt-BR': 'Vagas encontradas', ko: '찾은 채용 공고', ja: '見つかった求人', ru: 'Найденные вакансии', 'zh-CN': '找到的职位', 'zh-TW': '找到的職位' },
    'scan.scopeAll':  { en: 'all matching', es: 'todas las coincidencias', 'pt-BR': 'todas correspondências', ko: '모든 일치', ja: 'すべての一致', ru: 'все matching', 'zh-CN': '所有匹配', 'zh-TW': '所有匹配' },
    'scan.scopeFresh':{ en: 'new only', es: 'solo nuevas', 'pt-BR': 'apenas novas', ko: '새로운 것만', ja: '新しいもののみ', ru: 'только новые', 'zh-CN': '仅新的', 'zh-TW': '僅新的' },
    'scan.filterText':{ en: 'filter by company / role / location…', es: 'filtrar por empresa / rol / ubicación…', 'pt-BR': 'filtrar por empresa / vaga / local…', ko: '회사/직무/위치로 필터…', ja: '会社/役割/場所でフィルター…', ru: 'фильтр по компании / роли / локации…', 'zh-CN': '按公司/职位/位置过滤…', 'zh-TW': '依公司/職位/地點篩選…' },
    'scan.allTypes':  { en: 'all types', es: 'todos los tipos', 'pt-BR': 'todos os tipos', ko: '모든 유형', ja: 'すべてのタイプ', ru: 'все типы', 'zh-CN': '所有类型', 'zh-TW': '所有類型' },
    'scan.remoteOnly':{ en: 'remote only', es: 'solo remoto', 'pt-BR': 'apenas remoto', ko: '원격만', ja: 'リモートのみ', ru: 'только remote', 'zh-CN': '仅远程', 'zh-TW': '僅遠端' },
    'scan.hybrid':    { en: 'hybrid', es: 'híbrido', 'pt-BR': 'híbrido', ko: '하이브리드', ja: 'ハイブリッド', ru: 'hybrid', 'zh-CN': '混合', 'zh-TW': '混合' },
    'scan.reloc':     { en: 'relocation', es: 'reubicación', 'pt-BR': 'realocação', ko: '재배치', ja: '転居', ru: 'релокация', 'zh-CN': '搬迁', 'zh-TW': '搬遷' },
    'scan.allSources':{ en: 'all sources', es: 'todas las fuentes', 'pt-BR': 'todas fontes', ko: '모든 소스', ja: 'すべてのソース', ru: 'все источники', 'zh-CN': '所有来源', 'zh-TW': '所有來源' },
    'scan.chip.stack':{ en: 'Stack', es: 'Stack', 'pt-BR': 'Stack', ko: '스택', ja: 'スタック', ru: 'Стек', 'zh-CN': '技术栈', 'zh-TW': '技術棧' },
    'scan.chip.level':{ en: 'Level', es: 'Nivel', 'pt-BR': 'Nível', ko: '레벨', ja: 'レベル', ru: 'Уровень', 'zh-CN': '级别', 'zh-TW': '級別' },
    'scan.chip.clear':{ en: 'clear', es: 'limpiar', 'pt-BR': 'limpar', ko: '지우기', ja: 'クリア', ru: 'сбросить', 'zh-CN': '清除', 'zh-TW': '清除' },
    'scan.col.company':{ en: 'Company', es: 'Empresa', 'pt-BR': 'Empresa', ko: '회사', ja: '会社', ru: 'Компания', 'zh-CN': '公司', 'zh-TW': '公司' },
    'scan.col.role':  { en: 'Role', es: 'Rol', 'pt-BR': 'Vaga', ko: '직무', ja: '役割', ru: 'Роль', 'zh-CN': '职位', 'zh-TW': '職位' },
    'scan.col.loc':   { en: 'Location', es: 'Ubicación', 'pt-BR': 'Local', ko: '위치', ja: '場所', ru: 'Локация', 'zh-CN': '位置', 'zh-TW': '地點' },
    'scan.col.type':  { en: 'Type', es: 'Tipo', 'pt-BR': 'Tipo', ko: '유형', ja: 'タイプ', ru: 'Тип', 'zh-CN': '类型', 'zh-TW': '類型' },
    'scan.col.salary':{ en: 'Salary', es: 'Salario', 'pt-BR': 'Salário', ko: '급여', ja: '給与', ru: 'Зарплата', 'zh-CN': '薪资', 'zh-TW': '薪資' },
    'scan.col.source':{ en: 'Source', es: 'Fuente', 'pt-BR': 'Fonte', ko: '소스', ja: 'ソース', ru: 'Источник', 'zh-CN': '来源', 'zh-TW': '來源' },
    'scan.activeCo':  { en: 'Active companies', es: 'Empresas activas', 'pt-BR': 'Empresas ativas', ko: '활성 회사', ja: 'アクティブな会社', ru: 'Активные компании', 'zh-CN': '活动公司', 'zh-TW': '活動公司' },
    'scan.consoleReady':{en: '> ready. press scan button.', es: '> listo. presiona scan.', 'pt-BR': '> pronto. pressione scan.', ko: '> 준비. scan 버튼 누르세요.', ja: '> 準備完了。scan を押してください。', ru: '> ready. press «запустить scan».', 'zh-CN': '> 就绪。按 scan。', 'zh-TW': '> 就緒。按 scan。' },
    'scan.noResults': { en: 'No results. Run EN or RU scan above — the table will appear here when finished.', es: 'Sin resultados. Ejecuta EN o RU scan arriba — la tabla aparecerá aquí al finalizar.', 'pt-BR': 'Sem resultados. Execute EN ou RU scan acima — a tabela aparecerá aqui ao terminar.', ko: '결과 없음. 위에서 EN 또는 RU scan을 실행하세요 — 완료 시 테이블이 여기에 표시됩니다.', ja: '結果なし。上から EN または RU scan を実行してください — 完了時にテーブルがここに表示されます。', ru: 'Нет результатов. Запустите EN или RU scan выше — после завершения таблица появится здесь.', 'zh-CN': '无结果。在上方运行 EN 或 RU scan — 完成后表格将显示在此处。', 'zh-TW': '無結果。在上方執行 EN 或 RU scan — 完成後表格將顯示在此處。' },
    'app.setupIssue': { en: 'Setup issue: ', es: 'Problema de setup: ', 'pt-BR': 'Problema de setup: ', ko: '설정 문제: ', ja: 'セットアップの問題: ', ru: 'Setup проблема: ', 'zh-CN': '设置问题:', 'zh-TW': '設定問題:' },
    'router.loading': { en: 'Loading…', es: 'Cargando…', 'pt-BR': 'Carregando…', ko: '로딩 중…', ja: '読み込み中…', ru: 'Загрузка…', 'zh-CN': '加载中…', 'zh-TW': '載入中…' },
    'router.netError':{ en: 'No connection to server', es: 'Sin conexión al servidor', 'pt-BR': 'Sem conexão com servidor', ko: '서버 연결 끊김', ja: 'サーバーに接続できません', ru: 'Нет связи с сервером', 'zh-CN': '与服务器无连接', 'zh-TW': '與伺服器無連線' },
    'router.error':   { en: 'Error', es: 'Error', 'pt-BR': 'Erro', ko: '오류', ja: 'エラー', ru: 'Ошибка', 'zh-CN': '错误', 'zh-TW': '錯誤' },
    'router.runStart':{ en: 'Run', es: 'Ejecutar', 'pt-BR': 'Executar', ko: '실행', ja: '実行', ru: 'Запустите', 'zh-CN': '运行', 'zh-TW': '執行' },
    'app.runDoctor':  { en: 'Running doctor.mjs…', es: 'Ejecutando doctor.mjs…', 'pt-BR': 'Executando doctor.mjs…', ko: 'doctor.mjs 실행 중…', ja: 'doctor.mjs 実行中…', ru: 'Запускаю doctor.mjs…', 'zh-CN': '正在运行 doctor.mjs…', 'zh-TW': '正在執行 doctor.mjs…' },
    'scan.failedPortals':{en: 'Failed to load portals.yml', es: 'Error al cargar portals.yml', 'pt-BR': 'Falha ao carregar portals.yml', ko: 'portals.yml 로드 실패', ja: 'portals.yml の読み込みに失敗', ru: 'Не удалось загрузить portals.yml', 'zh-CN': '无法加载 portals.yml', 'zh-TW': '無法載入 portals.yml' },
    'scan.allDisabled':{en: 'All companies disabled (enabled: false).', es: 'Todas las empresas deshabilitadas.', 'pt-BR': 'Todas as empresas desabilitadas.', ko: '모든 회사가 비활성화됨.', ja: 'すべての会社が無効です。', ru: 'Все компании отключены (enabled: false).', 'zh-CN': '所有公司已禁用。', 'zh-TW': '所有公司已停用。' },
    'scan.shownTop':  { en: 'Showing first 200 of', es: 'Mostrando primeros 200 de', 'pt-BR': 'Mostrando primeiros 200 de', ko: '처음 200개 표시 / 총', ja: '最初の 200 件を表示 / 合計', ru: 'Показаны первые 200 из', 'zh-CN': '显示前 200 (共', 'zh-TW': '顯示前 200 (共' },
    'scan.scanResultsApi':{en: 'API configured', es: 'API configurada', 'pt-BR': 'API configurada', ko: 'API 구성됨', ja: 'API 設定済み', ru: 'API настроен', 'zh-CN': 'API 已配置', 'zh-TW': 'API 已設定' },
    'scan.websearchOnly':{en: 'websearch only — scanner skips', es: 'solo websearch — scanner omite', 'pt-BR': 'apenas websearch — scanner ignora', ko: 'websearch만 — scanner 건너뜀', ja: 'websearch のみ — scanner はスキップ', ru: 'websearch only — scanner skip', 'zh-CN': '仅 websearch — scanner 跳过', 'zh-TW': '僅 websearch — scanner 跳過' },
    'conn.recovered': { en: 'Connection restored', es: 'Conexión restaurada', 'pt-BR': 'Conexão restaurada', ko: '연결 복원됨', ja: '接続が復元されました', ru: 'Соединение восстановлено', 'zh-CN': '连接已恢复', 'zh-TW': '連線已恢復' },
    'scan.startEnv':  { en: 'Run', es: 'Ejecuta', 'pt-BR': 'Execute', ko: '실행', ja: '実行', ru: 'Запустите', 'zh-CN': '运行', 'zh-TW': '執行' },

    // Pipeline
    'pipe.title':     { en: 'Pipeline', es: 'Pipeline', 'pt-BR': 'Pipeline', ko: '파이프라인', ja: 'パイプライン', ru: 'Pipeline', 'zh-CN': '流水线', 'zh-TW': '流水線' },
    'pipe.subtitle':  { en: 'Queue of vacancy URLs awaiting evaluation.', es: 'Cola de URLs de vacantes esperando evaluación.', 'pt-BR': 'Fila de URLs de vagas aguardando avaliação.', ko: '평가 대기 중인 채용 공고 URL 대기열.', ja: '評価待ちの求人 URL のキュー。', ru: 'Очередь URL вакансий, ожидающих оценки.', 'zh-CN': '等待评估的职位 URL 队列。', 'zh-TW': '等待評估的職位 URL 佇列。' },
    'pipe.add':       { en: 'Add URL', es: 'Añadir URL', 'pt-BR': 'Adicionar URL', ko: 'URL 추가', ja: 'URL を追加', ru: 'Добавить URL', 'zh-CN': '添加 URL', 'zh-TW': '新增 URL' },
    'pipe.empty':     { en: 'Pipeline is empty. Add a URL below or run a scan.', es: 'El pipeline está vacío. Añade una URL o ejecuta un scan.', 'pt-BR': 'Pipeline vazio. Adicione uma URL ou execute scan.', ko: '파이프라인이 비어 있습니다. URL을 추가하거나 scan을 실행하세요.', ja: 'パイプラインは空です。URL を追加するか scan を実行してください。', ru: 'Pipeline пуст. Добавьте URL ниже или запустите Scan.', 'zh-CN': '流水线为空。在下方添加 URL 或运行 scan。', 'zh-TW': '流水線為空。在下方新增 URL 或執行 scan。' },
    'pipe.evaluateBtn':{ en: 'Evaluate', es: 'Evaluar', 'pt-BR': 'Avaliar', ko: '평가', ja: '評価', ru: 'Оценить', 'zh-CN': '评估', 'zh-TW': '評估' },
    'pipe.confirmDel':{ en: 'Delete URL from pipeline?', es: '¿Eliminar URL del pipeline?', 'pt-BR': 'Excluir URL do pipeline?', ko: '파이프라인에서 URL을 삭제하시겠습니까?', ja: 'パイプラインから URL を削除しますか?', ru: 'Удалить URL из pipeline?', 'zh-CN': '从流水线删除 URL?', 'zh-TW': '從流水線刪除 URL?' },
    'pipe.deleted':   { en: 'Deleted', es: 'Eliminado', 'pt-BR': 'Excluído', ko: '삭제됨', ja: '削除しました', ru: 'Удалено', 'zh-CN': '已删除', 'zh-TW': '已刪除' },
    'pipe.added':     { en: 'Added to pipeline', es: 'Añadido al pipeline', 'pt-BR': 'Adicionado ao pipeline', ko: '파이프라인에 추가됨', ja: 'パイプラインに追加しました', ru: 'Добавлено в pipeline', 'zh-CN': '已添加到流水线', 'zh-TW': '已新增至流水線' },
    'pipe.noResults': { en: 'Pipeline is empty.', es: 'Pipeline vacío.', 'pt-BR': 'Pipeline vazio.', ko: '파이프라인이 비어 있습니다.', ja: 'パイプラインは空です。', ru: 'Pipeline пуст.', 'zh-CN': '流水线为空。', 'zh-TW': '流水線為空。' },
    'pipe.placeholder':{ en: 'https://job-boards.greenhouse.io/...', es: 'https://job-boards.greenhouse.io/...', 'pt-BR': 'https://job-boards.greenhouse.io/...', ko: 'https://job-boards.greenhouse.io/...', ja: 'https://job-boards.greenhouse.io/...', ru: 'https://job-boards.greenhouse.io/...', 'zh-CN': 'https://job-boards.greenhouse.io/...', 'zh-TW': 'https://job-boards.greenhouse.io/...' },
    'pipe.enterUrl':  { en: 'Enter URL', es: 'Introduce URL', 'pt-BR': 'Insira URL', ko: 'URL 입력', ja: 'URL を入力', ru: 'Введите URL', 'zh-CN': '输入 URL', 'zh-TW': '輸入 URL' },
    'pipe.hint':      { en: 'URL is saved to data/pipeline.md. From Claude Code you can run /career-ops pipeline for batch processing.', es: 'URL se guarda en data/pipeline.md.', 'pt-BR': 'URL salva em data/pipeline.md.', ko: 'URL이 data/pipeline.md에 저장됩니다.', ja: 'URL は data/pipeline.md に保存されます。', ru: 'URL сохраняется в data/pipeline.md. Из Claude Code можно запустить /career-ops pipeline для пакетной обработки.', 'zh-CN': 'URL 保存到 data/pipeline.md。', 'zh-TW': 'URL 儲存到 data/pipeline.md。' },

    // Evaluate extras
    'eval.saveJd':    { en: 'Save JD to jds/', es: 'Guardar JD en jds/', 'pt-BR': 'Salvar JD em jds/', ko: 'JD를 jds/에 저장', ja: 'JD を jds/ に保存', ru: 'Сохранить JD в jds/', 'zh-CN': '将 JD 保存到 jds/', 'zh-TW': '將 JD 儲存到 jds/' },
    'eval.evaluating':{ en: 'Evaluating…', es: 'Evaluando…', 'pt-BR': 'Avaliando…', ko: '평가 중…', ja: '評価中…', ru: 'Оценка…', 'zh-CN': '评估中…', 'zh-TW': '評估中…' },
    'eval.shortJd':   { en: 'JD too short (min 50 chars)', es: 'JD demasiado corto (min 50 chars)', 'pt-BR': 'JD muito curto (min 50 chars)', ko: 'JD가 너무 짧음 (최소 50자)', ja: 'JD が短すぎます (最低 50 文字)', ru: 'JD слишком короткий (min 50 chars)', 'zh-CN': 'JD 过短 (最少 50 字符)', 'zh-TW': 'JD 過短 (最少 50 字元)' },
    'eval.placeholder':{ en: 'Paste the full JD text (responsibilities, requirements, qualifications, about the role…)', es: 'Pega el texto completo del JD…', 'pt-BR': 'Cole o texto completo do JD…', ko: '전체 JD 텍스트를 붙여넣으세요…', ja: '完全な JD テキストを貼り付けてください…', ru: 'Вставьте полный текст вакансии (responsibilities, requirements, qualifications, about the role…)', 'zh-CN': '粘贴完整的 JD 文本…', 'zh-TW': '貼上完整的 JD 文字…' },
    'eval.manualMode':{ en: 'Manual mode (no GEMINI_API_KEY)', es: 'Modo manual (sin GEMINI_API_KEY)', 'pt-BR': 'Modo manual (sem GEMINI_API_KEY)', ko: '수동 모드 (GEMINI_API_KEY 없음)', ja: '手動モード (GEMINI_API_KEY なし)', ru: 'Manual mode (нет GEMINI_API_KEY)', 'zh-CN': '手动模式 (无 GEMINI_API_KEY)', 'zh-TW': '手動模式 (無 GEMINI_API_KEY)' },
    'eval.copy':      { en: '⧉ Copy prompt', es: '⧉ Copiar prompt', 'pt-BR': '⧉ Copiar prompt', ko: '⧉ 프롬프트 복사', ja: '⧉ プロンプトをコピー', ru: '⧉ Скопировать промпт', 'zh-CN': '⧉ 复制 prompt', 'zh-TW': '⧉ 複製 prompt' },
    'eval.copied':    { en: 'Prompt copied', es: 'Prompt copiado', 'pt-BR': 'Prompt copiado', ko: '프롬프트 복사됨', ja: 'プロンプトをコピーしました', ru: 'Промпт скопирован', 'zh-CN': 'Prompt 已复制', 'zh-TW': 'Prompt 已複製' },
    'eval.copyHint':  { en: 'Copy this prompt and paste into Claude/ChatGPT/Gemini.', es: 'Copia este prompt y pégalo en Claude/ChatGPT/Gemini.', 'pt-BR': 'Copie este prompt e cole no Claude/ChatGPT/Gemini.', ko: '이 프롬프트를 복사하여 Claude/ChatGPT/Gemini에 붙여넣으세요.', ja: 'このプロンプトをコピーして Claude/ChatGPT/Gemini に貼り付けてください。', ru: 'Скопируйте промпт ниже и вставьте в Claude Code или другой LLM.', 'zh-CN': '复制此 prompt 并粘贴到 Claude/ChatGPT/Gemini。', 'zh-TW': '複製此 prompt 並貼到 Claude/ChatGPT/Gemini。' },

    // Deep / Apply
    'deep.title':     { en: 'Deep research', es: 'Investigación profunda', 'pt-BR': 'Pesquisa profunda', ko: '심층 조사', ja: 'ディープ調査', ru: 'Deep research', 'zh-CN': '深度研究', 'zh-TW': '深度研究' },
    'deep.subtitle':  { en: 'Company brief: team, culture, news, negotiation leverage, smart questions.', es: 'Briefing de empresa: equipo, cultura, noticias, palancas de negociación, preguntas inteligentes.', 'pt-BR': 'Briefing da empresa: equipe, cultura, notícias, alavancas de negociação, perguntas inteligentes.', ko: '회사 브리핑: 팀, 문화, 뉴스, 협상 지렛대, 영리한 질문.', ja: '会社ブリーフィング: チーム、文化、ニュース、交渉のレバレッジ、賢明な質問。', ru: 'Брифинг компании: команда, культура, новости, переговорные позиции, smart questions.', 'zh-CN': '公司简报:团队、文化、新闻、谈判杠杆、聪明的问题。', 'zh-TW': '公司簡報:團隊、文化、新聞、談判槓桿、聰明的問題。' },
    'deep.companyLbl':{ en: 'Company', es: 'Empresa', 'pt-BR': 'Empresa', ko: '회사', ja: '会社', ru: 'Компания', 'zh-CN': '公司', 'zh-TW': '公司' },
    'deep.roleLbl':   { en: 'Role', es: 'Rol', 'pt-BR': 'Vaga', ko: '직무', ja: '役割', ru: 'Роль', 'zh-CN': '职位', 'zh-TW': '職位' },
    'deep.run':       { en: '▶ Generate prompt', es: '▶ Generar prompt', 'pt-BR': '▶ Gerar prompt', ko: '▶ 프롬프트 생성', ja: '▶ プロンプト生成', ru: '▶ Сгенерировать промпт', 'zh-CN': '▶ 生成 prompt', 'zh-TW': '▶ 產生 prompt' },
    'deep.companyExample':{ en: 'e.g. Wheely', es: 'ej. Wheely', 'pt-BR': 'ex. Wheely', ko: '예: Wheely', ja: '例: Wheely', ru: 'Например, Wheely', 'zh-CN': '例如:Wheely', 'zh-TW': '例如:Wheely' },
    'deep.roleExample':{ en: 'Senior Backend Engineer (optional)', es: 'Senior Backend Engineer (opcional)', 'pt-BR': 'Senior Backend Engineer (opcional)', ko: 'Senior Backend Engineer (선택사항)', ja: 'Senior Backend Engineer (オプション)', ru: 'Senior Backend Engineer (опционально)', 'zh-CN': 'Senior Backend Engineer (可选)', 'zh-TW': 'Senior Backend Engineer (可選)' },
    'deep.enterCompany':{ en: 'Enter company', es: 'Introduce empresa', 'pt-BR': 'Insira empresa', ko: '회사 입력', ja: '会社を入力', ru: 'Введите компанию', 'zh-CN': '输入公司', 'zh-TW': '輸入公司' },
    'deep.generating':{ en: 'Generating…', es: 'Generando…', 'pt-BR': 'Gerando…', ko: '생성 중…', ja: '生成中…', ru: 'Генерация…', 'zh-CN': '生成中…', 'zh-TW': '產生中…' },

    'apply.title':    { en: 'Apply helper', es: 'Asistente de aplicación', 'pt-BR': 'Assistente de aplicação', ko: '지원 도우미', ja: '応募ヘルパー', ru: 'Apply helper', 'zh-CN': '申请助手', 'zh-TW': '申請助手' },
    'apply.subtitle': { en: 'Application checklist. Real form-fill — via /career-ops apply in Claude Code (Playwright).', es: 'Checklist de aplicación. Form-fill real — vía /career-ops apply en Claude Code.', 'pt-BR': 'Checklist de aplicação. Form-fill real — via /career-ops apply no Claude Code.', ko: '지원 체크리스트. 실제 폼 채우기 — Claude Code의 /career-ops apply 사용.', ja: '応募チェックリスト。実際のフォーム入力は Claude Code の /career-ops apply で。', ru: 'Чек-лист подачи заявки. Реальное автозаполнение — через /career-ops apply в Claude Code (Playwright).', 'zh-CN': '申请清单。实际表单填写 — 通过 Claude Code 中的 /career-ops apply。', 'zh-TW': '申請清單。實際表單填寫 — 透過 Claude Code 中的 /career-ops apply。' },
    'apply.urlLbl':   { en: 'Vacancy URL', es: 'URL de la vacante', 'pt-BR': 'URL da vaga', ko: '채용 공고 URL', ja: '求人 URL', ru: 'URL вакансии', 'zh-CN': '职位 URL', 'zh-TW': '職位 URL' },
    'apply.jdLbl':    { en: 'JD (optional)', es: 'JD (opcional)', 'pt-BR': 'JD (opcional)', ko: 'JD (선택사항)', ja: 'JD (オプション)', ru: 'JD (опционально)', 'zh-CN': 'JD (可选)', 'zh-TW': 'JD (可選)' },
    'apply.run':      { en: '▶ Generate checklist', es: '▶ Generar checklist', 'pt-BR': '▶ Gerar checklist', ko: '▶ 체크리스트 생성', ja: '▶ チェックリスト生成', ru: '▶ Сформировать чек-лист', 'zh-CN': '▶ 生成清单', 'zh-TW': '▶ 產生清單' },
    'apply.enterUrl': { en: 'Enter URL', es: 'Introduce URL', 'pt-BR': 'Insira URL', ko: 'URL 입력', ja: 'URL を入力', ru: 'Введите URL', 'zh-CN': '输入 URL', 'zh-TW': '輸入 URL' },

    // Tracker / Reports / Settings extras
    'track.entriesIn':{ en: 'entries in', es: 'entradas en', 'pt-BR': 'entradas em', ko: '항목 (위치:', ja: '件 (場所:', ru: 'записей в', 'zh-CN': '条目位于', 'zh-TW': '項目位於' },
    'track.normalize':{ en: 'Normalize', es: 'Normalize', 'pt-BR': 'Normalize', ko: 'Normalize', ja: 'Normalize', ru: 'Normalize', 'zh-CN': 'Normalize', 'zh-TW': 'Normalize' },
    'track.dedup':    { en: 'Dedup', es: 'Dedup', 'pt-BR': 'Dedup', ko: 'Dedup', ja: 'Dedup', ru: 'Dedup', 'zh-CN': 'Dedup', 'zh-TW': 'Dedup' },
    'track.merge':    { en: 'Merge TSV', es: 'Merge TSV', 'pt-BR': 'Merge TSV', ko: 'Merge TSV', ja: 'Merge TSV', ru: 'Merge TSV', 'zh-CN': 'Merge TSV', 'zh-TW': 'Merge TSV' },
    'track.report':   { en: 'Report', es: 'Reporte', 'pt-BR': 'Relatório', ko: '보고서', ja: 'レポート', ru: 'Отчёт', 'zh-CN': '报告', 'zh-TW': '報告' },
    'track.runStart': { en: 'Running…', es: 'Ejecutando…', 'pt-BR': 'Executando…', ko: '실행 중…', ja: '実行中…', ru: 'Запускаю…', 'zh-CN': '运行中…', 'zh-TW': '執行中…' },
    'track.done':     { en: 'Done', es: 'Listo', 'pt-BR': 'Concluído', ko: '완료', ja: '完了', ru: 'Готово', 'zh-CN': '完成', 'zh-TW': '完成' },
    'track.scoreHigh':{ en: '≥ 4.0', es: '≥ 4.0', 'pt-BR': '≥ 4.0', ko: '≥ 4.0', ja: '≥ 4.0', ru: '≥ 4.0', 'zh-CN': '≥ 4.0', 'zh-TW': '≥ 4.0' },
    'track.scoreMid': { en: '≥ 3.0', es: '≥ 3.0', 'pt-BR': '≥ 3.0', ko: '≥ 3.0', ja: '≥ 3.0', ru: '≥ 3.0', 'zh-CN': '≥ 3.0', 'zh-TW': '≥ 3.0' },
    'track.scoreLow': { en: '< 3.0', es: '< 3.0', 'pt-BR': '< 3.0', ko: '< 3.0', ja: '< 3.0', ru: '< 3.0', 'zh-CN': '< 3.0', 'zh-TW': '< 3.0' },
    'track.noMatch':  { en: 'No matches', es: 'Sin coincidencias', 'pt-BR': 'Sem correspondências', ko: '일치 항목 없음', ja: '一致なし', ru: 'Нет совпадений', 'zh-CN': '无匹配', 'zh-TW': '無匹配' },
    'track.col.date': { en: 'Date', es: 'Fecha', 'pt-BR': 'Data', ko: '날짜', ja: '日付', ru: 'Дата', 'zh-CN': '日期', 'zh-TW': '日期' },
    'track.col.status':{ en: 'Status', es: 'Estado', 'pt-BR': 'Status', ko: '상태', ja: 'ステータス', ru: 'Статус', 'zh-CN': '状态', 'zh-TW': '狀態' },

    'rep.allReports': { en: '← All reports', es: '← Todos los reportes', 'pt-BR': '← Todos relatórios', ko: '← 모든 보고서', ja: '← すべてのレポート', ru: '← Все отчёты', 'zh-CN': '← 所有报告', 'zh-TW': '← 所有報告' },
    'rep.openJd':     { en: 'Open JD ↗', es: 'Abrir JD ↗', 'pt-BR': 'Abrir JD ↗', ko: 'JD 열기 ↗', ja: 'JD を開く ↗', ru: 'Открыть JD ↗', 'zh-CN': '打开 JD ↗', 'zh-TW': '開啟 JD ↗' },
    'rep.inDir':      { en: 'reports in', es: 'reportes en', 'pt-BR': 'relatórios em', ko: '보고서 (위치:', ja: 'レポート (場所:', ru: 'отчётов в', 'zh-CN': '报告位于', 'zh-TW': '報告位於' },

    'set.targetRoles':{ en: 'Target roles', es: 'Roles objetivo', 'pt-BR': 'Vagas-alvo', ko: '목표 역할', ja: '対象役割', ru: 'Целевые роли', 'zh-CN': '目标角色', 'zh-TW': '目標角色' },
    'set.archetypes': { en: 'Archetypes', es: 'Arquetipos', 'pt-BR': 'Arquétipos', ko: '아키타입', ja: 'アーキタイプ', ru: 'Архетипы', 'zh-CN': '原型', 'zh-TW': '原型' },
    'set.rawYaml':    { en: 'YAML (raw)', es: 'YAML (raw)', 'pt-BR': 'YAML (raw)', ko: 'YAML (raw)', ja: 'YAML (raw)', ru: 'YAML (raw)', 'zh-CN': 'YAML (raw)', 'zh-TW': 'YAML (raw)' },
    'set.show':       { en: 'Show', es: 'Mostrar', 'pt-BR': 'Mostrar', ko: '표시', ja: '表示', ru: 'Показать', 'zh-CN': '显示', 'zh-TW': '顯示' },
    'set.notFound':   { en: 'config/profile.yml not found.', es: 'config/profile.yml no encontrado.', 'pt-BR': 'config/profile.yml não encontrado.', ko: 'config/profile.yml을 찾을 수 없습니다.', ja: 'config/profile.yml が見つかりません。', ru: 'config/profile.yml не найден.', 'zh-CN': '找不到 config/profile.yml。', 'zh-TW': '找不到 config/profile.yml。' },
    'set.name':       { en: 'Name', es: 'Nombre', 'pt-BR': 'Nome', ko: '이름', ja: '名前', ru: 'Имя', 'zh-CN': '姓名', 'zh-TW': '姓名' },
    'set.email':      { en: 'Email', es: 'Email', 'pt-BR': 'Email', ko: '이메일', ja: 'メール', ru: 'Email', 'zh-CN': '邮箱', 'zh-TW': '電郵' },
    'set.location':   { en: 'Location', es: 'Ubicación', 'pt-BR': 'Localização', ko: '위치', ja: '場所', ru: 'Локация', 'zh-CN': '位置', 'zh-TW': '位置' },

    // Evaluate
    'eval.title':     { en: 'Evaluate vacancy', es: 'Evaluar vacante', 'pt-BR': 'Avaliar vaga', ko: '채용 공고 평가', ja: '求人を評価', ru: 'Оценить вакансию', 'zh-CN': '评估职位', 'zh-TW': '評估職位' },
    'eval.subtitle':  { en: 'Full A–G analysis: Role, CV match, Risks, Comp, Strategy, Verdict, Legitimacy.', es: 'Análisis A–G completo: Rol, ajuste CV, Riesgos, Comp, Estrategia, Veredicto, Legitimidad.', 'pt-BR': 'Análise A–G completa: Vaga, fit CV, Riscos, Comp, Estratégia, Veredicto, Legitimidade.', ko: '전체 A–G 분석: 역할, CV 일치, 위험, 보상, 전략, 평가, 정당성.', ja: '完全な A–G 分析: 役割、CV 一致、リスク、報酬、戦略、評決、正当性。', ru: 'Полный А–G анализ: Role, CV match, Risks, Comp, Strategy, Verdict, Legitimacy.', 'zh-CN': '完整 A-G 分析:角色、CV 匹配、风险、薪酬、策略、判定、合法性。', 'zh-TW': '完整 A-G 分析:角色、CV 匹配、風險、薪酬、策略、判定、合法性。' },
    'eval.jdLbl':     { en: 'Job Description', es: 'Descripción del puesto', 'pt-BR': 'Descrição da vaga', ko: '채용 공고', ja: '職務記述', ru: 'Job Description', 'zh-CN': '职位描述', 'zh-TW': '職位描述' },
    'eval.btnEval':   { en: '▶ Evaluate', es: '▶ Evaluar', 'pt-BR': '▶ Avaliar', ko: '▶ 평가', ja: '▶ 評価', ru: '▶ Оценить', 'zh-CN': '▶ 评估', 'zh-TW': '▶ 評估' },
    'eval.btnClear':  { en: 'Clear', es: 'Limpiar', 'pt-BR': 'Limpar', ko: '지우기', ja: 'クリア', ru: 'Очистить', 'zh-CN': '清除', 'zh-TW': '清除' },

    // Health
    'health.title':   { en: 'Health', es: 'Estado', 'pt-BR': 'Saúde', ko: '상태', ja: 'ヘルス', ru: 'Health', 'zh-CN': '健康', 'zh-TW': '健康' },

    // Tracker
    'track.title':    { en: 'Application tracker', es: 'Tracker de aplicaciones', 'pt-BR': 'Tracker de aplicações', ko: '지원 트래커', ja: '応募トラッカー', ru: 'Трекер заявок', 'zh-CN': '申请跟踪器', 'zh-TW': '申請追蹤器' },
    'track.allStatus':{ en: 'all statuses', es: 'todos los estados', 'pt-BR': 'todos status', ko: '모든 상태', ja: 'すべてのステータス', ru: 'все статусы', 'zh-CN': '所有状态', 'zh-TW': '所有狀態' },
    'track.anyScore': { en: 'any score', es: 'cualquier score', 'pt-BR': 'qualquer score', ko: '모든 점수', ja: '任意のスコア', ru: 'любой score', 'zh-CN': '任意分数', 'zh-TW': '任意分數' },
    'track.search':   { en: 'Search by company / role…', es: 'Buscar por empresa / rol…', 'pt-BR': 'Buscar por empresa / vaga…', ko: '회사/직무로 검색…', ja: '会社/役割で検索…', ru: 'Поиск по компании / роли…', 'zh-CN': '按公司/职位搜索…', 'zh-TW': '依公司/職位搜尋…' },

    // Reports
    'rep.title':      { en: 'Reports', es: 'Reportes', 'pt-BR': 'Relatórios', ko: '보고서', ja: 'レポート', ru: 'Отчёты', 'zh-CN': '报告', 'zh-TW': '報告' },
    'rep.empty':      { en: 'No reports yet. Make your first evaluation.', es: 'Aún no hay reportes. Haz tu primera evaluación.', 'pt-BR': 'Ainda sem relatórios. Faça sua primeira avaliação.', ko: '아직 보고서가 없습니다. 첫 평가를 수행하세요.', ja: 'まだレポートがありません。最初の評価を行ってください。', ru: 'Отчётов пока нет. Сделайте первую оценку.', 'zh-CN': '尚无报告。进行首次评估。', 'zh-TW': '尚無報告。進行首次評估。' },

    // CV
    'cv.title':       { en: 'CV', es: 'CV', 'pt-BR': 'CV', ko: '이력서', ja: '履歴書', ru: 'CV', 'zh-CN': '简历', 'zh-TW': '履歷' },
    'cv.subtitle':    { en: 'Source of truth for evaluations. All scripts read cv.md.', es: 'Fuente de verdad para evaluaciones. Todos los scripts leen cv.md.', 'pt-BR': 'Fonte de verdade para avaliações. Todos os scripts leem cv.md.', ko: '평가의 진실 소스. 모든 스크립트가 cv.md를 읽습니다.', ja: '評価の真実の情報源。すべてのスクリプトが cv.md を読みます。', ru: 'Источник истины для оценки. Все скрипты читают cv.md.', 'zh-CN': '评估的真实来源。所有脚本读取 cv.md。', 'zh-TW': '評估的真實來源。所有指令稿讀取 cv.md。' },
    'cv.markdown':    { en: 'Markdown', es: 'Markdown', 'pt-BR': 'Markdown', ko: '마크다운', ja: 'Markdown', ru: 'Markdown', 'zh-CN': 'Markdown', 'zh-TW': 'Markdown' },
    'cv.preview':     { en: 'Preview', es: 'Vista previa', 'pt-BR': 'Pré-visualização', ko: '미리보기', ja: 'プレビュー', ru: 'Превью', 'zh-CN': '预览', 'zh-TW': '預覽' },
    'cv.upload':      { en: 'Upload CV', es: 'Cargar CV', 'pt-BR': 'Carregar CV', ko: '이력서 업로드', ja: '履歴書をアップロード', ru: 'Загрузить CV', 'zh-CN': '上传简历', 'zh-TW': '上傳履歷' },
    'cv.saved':       { en: 'Saved', es: 'Guardado', 'pt-BR': 'Salvo', ko: '저장됨', ja: '保存済み', ru: 'Сохранено', 'zh-CN': '已保存', 'zh-TW': '已儲存' },

    // Settings/Profile
    'set.title':      { en: 'Profile', es: 'Perfil', 'pt-BR': 'Perfil', ko: '프로필', ja: 'プロフィール', ru: 'Профиль', 'zh-CN': '个人资料', 'zh-TW': '個人資料' },
    'set.subtitle':   { en: 'Read-only. Edit config/profile.yml in the project.', es: 'Solo lectura. Edita config/profile.yml en el proyecto.', 'pt-BR': 'Somente leitura. Edite config/profile.yml no projeto.', ko: '읽기 전용. 프로젝트에서 config/profile.yml 편집.', ja: '読み取り専用。プロジェクトの config/profile.yml を編集してください。', ru: 'Read-only. Редактируйте config/profile.yml в проекте.', 'zh-CN': '只读。在项目中编辑 config/profile.yml。', 'zh-TW': '唯讀。在專案中編輯 config/profile.yml。' },

    // Connection banner
    'conn.down':      { en: 'Server is not responding.', es: 'El servidor no responde.', 'pt-BR': 'O servidor não está respondendo.', ko: '서버가 응답하지 않습니다.', ja: 'サーバーが応答していません。', ru: 'Сервер не отвечает.', 'zh-CN': '服务器未响应。', 'zh-TW': '伺服器未回應。' },
    'conn.recovered': { en: 'Connection restored', es: 'Conexión restaurada', 'pt-BR': 'Conexão restaurada', ko: '연결 복원됨', ja: '接続が復元されました', ru: 'Соединение восстановлено', 'zh-CN': '连接已恢复', 'zh-TW': '連線已恢復' },
  };

  const STORAGE_KEY = 'career-ops-ui:lang';
  let current = (localStorage.getItem(STORAGE_KEY) || detect()).split('-')[0] === 'pt' ? 'pt-BR' : (localStorage.getItem(STORAGE_KEY) || detect());
  if (!LANGS.find((l) => l.code === current)) current = 'en';

  function detect() {
    const browser = (navigator.language || 'en').toLowerCase();
    if (browser.startsWith('pt')) return 'pt-BR';
    if (browser.startsWith('zh-tw') || browser.startsWith('zh-hk')) return 'zh-TW';
    if (browser.startsWith('zh')) return 'zh-CN';
    if (browser.startsWith('ko')) return 'ko';
    if (browser.startsWith('ja')) return 'ja';
    if (browser.startsWith('es')) return 'es';
    if (browser.startsWith('ru')) return 'ru';
    return 'en';
  }

  function t(key, fallback) {
    const entry = DICT[key];
    if (!entry) return fallback || key;
    return entry[current] || entry.en || fallback || key;
  }

  const subscribers = [];
  function onChange(fn) { subscribers.push(fn); }

  function setLang(code) {
    if (!LANGS.find((l) => l.code === code)) return;
    current = code;
    localStorage.setItem(STORAGE_KEY, code);
    document.documentElement.lang = code;
    subscribers.forEach((fn) => { try { fn(code); } catch {} });
  }

  function getLang() { return current; }
  function getLangs() { return LANGS.slice(); }

  // Initial document.lang attribute
  document.documentElement.lang = current;

  return { t, setLang, getLang, getLangs, onChange };
})();
