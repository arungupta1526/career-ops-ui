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
    'scan.btnEn':     { en: '🌍 EN scan', es: '🌍 EN scan', 'pt-BR': '🌍 EN scan', ko: '🌍 EN scan', ja: '🌍 EN scan', ru: '🌍 EN scan', 'zh-CN': '🌍 EN scan', 'zh-TW': '🌍 EN scan' },
    'scan.btnRu':     { en: '🇷🇺 RU scan', es: '🇷🇺 RU scan', 'pt-BR': '🇷🇺 RU scan', ko: '🇷🇺 RU scan', ja: '🇷🇺 RU scan', ru: '🇷🇺 RU scan', 'zh-CN': '🇷🇺 RU scan', 'zh-TW': '🇷🇺 RU scan' },
    'scan.btnPipe':   { en: 'Pipeline', es: 'Pipeline', 'pt-BR': 'Pipeline', ko: '파이프라인', ja: 'パイプライン', ru: 'Pipeline', 'zh-CN': '流水线', 'zh-TW': '流水線' },
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

    // Pipeline
    'pipe.title':     { en: 'Pipeline', es: 'Pipeline', 'pt-BR': 'Pipeline', ko: '파이프라인', ja: 'パイプライン', ru: 'Pipeline', 'zh-CN': '流水线', 'zh-TW': '流水線' },
    'pipe.subtitle':  { en: 'Queue of vacancy URLs awaiting evaluation.', es: 'Cola de URLs de vacantes esperando evaluación.', 'pt-BR': 'Fila de URLs de vagas aguardando avaliação.', ko: '평가 대기 중인 채용 공고 URL 대기열.', ja: '評価待ちの求人 URL のキュー。', ru: 'Очередь URL вакансий, ожидающих оценки.', 'zh-CN': '等待评估的职位 URL 队列。', 'zh-TW': '等待評估的職位 URL 佇列。' },
    'pipe.add':       { en: 'Add URL', es: 'Añadir URL', 'pt-BR': 'Adicionar URL', ko: 'URL 추가', ja: 'URL を追加', ru: 'Добавить URL', 'zh-CN': '添加 URL', 'zh-TW': '新增 URL' },
    'pipe.empty':     { en: 'Pipeline is empty. Add a URL below or run a scan.', es: 'El pipeline está vacío. Añade una URL o ejecuta un scan.', 'pt-BR': 'Pipeline vazio. Adicione uma URL ou execute scan.', ko: '파이프라인이 비어 있습니다. URL을 추가하거나 scan을 실행하세요.', ja: 'パイプラインは空です。URL を追加するか scan を実行してください。', ru: 'Pipeline пуст. Добавьте URL ниже или запустите Scan.', 'zh-CN': '流水线为空。在下方添加 URL 或运行 scan。', 'zh-TW': '流水線為空。在下方新增 URL 或執行 scan。' },

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
